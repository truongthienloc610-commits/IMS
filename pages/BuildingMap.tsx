import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Map as MapIcon, Info, Package, User, Search, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  last_user_name?: string;
}

export default function BuildingMap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRoom, setSearchRoom] = useState('');
  
  // Single source of truth for floor: URL search param
  const selectedFloor = searchParams.get('floor') || '1';
  
  const [detailRoom, setDetailRoom] = useState<string | null>(null);

  const handleFloorChange = (floor: string) => {
    setSearchParams({ floor });
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await api.get('/assets');
      setAssets(data);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const floors = Array.from({ length: 13 }, (_, i) => 13 - i); // 13 down to 1
  const roomsPerFloor = 10;

  const getAssetsInRoom = (roomCode: string) => {
    return assets.filter(a => a.location.toUpperCase() === roomCode.toUpperCase());
  };

  const isRoomOccupied = (roomCode: string) => {
    return getAssetsInRoom(roomCode).some(a => a.status === 'in-use');
  };

  // If search matches a room, we switch to that floor in the URL
  useEffect(() => {
    if (searchRoom.length >= 2) {
      const match = searchRoom.match(/P(\d+)/i);
      if (match) {
        const roomNum = parseInt(match[1]);
        const floor = Math.floor(roomNum / 100);
        if (floor >= 1 && floor <= 13 && floor.toString() !== selectedFloor) {
          handleFloorChange(floor.toString());
        }
      }
    }
  }, [searchRoom, selectedFloor]);

  const renderRoom = (roomCode: string, className: string = "") => {
    const roomAssets = getAssetsInRoom(roomCode);
    const occupied = isRoomOccupied(roomCode);
    const isSearched = searchRoom && roomCode.toUpperCase().includes(searchRoom.toUpperCase());

    return (
      <TooltipProvider key={roomCode}>
        <Tooltip>
          <TooltipTrigger>
            <div
              onClick={() => setDetailRoom(roomCode)}
              className={`
                relative h-24 border-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                ${occupied 
                  ? 'bg-orange-500 dark:bg-orange-600 border-orange-600 dark:border-orange-700 text-white shadow-lg shadow-orange-500/20 scale-105 z-10' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 text-slate-600 dark:text-slate-300'}
                ${isSearched ? 'ring-4 ring-primary ring-offset-2 dark:ring-offset-slate-900' : ''}
                ${className}
              `}
            >
               <span className={`font-black tracking-tighter ${roomCode.length > 4 ? 'text-xs' : 'text-sm'}`}>
                {roomCode}
              </span>
              {roomAssets.length > 0 && (
                <Badge variant={occupied ? "secondary" : "outline"} className="mt-1 text-[10px] px-1 h-4">
                  {roomAssets.length} TB
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="w-64 p-0 dark:border-slate-700 shadow-xl" side="top">
            <div className="p-3 bg-slate-900 dark:bg-black text-white rounded-t-md border-b border-slate-700 dark:border-slate-800">
              <div className="font-bold flex items-center justify-between">
                <span>Phòng {roomCode}</span>
                <Badge variant="outline" className="text-white border-white/20">
                  {roomAssets.length} thiết bị
                </Badge>
              </div>
            </div>
            <div className="p-3 space-y-3 max-h-60 overflow-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {roomAssets.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Không có thiết bị nào</p>
              ) : (
                roomAssets.map(asset => (
                  <div key={asset.id} className="text-xs border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center">
                        <Package className="h-3 w-3 mr-1 text-primary" />
                        {asset.name}
                      </span>
                      <Badge 
                        className="text-[9px] h-4"
                        variant={asset.status === 'in-use' ? 'default' : 'secondary'}
                      >
                        {asset.status === 'in-use' ? 'Đang dùng' : 'Sẵn sàng'}
                      </Badge>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      ID: {asset.id}
                    </div>
                    {asset.status === 'in-use' && asset.last_user_name && (
                      <div className="text-orange-600 dark:text-orange-400 font-bold flex items-center mt-1">
                        <User className="h-3 w-3 mr-1" />
                        Người dùng: {asset.last_user_name}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderFloor = (floor: number) => {
    // LAYOUT TẦNG-1 & TẦNG-2 (HÌNH CHỮ L)
    if (floor === 1 || floor === 2) {
      return (
        <Card key={floor} className="overflow-hidden border-primary/10 dark:border-slate-800 shadow-sm bg-slate-50/30 dark:bg-slate-900">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 py-3">
            <CardTitle className="text-lg flex items-center font-bold dark:text-slate-100 uppercase tracking-tight">
              <MapIcon className="mr-2 h-5 w-5 text-primary" />
              Sơ đồ Tầng {floor} (Hình chữ L)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            <div className="relative mx-auto" style={{ width: '600px', height: '500px' }}>
              {/* Cánh dọc của chữ L */}
              <div className="absolute left-0 top-0 w-32 space-y-4">
                {renderRoom(`P${floor}01`)}
                {renderRoom(`P${floor}02`)}
                {renderRoom(`P${floor}03`)}
              </div>
              {/* Góc và Cánh ngang của chữ L */}
              <div className="absolute left-0 bottom-0 flex space-x-4">
                {renderRoom(`P${floor}04`, "w-32")}
                {renderRoom(`P${floor}05`, "w-32")}
                {renderRoom(`P${floor}06`, "w-32")}
                {renderRoom(`P${floor}07`, "w-32")}
                {renderRoom(`P${floor}08`, "w-32")}
              </div>
              {/* Hành lang trung tâm */}
              <div className="absolute left-40 top-40 text-slate-300 dark:text-slate-700 font-black text-6xl rotate-45 select-none pointer-events-none opacity-20 uppercase tracking-[0.5em]">
                SẢNH CHÍNH
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // LAYOUT TẦNG 3 - 6 (PHÒNG ĐỐI DIỆN)
    if (floor >= 3 && floor <= 6) {
      return (
        <Card key={floor} className="overflow-hidden border-primary/10 dark:border-slate-800 shadow-sm dark:bg-slate-900">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 py-3">
            <CardTitle className="text-lg flex items-center font-bold dark:text-slate-100 uppercase tracking-tight">
              <MapIcon className="mr-2 h-5 w-5 text-primary" />
              Sơ đồ Tầng {floor} (Phòng đối diện)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col space-y-12 max-w-2xl mx-auto">
              {/* Dãy phòng bên trái */}
              <div className="grid grid-cols-3 gap-6">
                {renderRoom(`P${floor}01`)}
                {renderRoom(`P${floor}02`)}
                {renderRoom(`P${floor}03`)}
              </div>
              
              {/* Hành lang giữa */}
              <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center border-y-2 border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-600 font-mono tracking-[1.5em] text-[10px] font-black uppercase">HÀNH LANG GIỮA</span>
              </div>

              {/* Dãy phòng bên phải */}
              <div className="grid grid-cols-3 gap-6">
                {renderRoom(`P${floor}04`)}
                {renderRoom(`P${floor}05`)}
                {renderRoom(`P${floor}06`)}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // LAYOUT TẦNG 12 (HỘI TRƯỜNG)
    if (floor === 12) {
      return (
        <Card key={floor} className="overflow-hidden border-primary/10 dark:border-slate-800 shadow-sm dark:bg-slate-900">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 py-3">
            <CardTitle className="text-lg flex items-center font-bold dark:text-slate-100 uppercase tracking-tight">
              <MapIcon className="mr-2 h-5 w-5 text-primary" />
              Sơ đồ Tầng 12 (Khu vực Hội trường)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-4 gap-6 min-h-[400px]">
               {/* Các phòng nhỏ bên cạnh */}
               <div className="col-span-1 space-y-4">
                  {renderRoom(`P1201`)}
                  {renderRoom(`P1202`)}
                  {renderRoom(`P1203`)}
               </div>
               {/* HỘI TRƯỜNG LỚN */}
                <div className="col-span-3">
                  <div 
                    onClick={() => setDetailRoom("HOITRUONG")}
                    className="h-full bg-blue-50 dark:bg-blue-900/20 border-4 border-blue-200 dark:border-blue-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border-dashed group"
                  >
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-full shadow-2xl mb-6 group-hover:scale-110 transition-transform">
                      <MapIcon className="h-20 w-20 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-4xl font-black text-blue-800 dark:text-blue-200 uppercase tracking-tighter">Hội Trường Lớn</h3>
                    <p className="text-blue-500 dark:text-blue-400 font-bold mt-2 uppercase tracking-widest text-xs">Sức chứa: 500 người</p>
                    <Badge variant="outline" className="mt-6 border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-300 font-bold px-6 py-1">PHÒNG ĐA NĂNG</Badge>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // CÁC TẦNG KHÁC (LAYOUT MẶC ĐỊNH)
    return (
      <Card key={floor} className="overflow-hidden border-primary/10 dark:border-slate-800 shadow-sm dark:bg-slate-900">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 py-3">
          <CardTitle className="text-lg flex items-center font-bold dark:text-slate-100 uppercase tracking-tight">
            <MapIcon className="mr-2 h-5 w-5 text-primary" />
            Tầng {floor}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-4 min-w-[600px]">
            {Array.from({ length: roomsPerFloor }).map((_, i) => (
              renderRoom(`P${floor}${String(i + 1).padStart(2, '0')}`)
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Sơ đồ tòa nhà</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Theo dõi vị trí thiết bị theo từng tầng trực quan</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Tìm phòng (vd: P202)..." 
              className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 h-10"
              value={searchRoom}
              onChange={(e) => setSearchRoom(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-6 text-[10px] uppercase font-bold tracking-widest">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 dark:bg-orange-600 rounded-md shadow-sm"></div>
              <span className="text-slate-600 dark:text-slate-400">Đang sử dụng</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-md"></div>
              <span className="text-slate-600 dark:text-slate-400">Phòng trống</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={selectedFloor} onValueChange={handleFloorChange} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-max min-w-full bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
            {floors.sort((a, b) => a - b).map(f => (
              <TabsTrigger key={f} value={f.toString()} className="px-6 py-2.5 rounded-xl font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100">
                Tầng {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {floors.map(f => (
          <TabsContent key={f} value={f.toString()} className="mt-6">
            {renderFloor(f)}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!detailRoom} onOpenChange={(open) => !open && setDetailRoom(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <MapIcon className="mr-2 h-5 w-5 text-primary" />
              Chi tiết phòng {detailRoom}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {detailRoom && getAssetsInRoom(detailRoom).length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 italic">Không có thiết bị nào trong phòng này.</p>
              </div>
            ) : (
              detailRoom && getAssetsInRoom(detailRoom).map(asset => (
                <Card key={asset.id} className="p-4 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-lg flex items-center">
                      <Package className="h-5 w-5 mr-2 text-primary" />
                      {asset.name}
                    </div>
                    <Badge 
                      variant={asset.status === 'in-use' ? 'default' : 'secondary'}
                      className={asset.status === 'in-use' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                      {asset.status === 'in-use' ? 'Đang dùng' : 'Sẵn sàng'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-slate-500 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      ID:
                    </div>
                    <div className="font-mono">{asset.id}</div>
                    
                    <div className="text-slate-500 flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Loại:
                    </div>
                    <div>{asset.type}</div>
                    
                    {asset.status === 'in-use' && asset.last_user_name && (
                      <>
                        <div className="text-slate-500 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Người dùng:
                        </div>
                        <div className="text-orange-600 font-semibold">{asset.last_user_name}</div>
                      </>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
