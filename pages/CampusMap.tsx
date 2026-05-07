import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ModelViewer3D from '@/components/ModelViewer3D';
import { Info } from 'lucide-react';

export default function CampusMap() {
  // ĐƯỜNG DẪN FILE CỦA BẠN (Sau khi bạn upload file truong.gltf vào thư mục public/models/)
  const myModelUrl = '/models/truong.gltf';

  // MÔ HÌNH MẪU (Sẽ hiện ra để tránh lỗi nếu file trên chưa tồn tại)
  const fallbackModelUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf';

  // Bạn có thể đổi URL dưới đây thành myModelUrl khi bạn đã upload xong
  const activeUrl = fallbackModelUrl; 

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Mô hình Trường 3D</h1>
          <p className="text-muted-foreground">Khám phá khuôn viên trường qua không gian 3 chiều</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-0">
              <ModelViewer3D modelUrl={activeUrl} />
            </CardContent>
          </Card>
          
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-bold">Đang hiển thị mô hình mẫu.</span> Để xem mô hình trường của bạn: 
              <ol className="list-decimal ml-4 mt-1">
                <li>Dùng File Explorer (bên trái) tìm <code>public/models/</code>.</li>
                <li>Upload file của bạn vào đó.</li>
                <li>Nói với tôi "Tôi đã upload file <b>tên_file.gltf</b>" để tôi kích hoạt.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Click chuột trái và kéo để xoay.</p>
              <p>• Click chuột phải và kéo để di chuyển (Pan).</p>
              <p>• Lăn chuột để phóng to/thu nhỏ.</p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 mt-4">
                <strong>Lưu ý:</strong> Để sử dụng file của riêng bạn, hãy bỏ file .gltf vào thư mục <code>public/models/</code> và đổi đường dẫn thành <code>/models/ten_file.gltf</code>.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
