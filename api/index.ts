import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// --- Supabase client (inline, no dotenv needed on Vercel) ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
app.use(cors());
app.use(express.json());

// --- Middleware ---
const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { data: user } = await supabase
    .from('users')
    .select('role, can_manage_users')
    .eq('id', userId)
    .single();

  if (user && (user.role === 'admin' || user.can_manage_users)) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};

// --- API Routes ---
app.get('/api/ping', (_req, res) => {
  res.json({ message: 'pong', hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email?.toLowerCase().trim();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', cleanEmail)
    .eq('password', password)
    .single();

  if (error || !user) {
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: `Lỗi hệ thống: ${error.message}` });
    }
    
    const { data: exists } = await supabase.from('users').select('id').eq('email', cleanEmail).single();
    if (!exists) return res.status(401).json({ error: 'Tài khoản không tồn tại trong hệ thống' });
    return res.status(401).json({ error: 'Mật khẩu không chính xác' });
  }

  if (!user.is_approved) {
    return res.status(403).json({ error: 'Tài khoản của bạn đang chờ quản trị viên phê duyệt.' });
  }
  if (user.is_locked) {
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
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, staff_code } = req.body;
  
  const cleanEmail = email?.toLowerCase().trim();
  if (!cleanEmail.endsWith('@fpt.edu.vn')) {
    return res.status(400).json({ error: 'Email phải có đuôi @fpt.edu.vn' });
  }

  const staffCodeRegex = /^(GV|FE|NV)\d+$/i;
  if (!staff_code || !staffCodeRegex.test(staff_code)) {
    return res.status(400).json({ error: 'Mã nhân viên/giảng viên không hợp lệ (Ví dụ: GV123, FE456)' });
  }

  const { error } = await supabase.from('users').insert({
    email: cleanEmail, 
    password, 
    name, 
    role: role || 'staff', 
    staff_code: staff_code.toUpperCase(),
    is_approved: false,
    can_borrow: true,
    can_repair: false,
    can_manage_users: false
  });

  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email này đã được đăng ký' });
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: 'Đăng ký thành công. Vui lòng chờ quản trị viên phê duyệt tài khoản của bạn.' });
});

// Assets
app.get('/api/assets', async (_req, res) => {
  const { data: assets, error } = await supabase
    .from('assets')
    .select(`
      *,
      usage_logs (
        action,
        users (name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const transformed = (assets || []).map((a: any) => {
    const lastLog = a.usage_logs && a.usage_logs.length > 0 ? a.usage_logs[a.usage_logs.length - 1] : null;
    return {
      ...a,
      last_action: lastLog?.action,
      last_user_name: lastLog?.users?.name
    };
  });

  res.json(transformed);
});

app.get('/api/assets/:id', async (req, res) => {
  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Asset not found' });
  res.json(asset);
});

app.get('/api/assets/:id/history', async (req, res) => {
  const { data: history, error } = await supabase
    .from('usage_logs')
    .select('*, users(name)')
    .eq('asset_id', req.params.id)
    .order('timestamp', { ascending: false });
  
  if (error) return res.status(400).json({ error: error.message });
  
  const transformed = (history || []).map((h: any) => ({
    ...h,
    user_name: h.users?.name
  }));
  
  res.json(transformed);
});

app.post('/api/assets', async (req, res) => {
  const { id, name, type, location, status, notes } = req.body;
  const { data: asset, error } = await supabase
    .from('assets')
    .insert({ id, name, type, location, status: status || 'ready', notes: notes || '' })
    .select()
    .single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(asset);
});

app.put('/api/assets/:id', async (req, res) => {
  const { name, type, location, status, notes, user_id } = req.body;
  
  const { data: oldAsset } = await supabase.from('assets').select('status').eq('id', req.params.id).single();
  
  const { data: asset, error } = await supabase
    .from('assets')
    .update({ name, type, location, status, notes: notes || '' })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (oldAsset && oldAsset.status !== status && user_id) {
    let action = 'update';
    if (status === 'ready') action = 'checkin';
    else if (status === 'in-use') action = 'checkout';
    else if (status === 'broken') action = 'report-broken';
    else if (status === 'maintenance') action = 'maintenance';
    
    await supabase.from('usage_logs').insert({
      asset_id: req.params.id,
      user_id,
      action,
      notes: notes || ''
    });
  }

  res.json(asset);
});

app.delete('/api/assets/:id', async (req, res) => {
  const { error } = await supabase.from('assets').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Users
app.get('/api/users', isAdmin, async (_req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, role, staff_code, is_locked, is_approved, can_borrow, can_repair, can_manage_users, created_at');
  if (error) return res.status(400).json({ error: error.message });
  res.json(users);
});

app.patch('/api/users/:id/approve', isAdmin, async (req, res) => {
  const { is_approved } = req.body;
  const { error } = await supabase.from('users').update({ is_approved }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.patch('/api/users/:id/permissions', isAdmin, async (req, res) => {
  const { can_borrow, can_repair, can_manage_users } = req.body;
  const { error } = await supabase.from('users').update({ can_borrow, can_repair, can_manage_users }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.patch('/api/users/:id/lock', isAdmin, async (req, res) => {
  const { is_locked } = req.body;
  const { error } = await supabase.from('users').update({ is_locked }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/users/:id', isAdmin, async (req, res) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Usage Logs
app.get('/api/logs', async (_req, res) => {
  const { data: logs, error } = await supabase
    .from('usage_logs')
    .select('*, assets(name, type), users(name)')
    .order('timestamp', { ascending: false });
  
  if (error) return res.status(400).json({ error: error.message });
  
  const transformed = (logs || []).map((l: any) => ({
    ...l,
    asset_name: l.assets?.name,
    asset_type: l.assets?.type,
    user_name: l.users?.name
  }));
  
  res.json(transformed);
});

app.post('/api/action', async (req, res) => {
  const { asset_id, user_id, action, notes, new_location } = req.body;
  
  const { data: user } = await supabase.from('users').select('*').eq('id', user_id).single();
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (user.is_locked) return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa.' });

  if (action === 'checkout' || action === 'checkin') {
    if (!user.can_borrow && user.role !== 'admin') return res.status(403).json({ error: 'Bạn không có quyền mượn/trả thiết bị.' });
  }

  const { data: asset } = await supabase.from('assets').select('*').eq('id', asset_id).single();
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  if (action === 'checkout') {
    if (asset.status !== 'ready') return res.status(400).json({ error: `Thiết bị này đang được sử dụng. Không thể mượn.` });
    await supabase.from('assets').update({ status: 'in-use' }).eq('id', asset_id);
  } else if (action === 'checkin') {
    if (asset.status !== 'in-use') return res.status(400).json({ error: 'Thiết bị này hiện không được sử dụng.' });
    await supabase.from('assets').update({ status: 'ready' }).eq('id', asset_id);
  } else if (action === 'report-broken') {
    await supabase.from('assets').update({ status: 'broken' }).eq('id', asset_id);
  } else if (action === 'maintenance') {
    await supabase.from('assets').update({ status: 'maintenance' }).eq('id', asset_id);
  } else if (action === 'ready') {
    await supabase.from('assets').update({ status: 'ready' }).eq('id', asset_id);
  }

  if (new_location && new_location !== asset.location) {
    await supabase.from('assets').update({ location: new_location }).eq('id', asset_id);
  }

  await supabase.from('usage_logs').insert({ asset_id, user_id, action, notes: notes || '' });

  const { data: finalAsset } = await supabase.from('assets').select('*').eq('id', asset_id).single();
  res.json({ success: true, asset: finalAsset });
});

// Repairs
app.get('/api/repairs', async (_req, res) => {
  const { data: repairs, error } = await supabase
    .from('repairs')
    .select('*, assets(name), users(name)')
    .order('created_at', { ascending: false });
  
  if (error) return res.status(400).json({ error: error.message });
  
  const transformed = (repairs || []).map((r: any) => ({
    ...r,
    asset_name: r.assets?.name,
    user_name: r.users?.name
  }));
  
  res.json(transformed);
});

app.post('/api/repairs', async (req, res) => {
  const { asset_id, user_id, description } = req.body;
  const { error } = await supabase.from('repairs').insert({ asset_id, user_id, description });
  if (error) return res.status(400).json({ error: error.message });
  await supabase.from('assets').update({ status: 'maintenance' }).eq('id', asset_id);
  res.json({ success: true });
});

// Stats
app.get('/api/stats', async (_req, res) => {
  const { data: assets } = await supabase.from('assets').select('status');
  const stats = {
    total: assets?.length || 0,
    inUse: assets?.filter(a => a.status === 'in-use').length || 0,
    broken: assets?.filter(a => a.status === 'broken').length || 0,
    maintenance: assets?.filter(a => a.status === 'maintenance').length || 0,
    ready: assets?.filter(a => a.status === 'ready').length || 0,
  };
  
  const { data: recentLogs } = await supabase
    .from('usage_logs')
    .select('*, assets(name, type), users(name)')
    .order('timestamp', { ascending: false })
    .limit(5);

  const transformedLogs = recentLogs?.map((l: any) => ({
    ...l,
    asset_name: l.assets?.name,
    asset_type: l.assets?.type,
    user_name: l.users?.name
  })) || [];

  res.json({ ...stats, recentLogs: transformedLogs });
});

// Export for Vercel serverless
export default app;
