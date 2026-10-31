import { Suspense, lazy } from 'react';
import { MuscleExplorerControls } from '../../components/muscle/MuscleExplorerControls';
import { MusclePanel } from '../../components/muscle/MusclePanel';

// Lazy-loaded so the 3D canvas (three.js + fiber + drei) never lands in the
// initial bundle on a phone — only fetched when the explorer is opened.
const BodyExplorerCanvas = lazy(() => import('../../3d/BodyExplorerCanvas'));

function CanvasLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ color: 'var(--fp-text-muted)' }}>
      Loading 3D model…
    </div>
  );
}

export default function MuscleExplorerPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:h-[calc(100dvh-90px)] lg:min-h-[620px] lg:flex-row">
      <div className="flex min-h-[530px] flex-1 flex-col fp-surface rounded-lg overflow-hidden">
        <MuscleExplorerControls /><p className="px-4 pb-2 text-xs text-slate-400">Drag to rotate · scroll or pinch to zoom · tap a muscle to select</p>
        <div className="relative h-[60dvh] min-h-[420px] lg:h-auto lg:flex-1">
          <Suspense fallback={<CanvasLoader />}>
            <BodyExplorerCanvas />
          </Suspense>
        </div>
      </div>
      <div className="w-full fp-surface rounded-lg lg:w-80 lg:overflow-y-auto">
        <MusclePanel />
      </div>
    </div>
  );
}
