import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppSelector } from '../../store/hooks';
import type { CameraPreset } from '../../store/slices/explorerSlice';

export interface CameraPresetTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
}

const FIGURE_LOOK_AT: [number, number, number] = [0, 0.9, 0];

export const PRESET_TARGETS: Record<CameraPreset, CameraPresetTarget> = {
  front: { position: [0, 1.4, 4], lookAt: FIGURE_LOOK_AT },
  back: { position: [0, 1.4, -4], lookAt: FIGURE_LOOK_AT },
  side: { position: [4, 1.4, 0], lookAt: FIGURE_LOOK_AT },
};

type OrbitControlsLike = {
  target: THREE.Vector3;
  update: () => void;
  enabled: boolean;
};

// Animates the camera only when Front/Back/Side changes, then releases
// control so OrbitControls zoom/pan/rotate stay where the user left them.
export function useCameraPresets(controlsRef: React.RefObject<OrbitControlsLike | null>) {
  const preset = useAppSelector((state) => state.explorer.cameraPreset);
  const { camera } = useThree();

  const animating = useRef(false);
  const targetPosition = useRef(new THREE.Vector3(...PRESET_TARGETS.front.position));
  const targetLookAt = useRef(new THREE.Vector3(...FIGURE_LOOK_AT));
  const previousPreset = useRef<CameraPreset | null>(null);

  useEffect(() => {
    if (previousPreset.current === preset) return;
    previousPreset.current = preset;

    const next = PRESET_TARGETS[preset];
    targetPosition.current.set(...next.position);
    targetLookAt.current.set(...next.lookAt);
    animating.current = true;

    const controls = controlsRef.current;
    if (controls) controls.enabled = false;
  }, [preset, controlsRef]);

  useFrame((_, delta) => {
    if (!animating.current) return;

    const lerpFactor = Math.min(delta * 4, 1);
    camera.position.lerp(targetPosition.current, lerpFactor);

    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerp(targetLookAt.current, lerpFactor);
      controls.update();
    } else {
      camera.lookAt(targetLookAt.current);
    }

    const closeEnough = camera.position.distanceTo(targetPosition.current) < 0.02;
    if (closeEnough) {
      camera.position.copy(targetPosition.current);
      if (controls) {
        controls.target.copy(targetLookAt.current);
        controls.update();
        controls.enabled = true;
      }
      animating.current = false;
    }
  });
}
