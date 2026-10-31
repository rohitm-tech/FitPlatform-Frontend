/**
 * Anatomical male rig — placeholder primitives arranged into a continuous
 * silhouette, ported from GymBuddy's placeholder-rig design. Mesh names
 * must stay in sync with `3d/muscleMeshRegistry.ts`. Swap this for a real
 * GLB later — nothing outside this file and the registry needs to change.
 *
 * Figure faces +Z, symmetric about x=0, feet at y≈0, crown ≈ y 1.82.
 */

export interface RigPart {
  meshName: string;
  geometry: 'capsule' | 'box' | 'sphere';
  /** capsule: [radius, length, capSegments, radialSegments]
   *  box: [w, h, d]
   *  sphere: [radius, widthSegments, heightSegments] */
  args: number[];
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  clickable: boolean;
}

interface PairSpec {
  base: string;
  geometry: 'capsule' | 'box' | 'sphere';
  args: number[];
  x: number;
  y: number;
  z: number;
  rotation?: [number, number, number];
  scale?: [number, number, number];
  clickable: boolean;
}

function pair(spec: PairSpec): RigPart[] {
  const { base, geometry, args, x, y, z, rotation, scale, clickable } = spec;
  const mirroredRotation = (rot?: [number, number, number]): [number, number, number] | undefined =>
    rot ? [rot[0], -rot[1], -rot[2]] : undefined;
  return [
    { meshName: `${base}_L`, geometry, args, position: [-x, y, z], rotation: mirroredRotation(rotation), scale, clickable },
    { meshName: `${base}_R`, geometry, args, position: [x, y, z], rotation, scale, clickable },
  ];
}

function single(
  meshName: string,
  geometry: 'capsule' | 'box' | 'sphere',
  args: number[],
  position: [number, number, number],
  clickable: boolean,
  rotation?: [number, number, number],
  scale?: [number, number, number],
): RigPart {
  return { meshName, geometry, args, position, rotation, scale, clickable };
}

const SEG = 16;
const RAD = 24;

const maleRig: RigPart[] = [
  single('head', 'sphere', [0.115, 32, 24], [0, 1.7, 0.01], false, undefined, [0.92, 1.12, 0.98]),
  single('jaw', 'sphere', [0.08, 24, 16], [0, 1.6, 0.04], false, undefined, [1.05, 0.7, 0.9]),
  single('neck', 'capsule', [0.055, 0.07, SEG, RAD], [0, 1.55, 0], false),
  single('torso_upper', 'sphere', [0.2, 32, 24], [0, 1.38, -0.01], false, undefined, [1.15, 1.05, 0.72]),
  single('torso_mid', 'sphere', [0.175, 32, 24], [0, 1.18, -0.01], false, undefined, [1.05, 1.1, 0.7]),
  single('torso_lower', 'sphere', [0.16, 32, 24], [0, 1.02, 0], false, undefined, [1.05, 0.85, 0.72]),
  single('pelvis', 'sphere', [0.155, 32, 20], [0, 0.9, 0], false, undefined, [1.2, 0.75, 0.9]),

  ...pair({ base: 'chest_upper', geometry: 'sphere', args: [0.1, 24, 16], x: 0.1, y: 1.45, z: 0.12, scale: [1.15, 0.75, 0.85], clickable: true }),
  ...pair({ base: 'chest_mid', geometry: 'sphere', args: [0.1, 24, 16], x: 0.1, y: 1.35, z: 0.13, scale: [1.2, 0.7, 0.9], clickable: true }),
  ...pair({ base: 'chest_lower', geometry: 'sphere', args: [0.09, 24, 16], x: 0.1, y: 1.26, z: 0.12, scale: [1.15, 0.65, 0.85], clickable: true }),
  ...pair({ base: 'chest_inner', geometry: 'sphere', args: [0.06, 20, 14], x: 0.045, y: 1.34, z: 0.14, scale: [0.85, 1.1, 0.7], clickable: true }),

  single('abs_upper', 'sphere', [0.1, 24, 16], [0, 1.14, 0.11], true, undefined, [1.15, 0.75, 0.7]),
  single('abs_lower', 'sphere', [0.095, 24, 16], [0, 1.02, 0.1], true, undefined, [1.1, 0.75, 0.7]),
  ...pair({ base: 'oblique', geometry: 'capsule', args: [0.055, 0.2, SEG, RAD], x: 0.155, y: 1.08, z: 0.04, rotation: [0.15, 0, 0.35], clickable: true }),

  ...pair({ base: 'back_upper', geometry: 'sphere', args: [0.1, 24, 16], x: 0.1, y: 1.44, z: -0.11, scale: [1.15, 0.75, 0.8], clickable: true }),
  ...pair({ base: 'lat', geometry: 'sphere', args: [0.1, 24, 16], x: 0.145, y: 1.22, z: -0.08, scale: [0.85, 1.35, 0.7], clickable: true }),
  ...pair({ base: 'trap', geometry: 'sphere', args: [0.08, 20, 14], x: 0.07, y: 1.54, z: -0.06, scale: [1.1, 0.9, 0.75], clickable: true }),
  ...pair({ base: 'rhomboid', geometry: 'sphere', args: [0.07, 20, 14], x: 0.055, y: 1.4, z: -0.12, scale: [0.9, 1.05, 0.65], clickable: true }),

  ...pair({ base: 'delt_front', geometry: 'sphere', args: [0.075, 24, 16], x: 0.28, y: 1.5, z: 0.08, scale: [1, 0.95, 0.9], clickable: true }),
  ...pair({ base: 'delt_side', geometry: 'sphere', args: [0.08, 24, 16], x: 0.32, y: 1.5, z: 0, scale: [1.05, 1, 1], clickable: true }),
  ...pair({ base: 'delt_rear', geometry: 'sphere', args: [0.075, 24, 16], x: 0.28, y: 1.5, z: -0.08, scale: [1, 0.95, 0.9], clickable: true }),

  ...pair({ base: 'bicep', geometry: 'capsule', args: [0.05, 0.2, SEG, RAD], x: 0.36, y: 1.3, z: 0.05, rotation: [0.05, 0, -0.18], clickable: true }),
  ...pair({ base: 'tricep', geometry: 'capsule', args: [0.052, 0.2, SEG, RAD], x: 0.365, y: 1.3, z: -0.035, rotation: [-0.05, 0, -0.18], clickable: true }),
  ...pair({ base: 'forearm', geometry: 'capsule', args: [0.042, 0.22, SEG, RAD], x: 0.385, y: 1.0, z: 0.02, rotation: [0, 0, -0.1], clickable: true }),
  ...pair({ base: 'hand', geometry: 'sphere', args: [0.045, 16, 12], x: 0.4, y: 0.8, z: 0.02, scale: [0.85, 1.2, 0.55], clickable: false }),

  ...pair({ base: 'glute', geometry: 'sphere', args: [0.12, 24, 16], x: 0.1, y: 0.88, z: -0.05, scale: [1.05, 0.95, 1.05], clickable: true }),
  ...pair({ base: 'quad', geometry: 'capsule', args: [0.085, 0.34, SEG, RAD], x: 0.12, y: 0.58, z: 0.06, clickable: true }),
  ...pair({ base: 'hamstring', geometry: 'capsule', args: [0.075, 0.34, SEG, RAD], x: 0.12, y: 0.58, z: -0.06, clickable: true }),
  ...pair({ base: 'knee', geometry: 'sphere', args: [0.055, 16, 12], x: 0.12, y: 0.38, z: 0.02, clickable: false }),
  ...pair({ base: 'calf', geometry: 'capsule', args: [0.06, 0.26, SEG, RAD], x: 0.115, y: 0.2, z: -0.01, scale: [1, 1, 1.15], clickable: true }),
  ...pair({ base: 'foot', geometry: 'sphere', args: [0.06, 16, 12], x: 0.115, y: 0.035, z: 0.06, scale: [0.9, 0.45, 1.6], clickable: false }),
];

export default maleRig;
