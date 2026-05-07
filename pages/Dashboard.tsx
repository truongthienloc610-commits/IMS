import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Package, CheckCircle, AlertTriangle, Wrench, Activity, Camera, Bell, Shield, UserCheck, Smartphone, Layers, ArrowRight, Map as MapIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import ModelViewer3D from '@/components/ModelViewer3D';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const myModelUrl = '/models/Export.gltf';

  // Consolidate floors to 13 (Tầng 1 -> Tầng 13)
  const floors = Array.from({ length: 13 }, (_, i) => i + 1);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-800 mb-2">Lỗi Kết Nối</h2>
      <p className="text-slate-500 mb-6">{error}</p>
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

  return (
    <div className="flex flex-col h-full space-y-4 bg-slate-50 text-slate-900 p-4 min-h-screen">
      {/* Header Info Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">Quản Lý Hệ Thống Cơ Sở Hạ Tầng</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Trạng thái: Ổn định • Đang giám sát 3D trực tuyến</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-[10px] font-mono text-slate-600">
           <div className="flex items-center space-x-2">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
             <span>HỆ THỐNG TRỰC TUYẾN</span>
           </div>
           <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded text-slate-700 font-bold">
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
          <Card className="bg-white border-slate-200 text-slate-900 flex-1 flex flex-col overflow-hidden shadow-sm">
            <CardHeader className="py-3 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
              <CardTitle className="text-xs font-bold tracking-widest text-slate-600 uppercase">Sự kiện gần đây</CardTitle>
              <Bell className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar max-h-[300px] lg:max-h-none">
              <div className="divide-y divide-slate-100">
                {stats.recentLogs && stats.recentLogs.length > 0 ? (
                  stats.recentLogs.map((log: any) => (
                    <div key={log.id} className="p-3 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                          {log.action === 'checkout' ? <UserCheck className="h-5 w-5 text-blue-600" /> : <Smartphone className="h-5 w-5 text-slate-400" />}
                          <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 border border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{log.asset_name}</p>
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
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{log.user_name}</p>
                          <Badge variant="secondary" className={`mt-2 text-[8px] h-4 py-0 font-bold tracking-tighter ${
                            log.action === 'checkout' ? 'bg-blue-100 text-blue-700' : 
                            log.action === 'report-broken' ? 'bg-red-100 text-red-700' : 
                            'bg-slate-100 text-slate-600'
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
          className="col-span-12 lg:col-span-6 relative rounded-lg overflow-hidden border border-slate-200 shadow-md bg-white min-h-[400px]"
        >
          <ModelViewer3D modelUrl={myModelUrl} />
          
          {/* TOP FLOOR SELECTOR (Horizontal) - Floors 7-13 */}
          <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
             <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-full shadow-lg flex items-center space-x-1 pointer-events-auto">
                <div className="px-3 border-r border-slate-200 mr-1 flex items-center gap-1">
                   <Layers className="h-3 w-3 text-blue-600" />
                   <span className="text-[10px] font-bold text-slate-600">TRÊN:</span>
                </div>
                {floors.slice(6, 13).map(floor => (
                  <button
                    key={floor}
                    onClick={() => navigate(`/map?floor=${floor}`)}
                    title={`Chuyển đến sơ đồ Tầng ${floor}`}
                    className="w-9 h-9 rounded-full flex flex-col items-center justify-center text-[10px] font-bold text-slate-600 hover:bg-blue-600 hover:text-white transition-all border border-transparent hover:border-blue-400 group/btn"
                  >
                    <span className="text-[8px] opacity-60 group-hover/btn:text-white/80">T</span>
                    {floor}
                  </button>
                ))}
             </div>
          </div>

          {/* SIDE FLOOR SELECTOR (Vertical) - Floors 1-6 */}
          <div className="absolute top-20 left-4 flex flex-col space-y-1 pointer-events-auto">
             <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-lg flex flex-col space-y-2">
                <div className="text-center pb-2 border-b border-slate-100">
                   <span className="text-[10px] font-bold text-slate-400">DƯỚI</span>
                </div>
                {floors.slice(0, 6).reverse().map(floor => (
                  <button
                    key={floor}
                    onClick={() => navigate(`/map?floor=${floor}`)}
                    title={`Chuyển đến sơ đồ Tầng ${floor}`}
                    className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white transition-all border border-slate-100 shadow-sm"
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
                className="bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all group"
             >
                <MapIcon className="h-3 w-3" />
                XEM SƠ ĐỒ CHI TIẾT
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col space-y-3 pointer-events-none">
             <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-lg shadow-sm w-48">
                <p className="text-[10px] text-slate-600 font-bold mb-2 uppercase tracking-widest flex justify-between items-center">
                   Biểu đồ lưu lượng <ArrowRight className="h-3 w-3" />
                </p>
                <div className="flex items-end space-x-1 h-10">
                   {[40, 70, 30, 90, 50, 60, 20].map((h, i) => (
                     <div key={i} className="flex-1 bg-blue-600/30 border-t border-blue-600/40 rounded-t-sm" style={{ height: `${h}%` }} />
                   ))}
                </div>
             </div>
          </div>

          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-lg shadow-sm pointer-events-none">
             <p className="text-[10px] text-slate-600 font-bold mb-2 uppercase tracking-widest flex items-center gap-1">
               <Camera className="h-3 w-3 text-blue-600" /> GIÁM SÁT TRỰC TUYẾN
             </p>
             <div className="flex gap-6">
                <div>
                   <p className="text-xl font-bold text-slate-800 leading-none">12</p>
                   <p className="text-[8px] text-slate-400 uppercase font-bold">Phòng mở</p>
                </div>
                <div>
                   <p className="text-xl font-bold text-blue-600 leading-none">85</p>
                   <p className="text-[8px] text-slate-400 uppercase font-bold">Tài sản</p>
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
              { label: 'TỔNG THIẾT BỊ', val: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'SẴN SÀNG', val: stats.ready, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'BÁO HỎNG', val: stats.broken, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'BẢO TRÌ', val: stats.maintenance, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((item, i) => (
              <div key={i} className={`bg-white border border-slate-200 p-2 rounded shadow-sm`}>
                 <div className="flex justify-between items-start mb-1">
                    <div className={`p-1 rounded ${item.bg}`}>
                      <item.icon className={`h-3 w-3 ${item.color}`} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-800">{item.val}</span>
                 </div>
                 <p className="text-[8px] text-slate-500 font-bold leading-none">{item.label}</p>
              </div>
            ))}
          </div>

          <Card className="bg-white border-slate-200 text-slate-900 flex-1 flex flex-col pt-2 shadow-sm">
            <CardHeader className="py-2 border-b border-slate-50">
              <CardTitle className="text-xs font-bold tracking-widest text-slate-600 uppercase">Trạng thái thiết bị</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-3 space-y-4">
              <div className="h-32 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none">
                   <div className="text-center">
                      <p className="text-lg font-bold text-slate-800 leading-none">{stats.total}</p>
                      <p className="text-[7px] text-slate-400 uppercase font-bold">Đơn vị</p>
                   </div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 w-full gap-2 px-2">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[9px] text-slate-600 flex-1 truncate font-medium">{d.name}</span>
                    <span className="text-[9px] font-bold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-100 p-2 rounded flex items-center justify-between shadow-sm">
             <div className="flex items-center space-x-2">
                <Shield className="h-3 w-3 text-blue-600" />
                <span className="text-[9px] text-blue-700 font-bold uppercase tracking-widest">Đội an ninh</span>
             </div>
             <div className="flex -space-x-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white bg-blue-600 flex items-center justify-center text-[7px] font-bold text-white">L</div>
                ))}
                <div className="w-4 h-4 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[7px] text-slate-600 font-bold">+2</div>
             </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
