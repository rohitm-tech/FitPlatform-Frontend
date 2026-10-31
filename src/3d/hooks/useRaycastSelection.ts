import { useCallback, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useAppDispatch } from '../../store/hooks';
import { selectMuscle, setHoveredMesh } from '../../store/slices/explorerSlice';
import { MESH_NAME_TO_MUSCLE_KEY } from '../muscleMeshRegistry';

export interface RaycastSelectionHandlers {
  onPointerOver: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (event: ThreeEvent<PointerEvent>) => void;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}

const noop = () => {};

// Pointer/click handlers for a single mesh in the body rig. Non-clickable
// (filler) meshes get no-op handlers so they never affect hover/selection
// state in the explorer Redux slice.
export function useRaycastSelection(meshName: string, clickable: boolean): RaycastSelectionHandlers {
  const dispatch = useAppDispatch();

  const onPointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (clickable) dispatch(setHoveredMesh(meshName));
    },
    [dispatch, meshName, clickable],
  );

  const onPointerOut = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (clickable) dispatch(setHoveredMesh(null));
    },
    [dispatch, clickable],
  );

  const onClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (!clickable) return;
      const key = MESH_NAME_TO_MUSCLE_KEY[meshName];
      if (key) dispatch(selectMuscle(key));
    },
    [dispatch, meshName, clickable],
  );

  return useMemo(() => {
    if (!clickable) return { onPointerOver: noop, onPointerOut: noop, onClick: noop };
    return { onPointerOver, onPointerOut, onClick };
  }, [clickable, onPointerOver, onPointerOut, onClick]);
}
