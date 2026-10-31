/**
 * Anatomical female rig — same clickable mesh names as male, with narrower
 * shoulders, wider hips/glutes, and slightly smaller limb mass.
 */
import type { RigPart } from './male';

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

const femaleRig: RigPart[] = [
  single('head', 'sphere', [0.108, 32, 24], [0, 1.68, 0.01], false, undefined, [0.9, 1.1, 0.96]),
  single('jaw', 'sphere', [0.072, 24, 16], [0, 1.58, 0.035], false, undefined, [1.05, 0.7, 0.9]),
  single('neck', 'capsule', [0.045, 0.065, SEG, RAD], [0, 1.53, 0], false),
  single('torso_upper', 'sphere', [0.17, 32, 24], [0, 1.36, -0.01], false, undefined, [1.05, 1.0, 0.68]),
  single('torso_mid', 'sphere', [0.145, 32, 24], [0, 1.16, -0.01], false, undefined, [0.95, 1.05, 0.65]),
  single('torso_lower', 'sphere', [0.155, 32, 24], [0, 1.0, 0], false, undefined, [1.15, 0.85, 0.72]),
  single('pelvis', 'sphere', [0.165, 32, 20], [0, 0.88, 0], false, undefined, [1.3, 0.72, 0.95]),

  ...pair({ base: 'chest_upper', geometry: 'sphere', args: [0.09, 24, 16], x: 0.085, y: 1.42, z: 0.12, scale: [1.1, 0.85, 0.95], clickable: true }),
  ...pair({ base: 'chest_mid', geometry: 'sphere', args: [0.09, 24, 16], x: 0.085, y: 1.32, z: 0.125, scale: [1.15, 0.8, 1], clickable: true }),
  ...pair({ base: 'chest_lower', geometry: 'sphere', args: [0.08, 24, 16], x: 0.085, y: 1.24, z: 0.11, scale: [1.1, 0.7, 0.9], clickable: true }),
  ...pair({ base: 'chest_inner', geometry: 'sphere', args: [0.05, 20, 14], x: 0.04, y: 1.32, z: 0.13, scale: [0.85, 1.05, 0.7], clickable: true }),

  single('abs_upper', 'sphere', [0.085, 24, 16], [0, 1.12, 0.1], true, undefined, [1.05, 0.7, 0.65]),
  single('abs_lower', 'sphere', [0.08, 24, 16], [0, 1.0, 0.09], true, undefined, [1.0, 0.7, 0.65]),
  ...pair({ base: 'oblique', geometry: 'capsule', args: [0.045, 0.18, SEG, RAD], x: 0.13, y: 1.06, z: 0.035, rotation: [0.12, 0, 0.32], clickable: true }),

  ...pair({ base: 'back_upper', geometry: 'sphere', args: [0.085, 24, 16], x: 0.085, y: 1.4, z: -0.1, scale: [1.05, 0.7, 0.75], clickable: true }),
  ...pair({ base: 'lat', geometry: 'sphere', args: [0.085, 24, 16], x: 0.12, y: 1.2, z: -0.07, scale: [0.8, 1.25, 0.65], clickable: true }),
  ...pair({ base: 'trap', geometry: 'sphere', args: [0.065, 20, 14], x: 0.055, y: 1.5, z: -0.05, scale: [1.0, 0.85, 0.7], clickable: true }),
  ...pair({ base: 'rhomboid', geometry: 'sphere', args: [0.06, 20, 14], x: 0.045, y: 1.36, z: -0.11, scale: [0.85, 1.0, 0.6], clickable: true }),

  ...pair({ base: 'delt_front', geometry: 'sphere', args: [0.06, 24, 16], x: 0.23, y: 1.46, z: 0.07, clickable: true }),
  ...pair({ base: 'delt_side', geometry: 'sphere', args: [0.065, 24, 16], x: 0.26, y: 1.46, z: 0, clickable: true }),
  ...pair({ base: 'delt_rear', geometry: 'sphere', args: [0.06, 24, 16], x: 0.23, y: 1.46, z: -0.07, clickable: true }),

  ...pair({ base: 'bicep', geometry: 'capsule', args: [0.04, 0.18, SEG, RAD], x: 0.3, y: 1.26, z: 0.04, rotation: [0.05, 0, -0.16], clickable: true }),
  ...pair({ base: 'tricep', geometry: 'capsule', args: [0.042, 0.18, SEG, RAD], x: 0.305, y: 1.26, z: -0.03, rotation: [-0.05, 0, -0.16], clickable: true }),
  ...pair({ base: 'forearm', geometry: 'capsule', args: [0.035, 0.2, SEG, RAD], x: 0.32, y: 0.98, z: 0.015, rotation: [0, 0, -0.08], clickable: true }),
  ...pair({ base: 'hand', geometry: 'sphere', args: [0.038, 16, 12], x: 0.33, y: 0.8, z: 0.015, scale: [0.85, 1.15, 0.55], clickable: false }),

  ...pair({ base: 'glute', geometry: 'sphere', args: [0.125, 24, 16], x: 0.105, y: 0.86, z: -0.05, scale: [1.1, 1.0, 1.1], clickable: true }),
  ...pair({ base: 'quad', geometry: 'capsule', args: [0.075, 0.32, SEG, RAD], x: 0.11, y: 0.56, z: 0.05, clickable: true }),
  ...pair({ base: 'hamstring', geometry: 'capsule', args: [0.068, 0.32, SEG, RAD], x: 0.11, y: 0.56, z: -0.05, clickable: true }),
  ...pair({ base: 'knee', geometry: 'sphere', args: [0.05, 16, 12], x: 0.11, y: 0.36, z: 0.015, clickable: false }),
  ...pair({ base: 'calf', geometry: 'capsule', args: [0.05, 0.24, SEG, RAD], x: 0.105, y: 0.18, z: -0.01, scale: [1, 1, 1.1], clickable: true }),
  ...pair({ base: 'foot', geometry: 'sphere', args: [0.055, 16, 12], x: 0.105, y: 0.03, z: 0.055, scale: [0.85, 0.42, 1.55], clickable: false }),
];

export default femaleRig;
