import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ModelViewer3D from '@/components/ModelViewer3D';
import { Info } from 'lucide-react';

export default function CampusMap() {
  // ĐƯỜNG DẪN FILE CỦA BẠN
  const myModelUrl = '/models/Export.gltf';

  // Bạn có thể đổi URL dưới đây thành myModelUrl khi bạn đã upload xong
  const activeUrl = myModelUrl; 

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Mô hình Trường 3D</h1>
          <p className="text-muted-foreground">Khám phá khuôn viên trường qua không gian 3 chiều</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="w-full">
          <Card className="overflow-hidden border-none shadow-2xl">
            <CardContent className="p-0">
              <ModelViewer3D modelUrl={activeUrl} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 h-fit">
            <Info className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <span className="font-bold">Đang hiển thị mô hình Export.gltf.</span> 
              <p className="mt-1">Nếu mô hình không hiện hoặc quá nhỏ, bạn có thể kiểm tra lại tỉ lệ (scale) trong file 3D hoặc dùng chuột lăn để phóng to.</p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center space-x-2 py-3">
              <Info className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Hướng dẫn thao tác</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground grid grid-cols-2 gap-2 pb-4">
              <p>• <b>Chuột trái:</b> Xoay mô hình.</p>
              <p>• <b>Chuột phải:</b> Di chuyển (Pan).</p>
              <p>• <b>Lăn chuột:</b> Phóng to/thu nhỏ.</p>
              <p>• <b>Auto-rotate:</b> Đang bật tự động xoay.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
