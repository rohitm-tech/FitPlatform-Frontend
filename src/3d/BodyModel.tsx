import { useAppSelector } from '../store/hooks';
import maleRig from './placeholderRig/male';
import femaleRig from './placeholderRig/female';
import { MuscleMesh } from './MuscleMesh';

// Placeholder rig until a real GLB is supplied (see README "Adding a new 3D
// model mapping"). Only muscleMeshRegistry.ts needs to change to swap it.
export function BodyModel() {
  const bodyGender = useAppSelector((state) => state.explorer.bodyGender);
  const rig = bodyGender === 'female' ? femaleRig : maleRig;

  return (
    <group>
      {rig.map((part, index) => (
        <MuscleMesh part={part} key={`${part.meshName}_${index}`} />
      ))}
    </group>
  );
}

export default BodyModel;
