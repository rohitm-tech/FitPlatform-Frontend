import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraPresets } from './hooks/useCameraPresets';

// Orbit controls + one-shot preset camera moves. Zoom/pan stay put after the
// user adjusts them — presets only re-aim when Front/Back/Side changes.
export function CameraRig({autoRotate=false}:{autoRotate?:boolean}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  useCameraPresets(controlsRef);

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={.8}
      makeDefault
      enableZoom
      enablePan
      enableRotate
      enableDamping
      dampingFactor={0.08}
      minDistance={1.2}
      maxDistance={12}
      maxPolarAngle={Math.PI * 0.9}
      target={[0, 0.9, 0]}
    />
  );
}

export default CameraRig;
