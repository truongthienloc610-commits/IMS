import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Package, Wrench, AlertTriangle, Activity, CheckCircle } from 'lucide-react';

const COLUMNS = [
  { id: 'ready', title: 'Sẵn sàng', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'in-use', title: 'Đang sử dụng', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'broken', title: 'Hỏng', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'maintenance', title: 'Bảo trì', icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50' }
];

export default function AssetBoard({ user }: { user: any }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [columns, setColumns] = useState<Record<string, any[]>>({
    'ready': [],
    'in-use': [],
    'broken': [],
    'maintenance': []
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await api.get('/assets');
      setAssets(data);
      
      const newCols: Record<string, any[]> = {
        'ready': [],
        'in-use': [],
        'broken': [],
        'maintenance': []
      };
      
      data.forEach((asset: any) => {
        if (newCols[asset.status]) {
          newCols[asset.status].push(asset);
        }
      });
      
      setColumns(newCols);
    } catch (err) {
      toast.error('Lỗi tải danh sách thiết bị');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid droppable area
    if (!destination) return;

    // Dropped in the same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    const sourceCol = Array.from(columns[sourceColId]);
    const destCol = sourceColId === destColId ? sourceCol : Array.from(columns[destColId]);
    
    const [movedAsset] = sourceCol.splice(source.index, 1);
    
    // Optimistic UI update
    if (sourceColId === destColId) {
      sourceCol.splice(destination.index, 0, movedAsset);
      setColumns({
        ...columns,
        [sourceColId]: sourceCol
      });
    } else {
      movedAsset.status = destColId;
      destCol.splice(destination.index, 0, movedAsset);
      setColumns({
        ...columns,
        [sourceColId]: sourceCol,
        [destColId]: destCol
      });

      // Update backend
      try {
        await api.put(`/assets/${draggableId}`, { 
          ...movedAsset, 
          status: destColId,
          user_id: user.id 
        });
        toast.success(`Đã chuyển ${movedAsset.name} sang ${COLUMNS.find(c => c.id === destColId)?.title}`);
        fetchAssets(); // Refresh to update last action/user info
      } catch (err: any) {
        toast.error('Lỗi khi cập nhật trạng thái');
        fetchAssets(); // Revert on error
      }
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Bảng trạng thái thiết bị</h1>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 sm:gap-6 h-full min-w-max px-2 sm:px-0">
            {COLUMNS.map(column => {
              const Icon = column.icon;
              const columnAssets = columns[column.id] || [];
              
              return (
                <div key={column.id} className="w-[280px] sm:w-80 flex flex-col bg-gray-100/50 rounded-xl border border-gray-200">
                  <div className={`p-4 border-b rounded-t-xl ${column.bg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-5 w-5 ${column.color}`} />
                        <h2 className="font-semibold text-gray-700">{column.title}</h2>
                      </div>
                      <Badge variant="secondary" className="bg-white/60">{columnAssets.length}</Badge>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-4 overflow-y-auto space-y-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-gray-200/50' : ''
                        }`}
                      >
                        {columnAssets.map((asset, index) => (
                          <Draggable key={asset.id} draggableId={asset.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <Card className={`shadow-sm border-gray-200 hover:border-primary/50 transition-colors ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20 rotate-2' : ''
                                }`}>
                                  <CardContent className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                      <div className="font-medium text-sm line-clamp-2">{asset.name}</div>
                                      <Package className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{asset.id}</span>
                                      <span className="flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                                        {asset.location}
                                      </span>
                                    </div>
                                    {asset.last_action && (
                                      <div className="text-[10px] text-muted-foreground italic border-t border-gray-100 pt-1.5 mt-1.5 flex items-center">
                                        <span className="opacity-70">
                                          {asset.last_action === 'checkout' ? 'Được mượn bởi ' : 
                                           asset.last_action === 'checkin' ? 'Được trả bởi ' : 
                                           asset.last_action === 'report-broken' ? 'Báo hỏng bởi ' : 
                                           asset.last_action === 'maintenance' ? 'Bảo trì bởi ' : 'Cập nhật bởi '}
                                        </span>
                                        <span className="font-medium not-italic ml-1 text-gray-700">{asset.last_user_name || 'Hệ thống'}</span>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
