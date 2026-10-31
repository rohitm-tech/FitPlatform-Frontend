/**
 * Maps Muscle.key (from the backend Muscle collection) ↔ mesh names in the
 * 3D rig. This is the ONLY file that needs to change to swap the placeholder
 * rig for a real GLB model later — nothing else in the 3D or data layer
 * references mesh names directly. Ported from GymBuddy's mapping-layer
 * design (muscleMeshRegistry.ts), keyed to match the seeded Muscle.key
 * values exactly (see backend/src/seed/seedMuscles.js).
 */

export const MUSCLE_KEY_TO_MESH_NAMES: Record<string, string[]> = {
  'upper-chest': ['chest_upper_L', 'chest_upper_R'],
  'middle-chest': ['chest_mid_L', 'chest_mid_R'],
  'lower-chest': ['chest_lower_L', 'chest_lower_R'],
  'inner-chest': ['chest_inner_L', 'chest_inner_R'],
  'upper-back': ['back_upper_L', 'back_upper_R'],
  lats: ['lat_L', 'lat_R'],
  traps: ['trap_L', 'trap_R'],
  rhomboids: ['rhomboid_L', 'rhomboid_R'],
  'front-delts': ['delt_front_L', 'delt_front_R'],
  'side-delts': ['delt_side_L', 'delt_side_R'],
  'rear-delts': ['delt_rear_L', 'delt_rear_R'],
  biceps: ['bicep_L', 'bicep_R'],
  triceps: ['tricep_L', 'tricep_R'],
  forearms: ['forearm_L', 'forearm_R'],
  quadriceps: ['quad_L', 'quad_R'],
  hamstrings: ['hamstring_L', 'hamstring_R'],
  glutes: ['glute_L', 'glute_R'],
  calves: ['calf_L', 'calf_R'],
  'upper-abs': ['abs_upper'],
  'lower-abs': ['abs_lower'],
  obliques: ['oblique_L', 'oblique_R'],
};

export const MESH_NAME_TO_MUSCLE_KEY: Record<string, string> = Object.entries(
  MUSCLE_KEY_TO_MESH_NAMES,
).reduce<Record<string, string>>((acc, [key, meshNames]) => {
  meshNames.forEach((meshName) => {
    acc[meshName] = key;
  });
  return acc;
}, {});
