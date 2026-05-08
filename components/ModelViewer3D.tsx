import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Center, Html } from '@react-three/drei';
import { ArrowBigDown } from 'lucide-react';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

interface Marker {
  id: string;
  position: [number, number, number];
  label: string;
  onClick?: () => void;
  color?: string;
}

interface ModelViewer3DProps {
  modelUrl: string;
  theme?: string;
  markers?: Marker[];
}

export default function ModelViewer3D({ modelUrl, theme, markers = [] }: ModelViewer3DProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`w-full h-full relative overflow-hidden group transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Canvas shadows camera={{ position: [8, 8, 8], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage 
            environment={isDark ? "night" : "city"} 
            intensity={isDark ? 0.3 : 0.6} 
            contactShadow={{ opacity: isDark ? 0.6 : 0.4, blur: 2 }}
            adjustCamera={false} // Prevent stage from jumping when markers move
          >
            <Center>
              <Model url={modelUrl} />
            </Center>
          </Stage>

          {/* Render 3D Markers OUTSIDE Stage for stable coordinates */}
          {markers.map((marker) => {
            const isLeft = (marker as any).side === 'left';
            
            return (
              <Html 
                key={marker.id} 
                position={marker.position}
                center
                className="pointer-events-none select-none"
                zIndexRange={[100, 0]}
              >
                <div className="relative pointer-events-none">
                  {/* Refined Leader Line pointing FROM label TO window */}
                  <svg width="120" height="120" className={`absolute ${isLeft ? 'right-0' : 'left-0'} top-0 pointer-events-none overflow-visible`}>
                    <defs>
                      <marker id={`arrowhead-${marker.id}`} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill={isDark ? '#3b82f6' : '#2563eb'} />
                      </marker>
                    </defs>
                    <path
                      d={isLeft ? "M -80,-30 L -30,-30 L 0,0" : "M 80,-30 L 30,-30 L 0,0"}
                      fill="none"
                      stroke={isDark ? '#3b82f6' : '#2563eb'}
                      strokeWidth="2"
                      markerEnd={`url(#arrowhead-${marker.id})`}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-md"
                    />
                  </svg>

                  {/* Compact Label Box */}
                  <div className={`absolute ${isLeft ? 'right-[80px]' : 'left-[80px]'} top-[-30px] translate-y-[-50%]`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        marker.onClick?.();
                      }}
                      className={`
                        pointer-events-auto cursor-pointer
                        px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border-2 transition-all active:scale-95
                        flex items-center
                        ${isDark 
                          ? 'bg-slate-900 border-blue-500 text-blue-400' 
                          : 'bg-white border-blue-600 text-blue-600'}
                      `}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{marker.label}</span>
                    </button>
                  </div>
                </div>
              </Html>
            );
          })}
          
          {isDark && <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />}
          <ambientLight intensity={isDark ? 0.2 : 0.5} />
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} enableDamping />
      </Canvas>
      
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 border rounded-full text-[10px] font-mono tracking-widest uppercase backdrop-blur-sm pointer-events-none transition-all ${
        isDark 
          ? 'bg-blue-500/10 border-blue-400/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
          : 'bg-blue-600/10 border-blue-600/20 text-blue-600'
      }`}>
        Live Security Feed • Interactive Map View
      </div>
      
      <div className="absolute bottom-4 right-4 text-slate-400 text-[10px] font-mono pointer-events-none">
        LMB: Rotate • RMB: Pan • Scroll: Zoom
      </div>
    </div>
  );
}
