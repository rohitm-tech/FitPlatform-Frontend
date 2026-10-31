import { createSlice } from '@reduxjs/toolkit';

export type CameraPreset = 'front' | 'back' | 'side';
export type BodyGender = 'male' | 'female';

interface ExplorerState {
  selectedMuscleKey: string | null;
  hoveredMeshName: string | null;
  cameraPreset: CameraPreset;
  bodyGender: BodyGender;
  /** muscleKey -> 0..1 "how neglected" intensity, for the insights heat map */
  heatData: Record<string, number>;
}

const initialState: ExplorerState = {
  selectedMuscleKey: null,
  hoveredMeshName: null,
  cameraPreset: 'front',
  bodyGender: 'male',
  heatData: {},
};

const explorerSlice = createSlice({
  name: 'explorer',
  initialState,
  reducers: {
    selectMuscle: (state, action: { payload: string }) => {
      state.selectedMuscleKey = action.payload;
    },
    clearSelectedMuscle: (state) => {
      state.selectedMuscleKey = null;
    },
    setHoveredMesh: (state, action: { payload: string | null }) => {
      state.hoveredMeshName = action.payload;
    },
    setCameraPreset: (state, action: { payload: CameraPreset }) => {
      state.cameraPreset = action.payload;
    },
    setBodyGender: (state, action: { payload: BodyGender }) => {
      state.bodyGender = action.payload;
    },
    setHeatData: (state, action: { payload: Record<string, number> }) => {
      state.heatData = action.payload;
    },
  },
});

export const { selectMuscle, clearSelectedMuscle, setHoveredMesh, setCameraPreset, setBodyGender, setHeatData } =
  explorerSlice.actions;
export default explorerSlice.reducer;
