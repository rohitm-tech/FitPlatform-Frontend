import { useMuscles } from "../../queries/useMuscles";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectMuscle,
  clearSelectedMuscle,
  setCameraPreset,
  setLayer,
} from "../../store/slices/explorerSlice";
import type { CameraPreset } from "../../store/slices/explorerSlice";

const PRESETS: { value: CameraPreset; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "side", label: "Side" },
];

export function MuscleExplorerControls() {
  const dispatch = useAppDispatch();
  const { data: muscles } = useMuscles();
  const selected = useAppSelector((s) => s.explorer.selectedMuscleKey);
  const cameraPreset = useAppSelector((state) => state.explorer.cameraPreset);
  const layer = useAppSelector((state) => state.explorer.layer);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3">
      <label className="flex items-center gap-2 text-xs">
        Muscle
        <select
          aria-label="Select muscle"
          className="fp-input !w-auto max-w-48"
          value={selected || ""}
          onChange={(e) =>
            e.target.value
              ? dispatch(selectMuscle(e.target.value))
              : dispatch(clearSelectedMuscle())
          }
        >
          <option value="">Choose a muscle</option>
          {muscles?.map((m) => (
            <option key={m.key} value={m.key}>
              {m.displayName}
            </option>
          ))}
        </select>
      </label>
      <div
        className="flex gap-1 rounded-lg border p-1"
        style={{ borderColor: "var(--fp-border)" }}
      >
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            aria-pressed={cameraPreset === preset.value}
            className="rounded-md px-3 py-1 text-xs font-medium"
            style={{
              background:
                cameraPreset === preset.value
                  ? "var(--fp-surface-alt)"
                  : "transparent",
            }}
            onClick={() => dispatch(setCameraPreset(preset.value))}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div
        className="flex gap-1 rounded-lg border p-1"
        style={{ borderColor: "var(--fp-border)" }}
      >
        {(["muscles", "skin"] as const).map((view) => (
          <button
            key={view}
            className="rounded-md px-3 py-1 text-xs font-medium capitalize"
            style={{
              background:
                layer === view ? "var(--fp-surface-alt)" : "transparent",
            }}
            aria-pressed={layer === view}
            onClick={() => dispatch(setLayer(view))}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
}
