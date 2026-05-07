import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { db, initDb } from './db.ts';

const PORT = 3000;

async function startServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());

  // Initialize DB
  initDb();

  // --- Middleware ---
  const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = db.prepare('SELECT role, can_manage_users FROM users WHERE id = ?').get(userId) as any;
    if (user && (user.role === 'admin' || user.can_manage_users)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  };

  // --- API Routes ---
  
  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Check if user exists first
    const userExists = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    if (!userExists) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại trong hệ thống' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
    if (user) {
      if (Number(user.is_approved) !== 1) {
        return res.status(403).json({ error: 'Tài khoản của bạn đang chờ quản trị viên phê duyệt.' });
      }
      if (Number(user.is_locked) === 1) {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
      }
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          can_borrow: !!user.can_borrow,
          can_repair: !!user.can_repair,
          can_manage_users: !!user.can_manage_users
        } 
      });
    } else {
      res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, name, role, staff_code } = req.body;
    
    if (!email.toLowerCase().endsWith('@fpt.edu.vn')) {
      return res.status(400).json({ error: 'Email phải có đuôi @fpt.edu.vn' });
    }

    // Basic staff code validation (e.g., GV, FE, NV followed by numbers)
    const staffCodeRegex = /^(GV|FE|NV)\d+$/i;
    if (!staff_code || !staffCodeRegex.test(staff_code)) {
      return res.status(400).json({ error: 'Mã nhân viên/giảng viên không hợp lệ (Ví dụ: GV123, FE456)' });
    }

    try {
      const stmt = db.prepare('INSERT INTO users (email, password, name, role, staff_code, is_approved, can_borrow, can_repair, can_manage_users) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const info = stmt.run(
        email, 
        password, 
        name, 
        role || 'staff', 
        staff_code.toUpperCase(),
        0, // is_approved default false
        1, // can_borrow default true
        0, // can_repair default false
        0  // can_manage_users default false
      );
      res.json({ 
        message: 'Đăng ký thành công. Vui lòng chờ quản trị viên phê duyệt tài khoản của bạn.'
      });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Email này đã được đăng ký' });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  });

  // Assets
  app.get('/api/assets', (req, res) => {
    const assets = db.prepare(`
      SELECT assets.*, 
             (SELECT action FROM usage_logs WHERE asset_id = assets.id ORDER BY timestamp DESC LIMIT 1) as last_action,
             (SELECT users.name FROM usage_logs JOIN users ON usage_logs.user_id = users.id WHERE asset_id = assets.id ORDER BY timestamp DESC LIMIT 1) as last_user_name
      FROM assets 
      ORDER BY created_at DESC
    `).all();
    res.json(assets);
  });

  app.get('/api/assets/:id', (req, res) => {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  });

  app.get('/api/assets/:id/history', (req, res) => {
    const history = db.prepare(`
      SELECT usage_logs.*, users.name as user_name 
      FROM usage_logs 
      LEFT JOIN users ON usage_logs.user_id = users.id
      WHERE asset_id = ?
      ORDER BY timestamp DESC
    `).all(req.params.id);
    res.json(history);
  });

  app.post('/api/assets', (req, res) => {
    const { id, name, type, location, status, notes } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO assets (id, name, type, location, status, notes) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run(id, name, type, location, status || 'ready', notes || '');
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
      res.json(asset);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/assets/:id', (req, res) => {
    const { name, type, location, status, notes, user_id } = req.body;
    try {
      const oldAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id) as any;
      
      const stmt = db.prepare('UPDATE assets SET name = ?, type = ?, location = ?, status = ?, notes = ? WHERE id = ?');
      stmt.run(name, type, location, status, notes || '', req.params.id);
      
      if (oldAsset && oldAsset.status !== status && user_id) {
        let action = 'update';
        if (status === 'ready') action = 'checkin';
        else if (status === 'in-use') action = 'checkout';
        else if (status === 'broken') action = 'report-broken';
        else if (status === 'maintenance') action = 'maintenance';
        
        db.prepare('INSERT INTO usage_logs (asset_id, user_id, action, notes) VALUES (?, ?, ?, ?)').run(
          req.params.id, user_id, action, notes || ''
        );
      }
      
      const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
      res.json(asset);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/assets/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Users
  app.get('/api/users', isAdmin, (req, res) => {
    const users = db.prepare('SELECT id, email, name, role, staff_code, is_locked, is_approved, can_borrow, can_repair, can_manage_users, created_at FROM users').all();
    res.json(users);
  });

  app.patch('/api/users/:id/approve', isAdmin, (req, res) => {
    const { is_approved } = req.body;
    try {
      db.prepare('UPDATE users SET is_approved = ? WHERE id = ?').run(is_approved ? 1 : 0, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/users/:id/permissions', isAdmin, (req, res) => {
    const { can_borrow, can_repair, can_manage_users } = req.body;
    try {
      db.prepare(`
        UPDATE users 
        SET can_borrow = ?, can_repair = ?, can_manage_users = ? 
        WHERE id = ?
      `).run(
        can_borrow ? 1 : 0, 
        can_repair ? 1 : 0, 
        can_manage_users ? 1 : 0, 
        req.params.id
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/users/:id/lock', isAdmin, (req, res) => {
    const { is_locked } = req.body;
    try {
      db.prepare('UPDATE users SET is_locked = ? WHERE id = ?').run(is_locked ? 1 : 0, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', isAdmin, (req, res) => {
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/users/:id/current-asset', (req, res) => {
    const userCurrentAsset = db.prepare(`
      SELECT assets.* 
      FROM assets 
      JOIN usage_logs ON assets.id = usage_logs.asset_id 
      WHERE usage_logs.user_id = ? AND assets.status = 'in-use'
      AND usage_logs.id = (SELECT MAX(id) FROM usage_logs WHERE asset_id = assets.id)
    `).get(req.params.id) as any;
    res.json(userCurrentAsset || null);
  });

  // Usage Logs
  app.get('/api/logs', (req, res) => {
    const logs = db.prepare(`
      SELECT usage_logs.*, assets.name as asset_name, assets.type as asset_type, users.name as user_name 
      FROM usage_logs 
      LEFT JOIN assets ON usage_logs.asset_id = assets.id
      LEFT JOIN users ON usage_logs.user_id = users.id
      ORDER BY timestamp DESC
    `).all();
    res.json(logs);
  });

  app.post('/api/action', (req, res) => {
    const { asset_id, user_id, action, notes, new_location } = req.body;
    
    // Check if user is locked and permissions
    const user = db.prepare('SELECT is_locked, can_borrow, can_repair, role FROM users WHERE id = ?').get(user_id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.is_locked) {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa.' });
    }

    if (action === 'checkout' || action === 'checkin') {
      if (!user.can_borrow && user.role !== 'admin') {
        return res.status(403).json({ error: 'Bạn không có quyền mượn/trả thiết bị.' });
      }
    }

    if (action === 'maintenance' || action === 'ready') {
      if (!user.can_repair && user.role !== 'admin') {
        return res.status(403).json({ error: 'Bạn không có quyền quản lý bảo trì/sửa chữa.' });
      }
    }

    // Validate asset
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id) as any;
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    // Validate action logic
    if (action === 'checkout') {
      // Check if user is already borrowing something
      const userCurrentAsset = db.prepare(`
        SELECT assets.name 
        FROM assets 
        JOIN usage_logs ON assets.id = usage_logs.asset_id 
        WHERE usage_logs.user_id = ? AND assets.status = 'in-use'
        AND usage_logs.id = (SELECT MAX(id) FROM usage_logs WHERE asset_id = assets.id)
      `).get(user_id) as any;

      if (userCurrentAsset) {
        return res.status(400).json({ error: `Bạn đang mượn thiết bị "${userCurrentAsset.name}". Vui lòng trả thiết bị cũ trước khi mượn thiết bị mới.` });
      }

      if (asset.status !== 'ready') {
        const lastUser = db.prepare(`
          SELECT users.name 
          FROM usage_logs 
          JOIN users ON usage_logs.user_id = users.id 
          WHERE asset_id = ? AND action = 'checkout' 
          ORDER BY timestamp DESC LIMIT 1
        `).get(asset_id) as any;
        
        const userName = lastUser ? lastUser.name : 'người dùng khác';
        return res.status(400).json({ error: `Thiết bị này đang được sử dụng bởi ${userName}. Không thể mượn.` });
      }
      db.prepare('UPDATE assets SET status = ? WHERE id = ?').run('in-use', asset_id);
    } else if (action === 'checkin') {
      if (asset.status !== 'in-use') return res.status(400).json({ error: 'Thiết bị này hiện không được sử dụng, không thể trả.' });
      db.prepare('UPDATE assets SET status = ? WHERE id = ?').run('ready', asset_id);
    } else if (action === 'report-broken') {
      db.prepare('UPDATE assets SET status = ? WHERE id = ?').run('broken', asset_id);
    } else if (action === 'maintenance') {
      db.prepare('UPDATE assets SET status = ? WHERE id = ?').run('maintenance', asset_id);
    } else if (action === 'ready') {
      db.prepare('UPDATE assets SET status = ? WHERE id = ?').run('ready', asset_id);
    }

    // Update location if provided
    if (new_location && new_location !== asset.location) {
      db.prepare('UPDATE assets SET location = ? WHERE id = ?').run(new_location, asset_id);
    }

    // Create log
    const stmt = db.prepare('INSERT INTO usage_logs (asset_id, user_id, action, notes) VALUES (?, ?, ?, ?)');
    stmt.run(asset_id, user_id, action, notes || '');

    res.json({ success: true, asset: db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id) });
  });

  // Repairs
  app.get('/api/repairs', (req, res) => {
    const repairs = db.prepare(`
      SELECT repairs.*, assets.name as asset_name, users.name as user_name 
      FROM repairs 
      JOIN assets ON repairs.asset_id = assets.id 
      JOIN users ON repairs.user_id = users.id
      ORDER BY repairs.created_at DESC
    `).all();
    res.json(repairs);
  });

  app.post('/api/repairs', (req, res) => {
    const { asset_id, user_id, description } = req.body;
    
    const user = db.prepare('SELECT can_repair, role FROM users WHERE id = ?').get(user_id) as any;
    if (!user || (!user.can_repair && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Bạn không có quyền gửi yêu cầu sửa chữa.' });
    }

    try {
      db.prepare('INSERT INTO repairs (asset_id, user_id, description) VALUES (?, ?, ?)').run(asset_id, user_id, description);
      db.prepare('UPDATE assets SET status = ? WHERE id = ?').run('maintenance', asset_id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/repairs/:id', (req, res) => {
    const { status, cost } = req.body;
    try {
      const repair = db.prepare('SELECT * FROM repairs WHERE id = ?').get(req.params.id) as any;
      if (!repair) return res.status(404).json({ error: 'Repair record not found' });

      if (status === 'completed') {
        db.prepare('UPDATE repairs SET status = ?, cost = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, cost || 0, req.params.id);
        db.prepare('UPDATE assets SET status = ? WHERE id = ?').run('ready', repair.asset_id);
      } else {
        db.prepare('UPDATE repairs SET status = ?, cost = ? WHERE id = ?').run(status, cost || 0, req.params.id);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Dashboard Stats
  app.get('/api/stats', (req, res) => {
    const total = (db.prepare('SELECT COUNT(*) as count FROM assets').get() as any).count;
    const inUse = (db.prepare('SELECT COUNT(*) as count FROM assets WHERE status = ?').get('in-use') as any).count;
    const broken = (db.prepare('SELECT COUNT(*) as count FROM assets WHERE status = ?').get('broken') as any).count;
    const maintenance = (db.prepare('SELECT COUNT(*) as count FROM assets WHERE status = ?').get('maintenance') as any).count;
    const ready = (db.prepare('SELECT COUNT(*) as count FROM assets WHERE status = ?').get('ready') as any).count;
    
    // Recent logs
    const recentLogs = db.prepare(`
      SELECT usage_logs.*, assets.name as asset_name, assets.type as asset_type, users.name as user_name 
      FROM usage_logs 
      LEFT JOIN assets ON usage_logs.asset_id = assets.id
      LEFT JOIN users ON usage_logs.user_id = users.id
      ORDER BY timestamp DESC LIMIT 5
    `).all();

    res.json({ total, inUse, broken, maintenance, ready, recentLogs });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
