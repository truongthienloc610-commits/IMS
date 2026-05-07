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
    <div className="w-full h-full bg-slate-50 relative overflow-hidden group">
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Center>
              <Model url={modelUrl} />
            </Center>
          </Stage>
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-[10px] text-blue-600 font-mono tracking-widest uppercase backdrop-blur-sm pointer-events-none">
        Live Security Feed • Interactive Map View
      </div>
      <div className="absolute bottom-4 right-4 text-slate-400 text-[10px] font-mono pointer-events-none">
        LMB: Rotate • RMB: Pan • Scroll: Zoom
      </div>
    </div>
  );
}
