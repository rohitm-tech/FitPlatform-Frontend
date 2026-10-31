import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearSelectedMuscle } from '../../store/slices/explorerSlice';
import { useMuscleDetail } from '../../queries/useMuscles';

export function MusclePanel() {
  const dispatch = useAppDispatch();
  const selectedMuscleKey = useAppSelector((state) => state.explorer.selectedMuscleKey);
  const { data, isLoading, isError, refetch } = useMuscleDetail(selectedMuscleKey);

  if (!selectedMuscleKey) {
    return (
      <div className="p-4 text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        Tap a muscle on the model to see what it does and which exercises target it.
      </div>
    );
  }

  if(isError)return <div role="alert" className="p-4 text-sm">Could not load this muscle. <button className="underline" onClick={()=>refetch()}>Try again</button></div>;
  if (isLoading || !data) {
    return <div className="p-4 text-sm" style={{ color: 'var(--fp-text-muted)' }}>Loading…</div>;
  }

  const { muscle, primaryExercises, secondaryExercises } = data;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">{muscle.displayName}</h2>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--fp-text-muted)' }}>
            {muscle.group}
          </p>
        </div>
        <button className="text-xs underline" onClick={() => dispatch(clearSelectedMuscle())}>
          Close
        </button>
      </div>
      <p className="text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        {muscle.description}
      </p>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fp-text-muted)' }}>
          Exercises (primary)
        </h3>
        <ul className="flex flex-col gap-1">
          {primaryExercises.map((ex) => (
            <li key={ex._id}>
              <Link to={`/exercises/${ex.slug}`} className="text-sm underline">
                {ex.name}
              </Link>
            </li>
          ))}
          {primaryExercises.length === 0 && (
            <li className="text-sm" style={{ color: 'var(--fp-text-muted)' }}>None yet.</li>
          )}
        </ul>
      </div>

      {secondaryExercises.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fp-text-muted)' }}>
            Also works this muscle
          </h3>
          <ul className="flex flex-col gap-1">
            {secondaryExercises.map((ex) => (
              <li key={ex._id}>
                <Link to={`/exercises/${ex.slug}`} className="text-sm underline">
                  {ex.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
