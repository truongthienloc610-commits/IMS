import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Search, Wrench, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function Repairs({ user }: { user: any }) {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [updateData, setUpdateData] = useState({ status: '', cost: 0 });

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const data = await api.get('/repairs');
      setRepairs(data);
    } catch (err: any) {
      toast.error('Lỗi tải danh sách sửa chữa');
    }
  };

  const openUpdate = (repair: any) => {
    setSelectedRepair(repair);
    setUpdateData({ status: repair.status, cost: repair.cost || 0 });
    setIsUpdateOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;
    try {
      await api.patch(`/repairs/${selectedRepair.id}`, updateData);
      toast.success('Cập nhật trạng thái sửa chữa thành công');
      setIsUpdateOpen(false);
      setSelectedRepair(null);
      fetchRepairs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredRepairs = repairs.filter(r => {
    const searchLower = search.toLowerCase();
    return (r.asset_name?.toLowerCase() || '').includes(searchLower) || 
           (r.asset_id?.toLowerCase() || '').includes(searchLower) ||
           (r.description?.toLowerCase() || '').includes(searchLower) ||
           (r.user_name?.toLowerCase() || '').includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Dịch vụ sửa chữa</h1>
      </div>

      <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Tìm kiếm theo tên thiết bị, mã QA, mô tả hoặc người báo..." 
              className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-all h-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow className="dark:border-slate-800">
                <TableHead className="font-bold dark:text-slate-300">Thiết bị</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Mô tả lỗi</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Người báo</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Ngày báo</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Trạng thái</TableHead>
                <TableHead className="font-bold dark:text-slate-300">Chi phí</TableHead>
                <TableHead className="text-right font-bold dark:text-slate-300">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepairs.map((r) => (
                <TableRow key={r.id} className="dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <TableCell>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{r.asset_name}</div>
                    <div className="text-xs text-primary/80 font-mono font-bold uppercase">{r.asset_id}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate dark:text-slate-400" title={r.description}>{r.description}</TableCell>
                  <TableCell className="dark:text-slate-300">{r.user_name}</TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-500">{format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Badge variant={
                      r.status === 'pending' ? 'outline' :
                      r.status === 'in-progress' ? 'secondary' :
                      r.status === 'completed' ? 'default' : 'destructive'
                    } className="flex w-fit items-center gap-1 font-bold">
                      {r.status === 'pending' ? <Clock className="h-3 w-3" /> : 
                       r.status === 'in-progress' ? <Wrench className="h-3 w-3" /> : 
                       <CheckCircle2 className="h-3 w-3" />}
                      {r.status === 'pending' ? 'Chờ xử lý' :
                       r.status === 'in-progress' ? 'Đang sửa' : 'Đã xong'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.cost ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        {r.cost.toLocaleString('vi-VN')} đ
                      </span>
                    ) : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {(user.role === 'admin' || user.can_repair) && (
                      <Button variant="outline" size="sm" onClick={() => openUpdate(r)} className="dark:bg-slate-800 dark:border-slate-700 transition-all font-bold">
                        Cập nhật
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRepairs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Không có yêu cầu sửa chữa nào
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUpdateOpen} onOpenChange={(open) => !open && setIsUpdateOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái sửa chữa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={updateData.status} onValueChange={v => setUpdateData({...updateData, status: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="in-progress">Đang sửa chữa</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chi phí sửa chữa (VNĐ)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  className="pl-8"
                  value={updateData.cost} 
                  onChange={e => setUpdateData({...updateData, cost: parseInt(e.target.value) || 0})} 
                  placeholder="0" 
                />
              </div>
            </div>
            <Button type="submit" className="w-full">Lưu thay đổi</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
