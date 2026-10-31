import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export type MaterialState = 'default' | 'hover' | 'selected';

const defaultMaterial = new THREE.MeshStandardMaterial({ color: '#d8d2c8', roughness: 0.55, metalness: 0.03 });
const hoverMaterial = new THREE.MeshStandardMaterial({
  color: '#f2f2f2',
  emissive: '#ffffff',
  emissiveIntensity: 0.3,
  roughness: 0.4,
});
const selectedMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  emissive: '#38bdf8',
  emissiveIntensity: 0.5,
  roughness: 0.35,
});
const shellMaterial = new THREE.MeshStandardMaterial({ color: '#cfc8be', roughness: 0.6, metalness: 0.02 });

const materialsByState: Record<MaterialState, THREE.MeshStandardMaterial> = {
  default: defaultMaterial,
  hover: hoverMaterial,
  selected: selectedMaterial,
};

const heatColor = new THREE.Color();
/** 0 = base grey, 1 = fully red — used for the neglected-muscle heat map. */
function colorForHeat(intensity: number): THREE.Color {
  const base = new THREE.Color('#d8d2c8');
  const hot = new THREE.Color('#ef4444');
  return heatColor.copy(base).lerp(hot, Math.max(0, Math.min(1, intensity)));
}

export function useGlowMaterial() {
  const heatCache = useRef(new Map<number, THREE.MeshStandardMaterial>());

  return useMemo(
    () => ({
      getMaterial: (state: MaterialState): THREE.MeshStandardMaterial => materialsByState[state],
      shellMaterial,
      getHeatMaterial: (intensity: number): THREE.MeshStandardMaterial => {
        const bucket = Math.round(intensity * 10) / 10;
        const cached = heatCache.current.get(bucket);
        if (cached) return cached;
        const material = new THREE.MeshStandardMaterial({
          color: colorForHeat(bucket).clone(),
          roughness: 0.5,
          metalness: 0.02,
        });
        heatCache.current.set(bucket, material);
        return material;
      },
    }),
    [],
  );
}
