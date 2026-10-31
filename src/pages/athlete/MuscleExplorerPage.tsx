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
    <div className="mx-auto flex h-[calc(100vh-56px)] max-w-6xl flex-col gap-2 px-2 py-2 sm:flex-row">
      <div className="flex flex-1 flex-col fp-surface rounded-lg overflow-hidden">
        <MuscleExplorerControls />
        <div className="flex-1">
          <Suspense fallback={<CanvasLoader />}>
            <BodyExplorerCanvas />
          </Suspense>
        </div>
      </div>
      <div className="w-full fp-surface rounded-lg sm:w-80">
        <MusclePanel />
      </div>
    </div>
  );
}
