import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Center } from '@react-three/drei';

function Model({ url }: { url: string }) {
  // useGLTF sẽ tải mô hình từ đường dẫn bạn cung cấp
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

interface ModelViewer3DProps {
  modelUrl: string;
}

export default function ModelViewer3D({ modelUrl }: ModelViewer3DProps) {
  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-xl overflow-hidden shadow-inner relative">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} contactShadow={true} shadowBias={-0.0015}>
            <Center>
              <Model url={modelUrl} />
            </Center>
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate />
      </Canvas>
      <div className="absolute bottom-4 left-4 text-white/50 text-xs font-mono">
        Dùng chuột để xoay và phóng to mô hình
      </div>
    </div>
  );
}
