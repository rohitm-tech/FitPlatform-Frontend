import { useAppSelector } from '../store/hooks';
import { MESH_NAME_TO_MUSCLE_KEY } from './muscleMeshRegistry';
import { useGlowMaterial } from './hooks/useGlowMaterial';
import { useRaycastSelection } from './hooks/useRaycastSelection';
import type { RigPart } from './placeholderRig/male';

interface MuscleMeshProps {
  part: RigPart;
}

export function MuscleMesh({ part }: MuscleMeshProps) {
  const { getMaterial, shellMaterial, getHeatMaterial } = useGlowMaterial();
  const { onPointerOver, onPointerOut, onClick } = useRaycastSelection(part.meshName, part.clickable);

  const selectedMuscleKey = useAppSelector((state) => state.explorer.selectedMuscleKey);
  const hoveredMeshName = useAppSelector((state) => state.explorer.hoveredMeshName);
  const heatData = useAppSelector((state) => state.explorer.heatData);

  const muscleKey = MESH_NAME_TO_MUSCLE_KEY[part.meshName];
  const isSelected = Boolean(selectedMuscleKey && muscleKey === selectedMuscleKey);
  const isHovered = hoveredMeshName === part.meshName;
  const heatIntensity = muscleKey ? heatData[muscleKey] : undefined;

  let material = shellMaterial;
  if (part.clickable) {
    if (isSelected) material = getMaterial('selected');
    else if (isHovered) material = getMaterial('hover');
    else if (heatIntensity) material = getHeatMaterial(heatIntensity);
    else material = getMaterial('default');
  }

  return (
    <mesh
      position={part.position}
      rotation={part.rotation ?? [0, 0, 0]}
      scale={part.scale ?? [1, 1, 1]}
      material={material}
      castShadow
      receiveShadow
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {part.geometry === 'capsule' ? (
        <capsuleGeometry args={part.args as [number, number, number, number]} />
      ) : part.geometry === 'sphere' ? (
        <sphereGeometry args={part.args as [number, number, number]} />
      ) : (
        <boxGeometry args={part.args as [number, number, number]} />
      )}
    </mesh>
  );
}

export default MuscleMesh;
