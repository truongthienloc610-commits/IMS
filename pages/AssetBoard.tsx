import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Package, Wrench, AlertTriangle, Activity, CheckCircle } from 'lucide-react';

const COLUMNS = [
  { id: 'ready', title: 'Sẵn sàng', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-100 dark:border-emerald-900/30' },
  { id: 'in-use', title: 'Đang sử dụng', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-100 dark:border-blue-900/30' },
  { id: 'broken', title: 'Hỏng', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-100 dark:border-red-900/30' },
  { id: 'maintenance', title: 'Bảo trì', icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-100 dark:border-amber-900/30' }
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
        <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Mượn & Trả thiết bị</h1>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 sm:gap-6 h-full min-w-max px-2 sm:px-0">
            {COLUMNS.map(column => {
              const Icon = column.icon;
              const columnAssets = columns[column.id] || [];
              
              return (
                <div key={column.id} className="w-[300px] sm:w-80 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm">
                  <div className={`p-5 border-b rounded-t-2xl ${column.bg} ${column.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm`}>
                          <Icon className={`h-5 w-5 ${column.color}`} />
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{column.title}</h2>
                      </div>
                      <Badge variant="secondary" className="bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-0.5 rounded-full border-none">
                        {columnAssets.length}
                      </Badge>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-4 overflow-y-auto space-y-4 transition-colors min-h-[150px] ${
                          snapshot.isDraggingOver ? 'bg-slate-200/50 dark:bg-slate-800/30' : ''
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
                                <Card className={`group shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all rounded-xl overflow-hidden ${
                                  snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/40 rotate-2 z-50' : 'hover:shadow-md'
                                }`}>
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors">{asset.name}</div>
                                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                        <Package className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wide">
                                      <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-primary/80">{asset.id}</span>
                                      <span className="flex items-center px-2 py-1 rounded-full bg-slate-50 dark:bg-slate-900/50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                                        {asset.location}
                                      </span>
                                    </div>
                                    {asset.last_action && (
                                      <div className="text-[10px] italic border-t border-slate-100 dark:border-slate-700/50 pt-2.5 mt-1 flex items-center justify-between">
                                        <div className="flex items-center text-slate-500 dark:text-slate-500">
                                          <span className="opacity-70">
                                            {asset.last_action === 'checkout' ? 'Mượn: ' : 
                                             asset.last_action === 'checkin' ? 'Trả: ' : 
                                             asset.last_action === 'report-broken' ? 'Hỏng: ' : 
                                             asset.last_action === 'maintenance' ? 'Bảo trì: ' : 'Cập nhật: '}
                                          </span>
                                          <span className="font-bold not-italic ml-1 text-slate-600 dark:text-slate-400">{asset.last_user_name || 'Hệ thống'}</span>
                                        </div>
                                        <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-white dark:border-slate-800">
                                          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                            {(asset.last_user_name || 'S')[0]}
                                          </div>
                                        </div>
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
