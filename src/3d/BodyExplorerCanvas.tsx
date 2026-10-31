import {Html,useProgress} from '@react-three/drei';
import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneSetup } from './SceneSetup';
import { CameraRig } from './CameraRig';
import { BodyModel } from './BodyModel';

function ModelLoading(){const {progress}=useProgress();return <Html center><div role="status" className="whitespace-nowrap rounded-lg bg-slate-900 px-4 py-3 text-sm text-white">Loading anatomy {Math.round(progress)}%</div></Html>;}
function RendererTuning() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  return null;
}

// Lazy-loaded by the page that renders it (React.lazy) to keep the canvas
// out of the initial bundle on phones.
export const BodyExplorerCanvas = ({autoRotate=false}:{autoRotate?:boolean}) => {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      shadows
      camera={{ position: [0, 1.4, 4], fov: 38, near: 0.1, far: 50 }}
      style={{ width: '100%', height: '100%', background: '#080808' }}
    >
      <RendererTuning />
      <Suspense fallback={<ModelLoading/>}>
        <SceneSetup />
        <CameraRig autoRotate={autoRotate&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches} />
        <BodyModel />
      </Suspense>
    </Canvas>
  );
};

export default BodyExplorerCanvas;
