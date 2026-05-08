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
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, QrCode, Search, Trash2, Edit, Download, Wrench, History } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function Assets({ user }: { user: any }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isRepairOpen, setIsRepairOpen] = useState(false);
  const [editAssetId, setEditAssetId] = useState<string | null>(null);
  const [maintenanceAsset, setMaintenanceAsset] = useState<any>(null);
  const [repairAsset, setRepairAsset] = useState<any>(null);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [repairDescription, setRepairDescription] = useState('');
  const [qrAsset, setQrAsset] = useState<any>(null);
  const [historyAsset, setHistoryAsset] = useState<any>(null);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', type: '', location: '', status: 'ready', notes: '' });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await api.get('/assets');
      setAssets(data);
    } catch (err: any) {
      toast.error('Lỗi tải danh sách thiết bị');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = `QA-${uuidv4().substring(0, 8).toUpperCase()}`;
      await api.post('/assets', { ...formData, id });
      toast.success('Thêm thiết bị thành công');
      setIsAddOpen(false);
      setFormData({ name: '', type: '', location: '', status: 'ready', notes: '' });
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEdit = (asset: any) => {
    setFormData({ name: asset.name, type: asset.type, location: asset.location, status: asset.status, notes: asset.notes || '' });
    setEditAssetId(asset.id);
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAssetId) return;
    try {
      await api.put(`/assets/${editAssetId}`, { ...formData, user_id: user.id });
      toast.success('Cập nhật thiết bị thành công');
      setIsEditOpen(false);
      setEditAssetId(null);
      setFormData({ name: '', type: '', location: '', status: 'ready', notes: '' });
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openMaintenance = (asset: any) => {
    setMaintenanceAsset(asset);
    setMaintenanceNotes('');
    setIsMaintenanceOpen(true);
  };

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceAsset) return;
    try {
      await api.post('/action', {
        asset_id: maintenanceAsset.id,
        user_id: user.id,
        action: 'maintenance',
        notes: maintenanceNotes
      });
      toast.success('Đã chuyển thiết bị sang trạng thái bảo trì');
      setIsMaintenanceOpen(false);
      setMaintenanceAsset(null);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openRepair = (asset: any) => {
    setRepairAsset(asset);
    setRepairDescription('');
    setIsRepairOpen(true);
  };

  const handleRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairAsset) return;
    try {
      await api.post('/repairs', {
        asset_id: repairAsset.id,
        user_id: user.id,
        description: repairDescription
      });
      toast.success('Đã gửi yêu cầu sửa chữa');
      setIsRepairOpen(false);
      setRepairAsset(null);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteAssetId) return;
    try {
      await api.delete(`/assets/${deleteAssetId}`);
      toast.success('Đã xóa thiết bị');
      setDeleteAssetId(null);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openHistory = async (asset: any) => {
    setHistoryAsset(asset);
    try {
      const history = await api.get(`/assets/${asset.id}/history`);
      setAssetHistory(history);
    } catch (err) {
      toast.error('Lỗi tải lịch sử thiết bị');
    }
  };

  const filteredAssets = assets.filter(a => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (a.name?.toLowerCase() || '').includes(searchLower) || 
                          (a.id?.toLowerCase() || '').includes(searchLower) ||
                          (a.location?.toLowerCase() || '').includes(searchLower) ||
                          (a.type?.toLowerCase() || '').includes(searchLower) ||
                          (a.notes?.toLowerCase() || '').includes(searchLower);
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesLocation = filterLocation === 'all' || a.location === filterLocation;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    
    return matchesSearch && matchesType && matchesLocation && matchesStatus;
  });

  const uniqueTypes = Array.from(new Set(assets.map(a => a.type))).sort();
  const uniqueLocations = Array.from(new Set(assets.map(a => a.location))).sort();

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Danh sách thiết bị - FPT Poly ĐN', 14, 15);
    const tableColumn = ["Mã QA", "Tên thiết bị", "Loại", "Vị trí", "Trạng thái"];
    const tableRows = filteredAssets.map(asset => [
      asset.id, asset.name, asset.type, asset.location,
      asset.status === 'ready' ? 'Sẵn sàng' : asset.status === 'in-use' ? 'Đang sử dụng' : asset.status === 'broken' ? 'Hỏng' : 'Bảo trì'
    ]);
    (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Danh_sach_thiet_bi_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredAssets.map(asset => ({
      'Mã QA': asset.id,
      'Tên thiết bị': asset.name,
      'Loại': asset.type,
      'Vị trí': asset.location,
      'Trạng thái': asset.status === 'ready' ? 'Sẵn sàng' : asset.status === 'in-use' ? 'Đang sử dụng' : asset.status === 'broken' ? 'Hỏng' : 'Bảo trì'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thiết bị");
    XLSX.writeFile(wb, `Danh_sach_thiet_bi_${format(new Date(), 'ddMMyyyy')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Danh sách thiết bị</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportPDF} className="dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-all">
            <Download className="mr-2 h-4 w-4" /> Xuất PDF
          </Button>
          <Button variant="outline" onClick={exportExcel} className="dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-all">
            <Download className="mr-2 h-4 w-4" /> Xuất Excel
          </Button>
          {(user.role === 'admin') && (
            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) setFormData({ name: '', type: '', location: '', status: 'ready', notes: '' });
            }}>
              <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90" />}>
                <Plus className="mr-2 h-4 w-4" /> Thêm thiết bị
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Thêm thiết bị mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tên thiết bị</Label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Máy chiếu Panasonic" />
                  </div>
                  <div className="space-y-2">
                    <Label>Loại thiết bị</Label>
                    <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                      <SelectTrigger><SelectValue placeholder="Chọn loại thiết bị" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Máy tính">Máy tính</SelectItem>
                        <SelectItem value="Máy chiếu">Máy chiếu</SelectItem>
                        <SelectItem value="Tivi">Tivi</SelectItem>
                        <SelectItem value="Bàn ghế">Bàn ghế</SelectItem>
                        <SelectItem value="Điều hòa">Điều hòa</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vị trí (Phòng)</Label>
                    <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="VD: P.201" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="VD: Cấu hình, tình trạng..." />
                  </div>
                  <Button type="submit" className="w-full">Lưu thiết bị</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditAssetId(null);
            setFormData({ name: '', type: '', location: '', status: 'ready', notes: '' });
          }
        }}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Sửa thông tin thiết bị</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên thiết bị</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Máy chiếu Panasonic" />
              </div>
              <div className="space-y-2">
                <Label>Loại thiết bị</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại thiết bị" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Máy tính">Máy tính</SelectItem>
                    <SelectItem value="Máy chiếu">Máy chiếu</SelectItem>
                    <SelectItem value="Tivi">Tivi</SelectItem>
                    <SelectItem value="Bàn ghế">Bàn ghế</SelectItem>
                    <SelectItem value="Điều hòa">Điều hòa</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vị trí (Phòng)</Label>
                <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="VD: P.201" />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ready">Sẵn sàng</SelectItem>
                    <SelectItem value="in-use">Đang sử dụng</SelectItem>
                    <SelectItem value="broken">Hỏng</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="VD: Cấu hình, tình trạng..." />
              </div>
              <Button type="submit" className="w-full">Cập nhật thiết bị</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all overflow-hidden">
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Tìm kiếm theo mã ID (QA-XXXXXX), tên hoặc vị trí..." 
                className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500 focus-visible:ring-primary/30 transition-all h-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-all">
                <SelectValue placeholder="Loại thiết bị" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="all">Tất cả loại</SelectItem>
                {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-full sm:w-[180px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-all">
                <SelectValue placeholder="Vị trí/Phòng" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="all">Tất cả vị trí</SelectItem>
                {uniqueLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-all">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="ready">Sẵn sàng</SelectItem>
                <SelectItem value="in-use">Đang sử dụng</SelectItem>
                <SelectItem value="broken">Hỏng</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="hidden sm:block">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow className="dark:border-slate-800">
                  <TableHead className="font-bold dark:text-slate-300">Mã QA</TableHead>
                  <TableHead className="font-bold dark:text-slate-300">Tên thiết bị</TableHead>
                  <TableHead className="font-bold dark:text-slate-300">Loại</TableHead>
                  <TableHead className="font-bold dark:text-slate-300">Vị trí</TableHead>
                  <TableHead className="font-bold dark:text-slate-300">Ghi chú</TableHead>
                  <TableHead className="font-bold dark:text-slate-300">Trạng thái</TableHead>
                  <TableHead className="text-right font-bold dark:text-slate-300">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-mono font-bold text-primary/80">{asset.id}</TableCell>
                    <TableCell className="font-medium dark:text-slate-200">{asset.name}</TableCell>
                    <TableCell className="dark:text-slate-400">{asset.type}</TableCell>
                    <TableCell className="dark:text-slate-400">
                      <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-none font-medium">
                        {asset.location}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate dark:text-slate-500" title={asset.notes}>{asset.notes || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        asset.status === 'ready' ? 'default' :
                        asset.status === 'in-use' ? 'secondary' :
                        asset.status === 'broken' ? 'destructive' : 'outline'
                      } className="font-bold">
                        {asset.status === 'ready' ? 'Sẵn sàng' :
                         asset.status === 'in-use' ? 'Đang sử dụng' :
                         asset.status === 'broken' ? 'Hỏng' : 'Bảo trì'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openHistory(asset)} title="Lịch sử Check-in/out" className="dark:bg-slate-800 dark:border-slate-700 transition-all">
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setQrAsset(asset)} title="Xuất mã QR" className="dark:bg-slate-800 dark:border-slate-700 transition-all">
                        <QrCode className="h-4 w-4" />
                      </Button>
                      {(user.role === 'admin' || user.can_repair) && (
                        <>
                          {asset.status !== 'maintenance' && (
                            <Button variant="outline" size="icon" onClick={() => openMaintenance(asset)} title="Báo bảo trì" className="dark:bg-slate-800 dark:border-slate-700 transition-all">
                              <Wrench className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="icon" onClick={() => openRepair(asset)} title="Gửi sửa chữa" className="text-orange-600 dark:text-orange-400 dark:bg-slate-800 dark:border-slate-700 transition-all">
                            <Wrench className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <>
                          <Button variant="outline" size="icon" onClick={() => openEdit(asset)} title="Sửa thiết bị" className="dark:bg-slate-800 dark:border-slate-700 transition-all">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setDeleteAssetId(asset.id)} title="Xóa thiết bị">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="sm:hidden divide-y">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{asset.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground">{asset.id}</p>
                  </div>
                  <Badge variant={
                    asset.status === 'ready' ? 'default' :
                    asset.status === 'in-use' ? 'secondary' :
                    asset.status === 'broken' ? 'destructive' : 'outline'
                  }>
                    {asset.status === 'ready' ? 'Sẵn sàng' :
                     asset.status === 'in-use' ? 'Đang sử dụng' :
                     asset.status === 'broken' ? 'Hỏng' : 'Bảo trì'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Loại</span>
                    <span>{asset.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Vị trí</span>
                    <span>{asset.location}</span>
                  </div>
                </div>

                {asset.notes && (
                  <div className="text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700 italic text-slate-500 dark:text-slate-400">
                    {asset.notes}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openHistory(asset)}>
                    <History className="h-4 w-4 mr-2" /> Lịch sử
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setQrAsset(asset)}>
                    <QrCode className="h-4 w-4 mr-2" /> Mã QR
                  </Button>
                  {(user.role === 'admin' || user.can_repair) && (
                    <>
                      {asset.status !== 'maintenance' && (
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openMaintenance(asset)}>
                          <Wrench className="h-4 w-4 mr-2" /> Bảo trì
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1 text-orange-600" onClick={() => openRepair(asset)}>
                        <Wrench className="h-4 w-4 mr-2" /> Sửa chữa
                      </Button>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(asset)}>
                        <Edit className="h-4 w-4 mr-2" /> Sửa
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteAssetId(asset.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Không tìm thấy thiết bị nào
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!qrAsset} onOpenChange={(open) => !open && setQrAsset(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Mã QR Thiết bị</DialogTitle>
          </DialogHeader>
          {qrAsset && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <QRCodeSVG value={qrAsset.id} size={200} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg">{qrAsset.name}</p>
                <p className="font-mono text-muted-foreground">{qrAsset.id}</p>
                <p className="text-sm">Vị trí: {qrAsset.location}</p>
              </div>
              <Button onClick={() => window.print()} className="w-full">
                In mã QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isMaintenanceOpen} onOpenChange={(open) => {
        setIsMaintenanceOpen(open);
        if (!open) setMaintenanceAsset(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo bảo trì thiết bị</DialogTitle>
          </DialogHeader>
          {maintenanceAsset && (
            <form onSubmit={handleMaintenance} className="space-y-4">
              <div className="space-y-2">
                <Label>Thiết bị</Label>
                <div className="p-2 bg-muted rounded-md font-medium">
                  {maintenanceAsset.name} ({maintenanceAsset.id})
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lý do / Ghi chú bảo trì</Label>
                <Input 
                  required 
                  value={maintenanceNotes} 
                  onChange={e => setMaintenanceNotes(e.target.value)} 
                  placeholder="Nhập lý do bảo trì..." 
                />
              </div>
              <Button type="submit" className="w-full">Xác nhận bảo trì</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRepairOpen} onOpenChange={(open) => {
        setIsRepairOpen(open);
        if (!open) setRepairAsset(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi thiết bị đi sửa chữa</DialogTitle>
          </DialogHeader>
          {repairAsset && (
            <form onSubmit={handleRepair} className="space-y-4">
              <div className="space-y-2">
                <Label>Thiết bị</Label>
                <div className="p-2 bg-muted rounded-md font-medium">
                  {repairAsset.name} ({repairAsset.id})
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả tình trạng hỏng hóc</Label>
                <Input 
                  required 
                  value={repairDescription} 
                  onChange={e => setRepairDescription(e.target.value)} 
                  placeholder="Nhập mô tả chi tiết lỗi..." 
                />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Xác nhận gửi sửa chữa</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyAsset} onOpenChange={(open) => !open && setHistoryAsset(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch sử Check-in / Check-out - {historyAsset?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {assetHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có lịch sử hoạt động</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Người thực hiện</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetHistory.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <Badge variant={
                          log.action === 'checkout' ? 'default' :
                          log.action === 'checkin' ? 'secondary' :
                          log.action === 'report-broken' ? 'destructive' : 'outline'
                        }>
                          {log.action === 'checkout' ? 'Mượn (Check-out)' :
                           log.action === 'checkin' ? 'Trả (Check-in)' :
                           log.action === 'report-broken' ? 'Báo hỏng' : 
                           log.action === 'maintenance' ? 'Bảo trì' : 'Sẵn sàng'}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.user_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={log.notes}>{log.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteAssetId} onOpenChange={(open) => !open && setDeleteAssetId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa thiết bị</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">Bạn có chắc chắn muốn xóa thiết bị này? Hành động này không thể hoàn tác và sẽ xóa toàn bộ lịch sử liên quan.</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteAssetId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa thiết bị</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
