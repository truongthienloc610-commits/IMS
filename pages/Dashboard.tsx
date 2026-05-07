import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Package, CheckCircle, AlertTriangle, Wrench, Activity, Map } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;

  const chartData = [
    { name: 'Sẵn sàng', value: stats.ready, color: '#10b981' },
    { name: 'Đang sử dụng', value: stats.inUse, color: '#3b82f6' },
    { name: 'Hỏng', value: stats.broken, color: '#ef4444' },
    { name: 'Bảo trì', value: stats.maintenance, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Tổng quan hệ thống</h1>
      
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng thiết bị</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Sẵn sàng</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.ready}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Đang dùng</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.inUse}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Báo hỏng</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.broken}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Bảo trì</CardTitle>
            <Wrench className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      <Link to="/map" className="block">
        <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Map className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-lg">Sơ đồ tòa nhà</div>
                <div className="text-sm text-muted-foreground">Xem vị trí các thiết bị đang được sử dụng theo thời gian thực</div>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">Xem ngay</Badge>
          </CardContent>
        </Card>
      </Link>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Thiết bị</TableHead>
                    <TableHead className="text-xs">Hành động</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Người thực hiện</TableHead>
                    <TableHead className="text-xs">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">{log.asset_name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          log.action === 'checkout' ? 'default' :
                          log.action === 'checkin' ? 'secondary' :
                          log.action === 'report-broken' ? 'destructive' : 'outline'
                        } className="text-[10px] sm:text-xs px-1 sm:px-2">
                          {log.action === 'checkout' ? 'Mượn' :
                           log.action === 'checkin' ? 'Trả' :
                           log.action === 'report-broken' ? 'Hỏng' : 
                           log.action === 'maintenance' ? 'Bảo trì' : 'Sẵn sàng'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{log.user_name}</TableCell>
                      <TableCell className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'HH:mm dd/MM')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Trạng thái thiết bị</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
