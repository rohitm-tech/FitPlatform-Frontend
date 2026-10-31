import {useEffect,useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import type {ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import {useAppDispatch,useAppSelector} from '../store/hooks';
import {selectMuscle,setHoveredMesh} from '../store/slices/explorerSlice';
import {resolveAnatomyMuscleKey,pickPriority} from './anatomyMapping';
import {classifyAnatomyPart,materialForSlug,muscleSelected,muscleHover,muscleSelectedXray,muscleHoverXray} from './anatomyMaterials';

// Local Draco decoder: no dependency on a remote CDN at model-load time.
const DECODER='/draco/';
function originalName(mesh:THREE.Object3D){return String(mesh.userData.name||mesh.name).replace(/_/g,' ');}
function pick(event:ThreeEvent<PointerEvent|MouseEvent>){
 const hits=event.intersections.filter(h=>h.object.userData.muscleKey);
 if(!hits.length)return null;
 const nearest=hits[0].distance;
 // A small world-space tolerance resolves coplanar chest/core overlaps only.
 return hits.filter(h=>h.distance-nearest<.006).sort((a,b)=>pickPriority(b.object.userData.muscleKey)-pickPriority(a.object.userData.muscleKey)||a.distance-b.distance)[0].object;
}
export function BodyModel(){
 const {scene}=useGLTF('/models/body.glb',DECODER);
 const {scene:skinScene}=useGLTF('/models/skin.glb',DECODER);
 const dispatch=useAppDispatch();
 const {selectedMuscleKey,hoveredMeshName,heatData,layer}=useAppSelector(s=>s.explorer);
 const skinOn=layer==='skin';
 const model=useMemo(()=>{
  const root=scene.clone(true),skin=skinScene.clone(true);
  const skinMaterials=new Map<string,THREE.MeshStandardMaterial>();
  skin.traverse(obj=>{const mesh=obj as THREE.Mesh;if(!mesh.isMesh)return;
   const name=(mesh.material as THREE.Material).name;
   if(!skinMaterials.has(name))skinMaterials.set(name,new THREE.MeshStandardMaterial({color:name==='Hair'?'#30251f':name==='Shorts'?'#24353e':name.toLowerCase().includes('eye')?'#c7c4bd':'#bd8b6d',roughness:.65}));
   mesh.material=skinMaterials.get(name)!;mesh.raycast=()=>{};
  });
  // One rectus-abdominis mesh contains both regions. Split actual triangles,
  // keeping their original positions/normals, so lower-abs picking is spatial.
  root.updateMatrixWorld(true);
  const rectus:THREE.Mesh[]=[];
  root.traverse(obj=>{if((obj as THREE.Mesh).isMesh&&/rectus abdominis/i.test(originalName(obj)))rectus.push(obj as THREE.Mesh);});
  const splitGeometries:THREE.BufferGeometry[]=[];
  for(const mesh of rectus){
   const geometry=mesh.geometry,positions=geometry.attributes.position,index=geometry.index;
   const midpoint=new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()).y;
   const indices:{upper:number[],lower:number[]}={upper:[],lower:[]};const point=new THREE.Vector3();
   for(let i=0;i<(index?.count||positions.count);i+=3){
    const triangle=[0,1,2].map(j=>index?index.getX(i+j):i+j);
    const y=triangle.reduce((sum,n)=>sum+point.fromBufferAttribute(positions,n).applyMatrix4(mesh.matrixWorld).y,0)/3;
    indices[y>=midpoint?'upper':'lower'].push(...triangle);
   }
   for(const region of ['upper','lower'] as const){const part=mesh.clone();part.geometry=geometry.clone();part.geometry.setIndex(indices[region]);part.geometry.computeBoundingBox();part.geometry.computeBoundingSphere();splitGeometries.push(part.geometry);part.userData={...mesh.userData,regionKey:`${region}-abs`};mesh.parent!.add(part);}
   mesh.removeFromParent();
  }
  const interactive:THREE.Mesh[]=[];
  root.traverse(obj=>{const mesh=obj as THREE.Mesh;if(!mesh.isMesh)return;
   const name=originalName(mesh),key=mesh.userData.regionKey||resolveAnatomyMuscleKey(name),kind=classifyAnatomyPart(name);
   const container=/^(muscles of|muscular system|fascial compartments|skeleton of|bones of|deep gluteal)|compartment of|^abdominal part of muscular system$|^latissimus dorsi(?:\.\d+)?$/i.test(name);
   mesh.userData.muscleKey=container?null:key;
   mesh.material=materialForSlug(key,key?'muscle':kind);
   mesh.visible=!container&&kind!=='bone'&&(kind!=='filler'||!!key);
   // "Clavicular" occurs in real muscle names as well as bone names.
   if(key&&!container)mesh.visible=true;
   if(!key||container||!mesh.visible)mesh.raycast=()=>{};
   else {mesh.raycast=THREE.Mesh.prototype.raycast;interactive.push(mesh);}
  });
  const box=new THREE.Box3().setFromObject(skin);const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const scale=1.78/size.y;
  return {root,skin,interactive,skinMaterials,splitGeometries,scale,offset:[-center.x*scale,-box.min.y*scale,-center.z*scale] as [number,number,number]};
 },[scene,skinScene]);
 const heatMaterials=useMemo(()=>new Map<number,THREE.MeshStandardMaterial>(),[]);
 useEffect(()=>{
  for(const mesh of model.interactive){
   const key=mesh.userData.muscleKey;const selected=key===selectedMuscleKey;const hovered=mesh.uuid===hoveredMeshName;
   const heat=Math.round(Math.min(1,Math.max(0,heatData[key]||0))*10)/10;
   if(selected)mesh.material=skinOn?muscleSelectedXray:muscleSelected;
   else if(hovered)mesh.material=skinOn?muscleHoverXray:muscleHover;
   else if(heat){const cacheKey=heat+(skinOn?2:0);if(!heatMaterials.has(cacheKey))heatMaterials.set(cacheKey,new THREE.MeshStandardMaterial({color:new THREE.Color('#c99578').lerp(new THREE.Color('#ef635b'),heat),roughness:.6,transparent:skinOn,opacity:skinOn?.75:1,depthTest:!skinOn,depthWrite:!skinOn}));mesh.material=heatMaterials.get(cacheKey)!;}
   else mesh.material=materialForSlug(key,'muscle');
   mesh.renderOrder=skinOn&&(selected||hovered||heat)?10:0;
  }
 },[model,selectedMuscleKey,hoveredMeshName,heatData,skinOn,heatMaterials]);
 useEffect(()=>()=>{model.skinMaterials.forEach(m=>m.dispose());model.splitGeometries.forEach(g=>g.dispose());heatMaterials.forEach(m=>m.dispose());},[model,heatMaterials]);
 return <group position={model.offset} scale={model.scale} dispose={null}>
  <primitive object={model.skin} visible={skinOn}/>
  <primitive object={model.root}
   onPointerMove={(e:ThreeEvent<PointerEvent>)=>{const mesh=pick(e);if(mesh){e.stopPropagation();dispatch(setHoveredMesh(mesh.uuid));}}}
   onPointerOut={()=>dispatch(setHoveredMesh(null))}
   onClick={(e:ThreeEvent<MouseEvent>)=>{if(e.delta>5)return;const mesh=pick(e);if(mesh){e.stopPropagation();dispatch(selectMuscle(mesh.userData.muscleKey));}}}/>
 </group>;
}
export default BodyModel;
