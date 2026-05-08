import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Search, RefreshCw, History, ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function Scanner({ user }: { user: any }) {
  const [scannedCode, setScannedCode] = useState('');
  const [asset, setAsset] = useState<any>(null);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [action, setAction] = useState(user.role === 'admin' || user.can_borrow ? 'checkout' : 'report-broken');
  const [notes, setNotes] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [currentUserAsset, setCurrentUserAsset] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUserAsset();
  }, [user.id]);

  const fetchCurrentUserAsset = async () => {
    try {
      const data = await api.get(`/users/${user.id}/current-asset`);
      setCurrentUserAsset(data);
    } catch (err) {
      console.error('Lỗi tải thông tin mượn của bạn', err);
    }
  };

  useEffect(() => {
    if (isScanning) {
      setCameraError(null);
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
      );
      
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setCameraError('Tính năng quét QR yêu cầu kết nối bảo mật (HTTPS). Vui lòng truy cập trang web qua HTTPS.');
        setIsScanning(false);
        return;
      }

      scanner.render((text) => {
        setScannedCode(text);
        scanner.clear().catch(e => console.error('Error clearing scanner:', e));
        setIsScanning(false);
        fetchAsset(text);
      }, (err) => {
        // Only log critical errors, ignore frame-by-frame scan failures
        if (err && typeof err === 'string' && err.includes('NotFoundException')) {
          return;
        }
        
        // Handle specific camera access errors
        if (err && typeof err === 'string') {
          if (err.includes('NotAllowedError') || err.includes('Permission denied')) {
            setCameraError('Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt và tải lại trang.');
            setIsScanning(false);
          } else if (err.includes('NotFoundError') || err.includes('no device found')) {
            setCameraError('Không tìm thấy camera trên thiết bị của bạn.');
            setIsScanning(false);
          }
        }
      });

      return () => {
        scanner.clear().catch(e => console.error('Error clearing scanner:', e));
      };
    }
  }, [isScanning]);

  const fetchAsset = async (id: string) => {
    try {
      const data = await api.get(`/assets`);
      const found = data.find((a: any) => a.id === id);
      if (found) {
        setAsset(found);
        setNewLocation(found.location);
        fetchAssetHistory(id);
        toast.success('Tìm thấy thiết bị');
      } else {
        toast.error('Không tìm thấy thiết bị với mã này');
        setAsset(null);
        setAssetHistory([]);
      }
    } catch (err) {
      toast.error('Lỗi khi tìm kiếm thiết bị');
    }
  };

  const fetchAssetHistory = async (id: string) => {
    try {
      const history = await api.get(`/assets/${id}/history`);
      setAssetHistory(history);
    } catch (err) {
      console.error('Lỗi tải lịch sử thiết bị', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedCode) fetchAsset(scannedCode);
  };

  const handleAction = async () => {
    if (!asset) return;
    try {
      const res = await api.post('/action', {
        asset_id: asset.id,
        user_id: user.id,
        action,
        notes,
        new_location: newLocation
      });
      toast.success('Thao tác thành công');
      setAsset(res.asset);
      setNotes('');
      fetchAssetHistory(asset.id);
      fetchCurrentUserAsset();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight text-primary text-center uppercase">Quét mã QR</h1>
      
      <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle className="flex items-center space-x-2 text-lg font-bold dark:text-slate-100">
            <Camera className="h-5 w-5 text-primary" />
            <span>Quét hoặc nhập mã thiết bị</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cameraError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center space-x-2">
              <AlertTriangle size={18} />
              <span>{cameraError}</span>
            </div>
          )}
          {!isScanning ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 transition-all">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <Button size="lg" onClick={() => setIsScanning(true)} className="mb-4 h-12 px-8 font-bold shadow-lg shadow-primary/20">
                <Camera className="mr-2 h-5 w-5" /> Mở Camera
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">hoặc nhập mã thủ công</p>
            </div>
          ) : (
            <div id="reader" className="w-full overflow-hidden rounded-2xl border-4 border-primary/20 bg-black shadow-inner"></div>
          )}

          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input 
              placeholder="Nhập mã QA (VD: QA-4250CBF0)..." 
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 h-11"
              value={scannedCode}
              onChange={e => setScannedCode(e.target.value)}
            />
            <Button type="submit" variant="secondary" className="h-11 px-6 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {asset && (
        <Card className="border-primary/50 dark:border-primary/40 shadow-xl dark:bg-slate-900 overflow-hidden rounded-2xl">
          <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b dark:border-primary/20 py-6">
            <CardTitle className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{asset.name}</CardTitle>
            <div className="inline-flex px-3 py-1 bg-primary/20 rounded-full text-xs text-primary font-mono font-bold mt-2">{asset.id}</div>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Loại thiết bị</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{asset.type}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Vị trí hiện tại</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{asset.location}</span>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-slate-500 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Trạng thái</span>
                <Badge variant={
                  asset.status === 'ready' ? 'default' :
                  asset.status === 'in-use' ? 'secondary' :
                  asset.status === 'broken' ? 'destructive' : 'outline'
                } className="font-bold text-sm px-4 py-1">
                  {asset.status === 'ready' ? 'Sẵn sàng' :
                   asset.status === 'in-use' ? 'Đang sử dụng' :
                   asset.status === 'broken' ? 'Hỏng' : 'Bảo trì'}
                </Badge>
              </div>
            </div>

            {asset.status === 'in-use' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-sm">
                <div className="font-bold mb-1 uppercase text-[10px] tracking-widest">Thông tin sử dụng:</div>
                Thiết bị này đang được sử dụng. Nếu bạn muốn mượn, thiết bị cần được trả trước.
              </div>
            )}

            {currentUserAsset && action === 'checkout' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-sm">
                <div className="font-bold mb-1 uppercase text-[10px] tracking-widest">Cảnh báo:</div>
                Bạn đang mượn thiết bị <strong className="text-slate-900 dark:text-slate-100">"{currentUserAsset.name}"</strong>. 
                Vui lòng trả thiết bị cũ trước khi mượn thiết bị mới.
              </div>
            )}

            <div className="space-y-6 border-t dark:border-slate-800 pt-6">
              <div className="space-y-2">
                <Label className="dark:text-slate-400">Hành động</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <SelectValue placeholder="Chọn hành động" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                    {(asset.status === 'ready' && (user.role === 'admin' || user.can_borrow)) && <SelectItem value="checkout">Mượn thiết bị</SelectItem>}
                    {(asset.status === 'in-use' && (user.role === 'admin' || user.can_borrow)) && <SelectItem value="checkin">Trả thiết bị</SelectItem>}
                    <SelectItem value="report-broken">Báo hỏng</SelectItem>
                    {(user.role === 'admin' || user.can_repair) && <SelectItem value="maintenance">Đưa vào bảo trì</SelectItem>}
                    {(user.role === 'admin' || user.can_repair) && asset.status !== 'ready' && <SelectItem value="ready">Đánh dấu sẵn sàng</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-slate-400">Vị trí (Cập nhật nếu di chuyển)</Label>
                <Input 
                  placeholder="Nhập vị trí mới..." 
                  className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="dark:text-slate-400">Ghi chú (Tùy chọn)</Label>
                <Input 
                  placeholder="Nhập ghi chú hoặc mô tả lỗi..." 
                  className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <Button className="w-full h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={handleAction}>
                <RefreshCw className="mr-2 h-4 w-4" /> Xác nhận thực hiện
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {asset && assetHistory.length > 0 && (
        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b dark:border-slate-800">
            <CardTitle className="flex items-center space-x-2 text-lg font-bold dark:text-slate-100">
              <History className="h-5 w-5 text-primary" />
              <span>Lịch sử Check-in / Check-out</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
              {assetHistory.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 group-[.is-active]:bg-primary text-white group-[.is-active]:text-primary-foreground shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                    {log.action === 'checkout' ? <ArrowRight className="h-4 w-4" /> : 
                     log.action === 'checkin' ? <RefreshCw className="h-4 w-4" /> : 
                     <History className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center justify-between space-x-2 mb-2">
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {log.action === 'checkout' ? 'Mượn thiết bị' :
                         log.action === 'checkin' ? 'Trả thiết bị' :
                         log.action === 'report-broken' ? 'Báo hỏng' : 
                         log.action === 'maintenance' ? 'Bảo trì' : 'Sẵn sàng'}
                      </div>
                      <time className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                      </time>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Thực hiện bởi: <span className="font-bold text-slate-700 dark:text-slate-200">{log.user_name}</span>
                    </div>
                    {log.notes && (
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg italic border border-slate-100 dark:border-slate-800">
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
