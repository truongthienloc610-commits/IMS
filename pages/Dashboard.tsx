import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Package, CheckCircle, AlertTriangle, Wrench, Activity, Camera, Bell, Shield, UserCheck, Smartphone, Layers, ArrowRight, Map as MapIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import ModelViewer3D from '@/components/ModelViewer3D';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Dashboard({ theme }: { theme: string }) {
  const [stats, setStats] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFloorData, setSelectedFloorData] = useState<any>(null);
  const navigate = useNavigate();
  const myModelUrl = '/models/Export.gltf';

  const floors = Array.from({ length: 13 }, (_, i) => i + 1);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsData, assetsData] = await Promise.all([
        api.get('/stats'),
        api.get('/assets')
      ]);
      setStats(statsData);
      setAssets(assetsData);
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 p-4 text-center transition-colors">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Lỗi Kết Nối</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
      <button 
        onClick={() => { setError(null); fetchStats(); }}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
      >
        Thử lại
      </button>
    </div>
  );

  if (!stats) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải dữ liệu hệ thống an ninh...</div>;

  const chartData = [
    { name: 'Sẵn sàng', value: stats.ready, color: '#10b981' },
    { name: 'Đang dùng', value: stats.inUse, color: '#3b82f6' },
    { name: 'Hỏng', value: stats.broken, color: '#ef4444' },
    { name: 'Bảo trì', value: stats.maintenance, color: '#f59e0b' },
  ];

  // Logic to dynamically generate markers based on assets' locations
  const getFloorFromLocation = (loc: string) => {
    if (!loc) return 1;
    // Extract numbers: handles P1, P10, 101, 1301 etc.
    const match = loc.match(/(\d+)/);
    if (!match) return 1;
    const numStr = match[1];
    const num = parseInt(numStr);
    
    // If it's a 3 or 4 digit number like 101, 1301, the floor is the leading part
    if (numStr.length >= 3) {
      return Math.floor(num / 100);
    }
    // If it's P1, P10 etc, the number is the floor
    return num;
  };

  const FLOOR_HEIGHT = 15;
  const FLOOR_1_Y = -95;

  const dynamicMarkers = Array.from(new Set(assets.map(a => getFloorFromLocation(a.location))))
    .filter(floor => floor >= 1 && floor <= 13) // Only for valid floors
    .map(floor => {
      const isUpperFloor = floor >= 7;
      // Aggressive recessed shift: Moving closer to center (X=-0.6) and deeper (Z=-3.8)
      const x = isUpperFloor ? -0.6 : 1.8;
      const z = isUpperFloor ? -3.8 : 1.2;
      
      return {
        id: `floor-${floor}`,
        position: [x, FLOOR_1_Y + (floor - 1) * FLOOR_HEIGHT, z],
        label: `THIẾT BỊ TẦNG ${floor}`,
        side: isUpperFloor ? 'left' : 'right', // Point labels away from the building center
        onClick: () => {
          const floorAssets = assets.filter(a => getFloorFromLocation(a.location) === floor);
          setSelectedFloorData({ floor, assets: floorAssets });
        }
      };
    })
    .sort((a, b) => {
       // Extract floor numbers for sorting
       const fA = parseInt(a.id.split('-')[1]);
       const fB = parseInt(b.id.split('-')[1]);
       return fA - fB;
    });

  return (
    <div className="flex flex-col h-full space-y-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 min-h-screen transition-colors">
      {/* Header Info Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 uppercase">Quản Lý Hệ Thống Cơ Sở Hạ Tầng</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase">Trạng thái: Ổn định • Đang giám sát 3D trực tuyến</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-[10px] font-mono text-slate-600 dark:text-slate-400">
           <div className="flex items-center space-x-2">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
             <span>HỆ THỐNG TRỰC TUYẾN</span>
           </div>
           <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 font-bold">
             {format(new Date(), 'HH:mm:ss')}
           </div>
        </div>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* Left Side: Events List */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-3 flex flex-col space-y-4 overflow-hidden"
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 flex-1 flex flex-col overflow-hidden shadow-sm">
            <CardHeader className="py-3 border-b border-slate-100 dark:border-slate-700 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-xs font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase">Sự kiện gần đây</CardTitle>
              <Bell className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar max-h-[300px] lg:max-h-none">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {stats.recentLogs && stats.recentLogs.length > 0 ? (
                  stats.recentLogs.map((log: any) => (
                    <div key={log.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center relative">
                          {log.action === 'checkout' ? <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <Smartphone className="h-5 w-5 text-slate-400" />}
                          <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 border border-white dark:border-slate-800" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{log.asset_name}</p>
                            <span className="text-[9px] text-slate-400 font-mono italic">
                              {(() => {
                                try {
                                  const d = new Date(log.timestamp);
                                  return isNaN(d.getTime()) ? '--:--' : format(d, 'HH:mm');
                                } catch (e) {
                                  return '--:--';
                                }
                              })()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{log.user_name}</p>
                          <Badge variant="secondary" className={`mt-2 text-[8px] h-4 py-0 font-bold tracking-tighter ${
                            log.action === 'checkout' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 
                            log.action === 'report-broken' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 
                            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {log.action.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-[10px] text-slate-400 font-bold italic">KHÔNG CÓ DỮ LIỆU GẦN ĐÂY</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Center: 3D Map View with Floor Selector */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-6 relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800 min-h-[400px]"
        >
          <ModelViewer3D 
            modelUrl={myModelUrl} 
            theme={theme} 
            markers={dynamicMarkers}
          />
          
          {/* TOP FLOOR SELECTOR (Horizontal) - Floors 7-13 */}
          <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
             <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-2 rounded-full shadow-lg flex items-center space-x-1 pointer-events-auto">
                <div className="px-3 border-r border-slate-200 dark:border-slate-700 mr-1 flex items-center gap-1">
                   <Layers className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">TRÊN:</span>
                </div>
                {floors.slice(6, 13).map(floor => (
                  <button
                    key={floor}
                    onClick={() => navigate(`/map?floor=${floor}`)}
                    title={`Chuyển đến sơ đồ Tầng ${floor}`}
                    className="w-9 h-9 rounded-full flex flex-col items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all border border-transparent hover:border-blue-400 group/btn"
                  >
                    <span className="text-[8px] opacity-60 group-hover/btn:text-white/80">T</span>
                    {floor}
                  </button>
                ))}
             </div>
          </div>

          {/* SIDE FLOOR SELECTOR (Vertical) - Floors 1-6 */}
          <div className="absolute top-20 left-4 flex flex-col space-y-1 pointer-events-auto">
             <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-2 rounded-2xl shadow-lg flex flex-col space-y-2">
                <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-700">
                   <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">DƯỚI</span>
                </div>
                {floors.slice(0, 6).reverse().map(floor => (
                  <button
                    key={floor}
                    onClick={() => navigate(`/map?floor=${floor}`)}
                    title={`Chuyển đến sơ đồ Tầng ${floor}`}
                    className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
                  >
                    <span className="text-[8px] opacity-60">Tầng</span>
                    {floor}
                  </button>
                ))}
             </div>
          </div>

          {/* Dashboard Overlays on Map */}
          <div className="absolute top-4 right-4 pointer-events-auto">
             <button 
                onClick={() => navigate('/map')}
                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all group"
             >
                <MapIcon className="h-3 w-3" />
                XEM SƠ ĐỒ CHI TIẾT
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col space-y-3 pointer-events-none">
             <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm w-48">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-2 uppercase tracking-widest flex justify-between items-center">
                   Biểu đồ lưu lượng <ArrowRight className="h-3 w-3" />
                </p>
                <div className="flex items-end space-x-1 h-10">
                   {[40, 70, 30, 90, 50, 60, 20].map((h, i) => (
                     <div key={i} className="flex-1 bg-blue-600/30 border-t border-blue-600/40 rounded-t-sm" style={{ height: `${h}%` }} />
                   ))}
                </div>
             </div>
          </div>

          <div className="absolute bottom-4 left-4 flex flex-col space-y-2">
             <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm pointer-events-auto">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                     <Activity className="h-3 w-3 text-emerald-500" /> THÔNG TIN NỔI BẬT
                   </p>
                   <Badge className="bg-emerald-500 text-white text-[8px] h-4">LIVE</Badge>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                         <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100">Panasonic Inverter</p>
                         <p className="text-[8px] text-slate-400 uppercase font-bold">Phòng 101 • Tầng 1</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between pt-1 border-t dark:border-slate-700">
                      <span className="text-[9px] text-slate-500">Trạng thái:</span>
                      <span className="text-[9px] font-bold text-emerald-500 uppercase">Hoạt động tốt</span>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Right Side: Charts & Device Status */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-3 flex flex-col space-y-4"
        >
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'TỔNG THIẾT BỊ', val: stats.total, icon: Package, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
              { label: 'SẴN SÀNG', val: stats.ready, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
              { label: 'BÁO HỎNG', val: stats.broken, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
              { label: 'BẢO TRÌ', val: stats.maintenance, icon: Wrench, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
            ].map((item, i) => (
              <div key={i} className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded shadow-sm`}>
                 <div className="flex justify-between items-start mb-1">
                    <div className={`p-1 rounded ${item.bg}`}>
                      <item.icon className={`h-3 w-3 ${item.color}`} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{item.val}</span>
                 </div>
                 <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold leading-none">{item.label}</p>
              </div>
            ))}
          </div>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 flex-1 flex flex-col pt-2 shadow-sm">
            <CardHeader className="py-2 border-b border-slate-50 dark:border-slate-700">
              <CardTitle className="text-xs font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase">Trạng thái thiết bị</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-3 space-y-4">
              <div className="h-32 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <ChartTooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid #334155', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none">
                   <div className="text-center">
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.total}</p>
                      <p className="text-[7px] text-slate-400 dark:text-slate-500 uppercase font-bold">Đơn vị</p>
                   </div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 w-full gap-2 px-2">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded border border-slate-100 dark:border-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 flex-1 truncate font-medium">{d.name}</span>
                    <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2 rounded flex items-center justify-between shadow-sm">
             <div className="flex items-center space-x-2">
                <Shield className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-[9px] text-blue-700 dark:text-blue-300 font-bold uppercase tracking-widest">Đội an ninh</span>
             </div>
             <div className="flex -space-x-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white dark:border-slate-700 bg-blue-600 flex items-center justify-center text-[7px] font-bold text-white">L</div>
                ))}
                <div className="w-4 h-4 rounded-full border border-white dark:border-slate-700 bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[7px] text-slate-600 dark:text-slate-300 font-bold">+2</div>
             </div>
          </div>
        </motion.div>

      </div>

      <Dialog open={!!selectedFloorData} onOpenChange={() => setSelectedFloorData(null)}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-xl text-white">
                <Layers className="h-5 w-5" />
              </div>
              Danh sách thiết bị Tầng {selectedFloorData?.floor}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {selectedFloorData?.assets.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {selectedFloorData.assets.map((asset: any) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{asset.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-mono font-bold uppercase">{asset.id} • {asset.location}</p>
                      </div>
                    </div>
                    <Badge variant={asset.status === 'ready' ? 'default' : asset.status === 'in-use' ? 'secondary' : 'destructive'} className="font-bold">
                      {asset.status === 'ready' ? 'Sẵn sàng' : asset.status === 'in-use' ? 'Đang dùng' : 'Hỏng'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium italic">Không có thiết bị nào được ghi nhận tại tầng này.</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dữ liệu được cập nhật theo thời gian thực</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
