import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Search, RefreshCw, History, ArrowRight } from 'lucide-react';
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
      
      scanner.render((text) => {
        setScannedCode(text);
        scanner.clear();
        setIsScanning(false);
        fetchAsset(text);
      }, (err) => {
        // Only log critical errors, ignore frame-by-frame scan failures
        if (err && typeof err === 'string' && err.includes('NotFoundException')) {
          return;
        }
        // If it's a permission error or something similar
        if (err && typeof err === 'string' && (err.includes('NotAllowedError') || err.includes('Permission denied'))) {
          setCameraError('Không có quyền truy cập camera. Vui lòng kiểm tra cài đặt trình duyệt.');
          setIsScanning(false);
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
      <h1 className="text-3xl font-bold tracking-tight text-primary text-center">Quét mã QR</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Quét hoặc nhập mã thiết bị</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cameraError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {cameraError}
            </div>
          )}
          {!isScanning ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-gray-50">
              <Button size="lg" onClick={() => setIsScanning(true)} className="mb-4">
                <Camera className="mr-2 h-5 w-5" /> Mở Camera
              </Button>
              <p className="text-sm text-muted-foreground">hoặc nhập mã thủ công</p>
            </div>
          ) : (
            <div id="reader" className="w-full overflow-hidden rounded-xl border"></div>
          )}

          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input 
              placeholder="Nhập mã QA..." 
              value={scannedCode}
              onChange={e => setScannedCode(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {asset && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-xl">{asset.name}</CardTitle>
            <div className="text-sm text-muted-foreground font-mono">{asset.id}</div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Loại thiết bị</span>
                <span className="font-medium">{asset.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Vị trí hiện tại</span>
                <span className="font-medium">{asset.location}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Trạng thái</span>
                <span className={`font-medium ${
                  asset.status === 'ready' ? 'text-emerald-600' :
                  asset.status === 'in-use' ? 'text-blue-600' :
                  asset.status === 'broken' ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {asset.status === 'ready' ? 'Sẵn sàng' :
                   asset.status === 'in-use' ? 'Đang sử dụng' :
                   asset.status === 'broken' ? 'Hỏng' : 'Bảo trì'}
                </span>
              </div>
            </div>

            {asset.status === 'in-use' && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm">
                <div className="font-bold mb-1">Thông tin sử dụng:</div>
                Thiết bị này đang được sử dụng. Nếu bạn muốn mượn, thiết bị cần được trả trước.
              </div>
            )}

            {currentUserAsset && action === 'checkout' && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-sm">
                <div className="font-bold mb-1">Cảnh báo:</div>
                Bạn đang mượn thiết bị <strong>"{currentUserAsset.name}"</strong>. 
                Vui lòng trả thiết bị cũ trước khi mượn thiết bị mới.
              </div>
            )}

            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Hành động</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hành động" />
                  </SelectTrigger>
                  <SelectContent>
                    {(asset.status === 'ready' && (user.role === 'admin' || user.can_borrow)) && <SelectItem value="checkout">Mượn thiết bị</SelectItem>}
                    {(asset.status === 'in-use' && (user.role === 'admin' || user.can_borrow)) && <SelectItem value="checkin">Trả thiết bị</SelectItem>}
                    <SelectItem value="report-broken">Báo hỏng</SelectItem>
                    {(user.role === 'admin' || user.can_repair) && <SelectItem value="maintenance">Đưa vào bảo trì</SelectItem>}
                    {(user.role === 'admin' || user.can_repair) && asset.status !== 'ready' && <SelectItem value="ready">Đánh dấu sẵn sàng</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vị trí (Cập nhật nếu có di chuyển phòng)</Label>
                <Input 
                  placeholder="Nhập vị trí mới..." 
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Ghi chú (Tùy chọn)</Label>
                <Input 
                  placeholder="Nhập ghi chú hoặc mô tả lỗi..." 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleAction}>
                <RefreshCw className="mr-2 h-4 w-4" /> Xác nhận
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {asset && assetHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <History className="h-5 w-5" />
              <span>Lịch sử Check-in / Check-out</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {assetHistory.map((log, index) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-primary text-white group-[.is-active]:text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    {log.action === 'checkout' ? <ArrowRight className="h-4 w-4" /> : 
                     log.action === 'checkin' ? <RefreshCw className="h-4 w-4" /> : 
                     <History className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">
                        {log.action === 'checkout' ? 'Mượn thiết bị (Check-out)' :
                         log.action === 'checkin' ? 'Trả thiết bị (Check-in)' :
                         log.action === 'report-broken' ? 'Báo hỏng' : 
                         log.action === 'maintenance' ? 'Bảo trì' : 'Sẵn sàng'}
                      </div>
                      <time className="font-mono text-xs font-medium text-indigo-500">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                      </time>
                    </div>
                    <div className="text-sm text-slate-500">
                      Thực hiện bởi: <span className="font-medium text-slate-700">{log.user_name}</span>
                    </div>
                    {log.notes && (
                      <div className="text-sm text-slate-500 mt-1">
                        Ghi chú: {log.notes}
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
