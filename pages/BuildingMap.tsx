import React, { useState, useEffect } from 'react';
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRoom, setSearchRoom] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('1');
  const [detailRoom, setDetailRoom] = useState<string | null>(null);

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

  // If search matches a room, we might want to highlight it or switch floor
  useEffect(() => {
    if (searchRoom.length >= 2) {
      const match = searchRoom.match(/P(\d+)/i);
      if (match) {
        const roomNum = parseInt(match[1]);
        const floor = Math.floor(roomNum / 100);
        if (floor >= 1 && floor <= 13) {
          setSelectedFloor(floor.toString());
        }
      }
    }
  }, [searchRoom]);

  const renderFloor = (floor: number) => (
    <Card key={floor} className="overflow-hidden border-primary/10 shadow-sm">
      <CardHeader className="bg-slate-50 border-b py-3">
        <CardTitle className="text-lg flex items-center">
          <MapIcon className="mr-2 h-5 w-5 text-primary" />
          Tầng {floor}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-4">
          {Array.from({ length: roomsPerFloor }).map((_, i) => {
            const roomNum = floor * 100 + (i + 1);
            const roomCode = `P${roomNum}`;
            const roomAssets = getAssetsInRoom(roomCode);
            const occupied = isRoomOccupied(roomCode);
            
            // Highlight if searched
            const isSearched = searchRoom && roomCode.toUpperCase().includes(searchRoom.toUpperCase());

            return (
              <TooltipProvider key={roomCode}>
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      onClick={() => setDetailRoom(roomCode)}
                      className={`
                        relative h-24 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all
                        ${occupied 
                          ? 'bg-orange-500 border-orange-600 text-white shadow-md scale-105 z-10' 
                          : 'bg-white border-slate-200 hover:border-primary/50 text-slate-600'}
                        ${isSearched ? 'ring-4 ring-primary ring-offset-2' : ''}
                      `}
                    >
                      <span className="text-lg font-bold">{roomCode}</span>
                      {roomAssets.length > 0 && (
                        <Badge variant={occupied ? "secondary" : "outline"} className="mt-1 text-[10px] px-1 h-4">
                          {roomAssets.length} TB
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-64 p-0" side="top">
                    <div className="p-3 bg-slate-900 text-white rounded-t-md border-b border-slate-700">
                      <div className="font-bold flex items-center justify-between">
                        <span>Phòng {roomCode}</span>
                        <Badge variant="outline" className="text-white border-white/20">
                          {roomAssets.length} thiết bị
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 space-y-3 max-h-60 overflow-auto bg-white text-slate-900">
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
                            <div className="text-slate-500 flex items-center">
                              <Info className="h-3 w-3 mr-1" />
                              ID: {asset.id}
                            </div>
                            {asset.status === 'in-use' && asset.last_user_name && (
                              <div className="text-orange-600 font-medium flex items-center mt-1">
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
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Sơ đồ tòa nhà</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi vị trí thiết bị theo từng tầng</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Tìm phòng (vd: P202)..." 
              className="pl-9"
              value={searchRoom}
              onChange={(e) => setSearchRoom(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Đang sử dụng</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-white border rounded"></div>
              <span>Trống</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={selectedFloor} onValueChange={setSelectedFloor} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-max min-w-full">
            {floors.sort((a, b) => a - b).map(f => (
              <TabsTrigger key={f} value={f.toString()} className="px-4">
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
