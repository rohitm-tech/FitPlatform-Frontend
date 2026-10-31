import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCameraPreset, setBodyGender } from '../../store/slices/explorerSlice';
import type { CameraPreset } from '../../store/slices/explorerSlice';

const PRESETS: { value: CameraPreset; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'side', label: 'Side' },
];

export function MuscleExplorerControls() {
  const dispatch = useAppDispatch();
  const cameraPreset = useAppSelector((state) => state.explorer.cameraPreset);
  const bodyGender = useAppSelector((state) => state.explorer.bodyGender);

  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--fp-border)' }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            className="rounded-md px-3 py-1 text-xs font-medium"
            style={{
              background: cameraPreset === preset.value ? 'var(--fp-surface-alt)' : 'transparent',
            }}
            onClick={() => dispatch(setCameraPreset(preset.value))}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--fp-border)' }}>
        {(['male', 'female'] as const).map((gender) => (
          <button
            key={gender}
            className="rounded-md px-3 py-1 text-xs font-medium capitalize"
            style={{
              background: bodyGender === gender ? 'var(--fp-surface-alt)' : 'transparent',
            }}
            onClick={() => dispatch(setBodyGender(gender))}
          >
            {gender}
          </button>
        ))}
      </div>
    </div>
  );
}
