// @vitest-environment node
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {resolveAnatomyMuscleKey} from '../3d/anatomyMapping';
import {MUSCLE_KEY_TO_MESH_NAMES} from '../3d/muscleMeshRegistry';
describe('real anatomy mapping',()=>{
 it.each([
 ['Clavicular_head_of_pectoralis_major_muscle001','upper-chest'],
 ['Sternocostal head of pectoralis major muscle.007','middle-chest'],
 ['(Abdominal part of pectoralis major muscle).003','lower-chest'],
 ['Clavicular part of deltoid muscle','front-delts'],
 ['Long_head_of_biceps_brachii003','biceps'],
 ['Long head of biceps femoris','hamstrings'],
 ['External abdominal oblique muscle.012','obliques'],
 ['Rectus femoris muscle','quadriceps'],
 ['Medial head of gastrocnemius muscle','calves'],
 ['Gluteus maximus muscle','glutes'],
 ['Transverse part of trapezius muscle','traps'],
 ['Superior oblique muscle',null],['Femur.003',null],
 ])('maps %s to %s',(name,key)=>expect(resolveAnatomyMuscleKey(name)).toBe(key));
 it('maps real GLB mesh names to existing library keys only and covers every group',()=>{
 const data=readFileSync('public/models/body.glb');const size=data.readUInt32LE(12);const gltf=JSON.parse(data.subarray(20,20+size).toString());
 const keys=new Set<string>();for(const n of gltf.nodes){const key=resolveAnatomyMuscleKey(n.name||'');if(key){expect(MUSCLE_KEY_TO_MESH_NAMES).toHaveProperty(key);keys.add(key);}}
 expect(keys.size).toBe(21);
 });
});
