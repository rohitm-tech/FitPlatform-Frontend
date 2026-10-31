import { Suspense, lazy } from "react";
import { MuscleExplorerControls } from "../../components/muscle/MuscleExplorerControls";
import { MusclePanel } from "../../components/muscle/MusclePanel";

// Lazy-loaded so the 3D canvas (three.js + fiber + drei) never lands in the
// initial bundle on a phone — only fetched when the explorer is opened.
const BodyExplorerCanvas = lazy(() => import("../../3d/BodyExplorerCanvas"));

function CanvasLoader() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ color: "var(--fp-text-muted)" }}
    >
      Loading 3D model…
    </div>
  );
}

export default function MuscleExplorerPage() {
  return (
    <div className="product-page explorer-page">
      <h1 className="sr-only">Muscle explorer</h1>
      <div className="flex min-h-[530px] flex-1 flex-col fp-surface rounded-lg overflow-hidden">
        <MuscleExplorerControls />
        <p className="px-4 pb-2 text-xs text-slate-400">
          Drag to rotate · scroll or pinch to zoom · tap a muscle to select
        </p>
        <div className="relative h-[60dvh] min-h-[420px] lg:h-auto lg:flex-1">
          <Suspense fallback={<CanvasLoader />}>
            <BodyExplorerCanvas />
          </Suspense>
        </div>
      </div>
      <aside className="muscle-detail-shell">
        <MusclePanel />
      </aside>
    </div>
  );
}
