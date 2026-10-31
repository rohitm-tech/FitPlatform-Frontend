import { useParams, Link } from 'react-router-dom';
import { useExerciseDetail } from '../../queries/useExercises';

export default function ExerciseDetailPage() {
  const { slug } = useParams();
  const { data: exercise, isLoading } = useExerciseDetail(slug);

  if (isLoading) return <div className="p-8 text-sm" style={{ color: 'var(--fp-text-muted)' }}>Loading…</div>;
  if (!exercise) return <div className="p-8 text-sm">Exercise not found.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/exercises" className="text-sm underline">← Back to library</Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">{exercise.name}</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--fp-text-muted)' }}>
        {exercise.type} · {exercise.difficulty} · {exercise.equipment.join(', ')}
      </p>

      <div className="mt-4">
        <h2 className="text-sm font-semibold">Primary muscles</h2>
        <p className="text-sm" style={{ color: 'var(--fp-text-muted)' }}>
          {exercise.primaryMuscles.map((m) => m.displayName).join(', ') || '—'}
        </p>
      </div>
      {exercise.secondaryMuscles.length > 0 && (
        <div className="mt-2">
          <h2 className="text-sm font-semibold">Secondary muscles</h2>
          <p className="text-sm" style={{ color: 'var(--fp-text-muted)' }}>
            {exercise.secondaryMuscles.map((m) => m.displayName).join(', ')}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-sm font-semibold">Instructions</h2>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
          {exercise.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
