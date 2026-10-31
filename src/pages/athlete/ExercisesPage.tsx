import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExercises } from '../../queries/useExercises';
import { useMuscles } from '../../queries/useMuscles';

export default function ExercisesPage() {
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [q, setQ] = useState('');
  const { data: muscles } = useMuscles();
  const { data, isLoading } = useExercises({ muscle: muscle || undefined, equipment: equipment || undefined, q: q || undefined, limit: 50 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold">Exercise library</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="fp-input !w-56"
          placeholder="Search exercises…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="fp-input !w-48" value={muscle} onChange={(e) => setMuscle(e.target.value)}>
          <option value="">All muscles</option>
          {muscles?.map((m) => (
            <option key={m._id} value={m._id}>{m.displayName}</option>
          ))}
        </select>
        <select className="fp-input !w-40" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
          <option value="">All equipment</option>
          {['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'plate'].map((eq) => (
            <option key={eq} value={eq}>{eq}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="mt-6 text-sm" style={{ color: 'var(--fp-text-muted)' }}>Loading…</p>}

      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data?.exercises.map((exercise) => (
          <li key={exercise._id} className="fp-surface rounded-lg p-3">
            <Link to={`/exercises/${exercise.slug}`} className="font-medium underline">
              {exercise.name}
            </Link>
            <p className="mt-1 text-xs" style={{ color: 'var(--fp-text-muted)' }}>
              {exercise.primaryMuscles.map((m) => m.displayName).join(', ')} · {exercise.equipment.join(', ')} · {exercise.difficulty}
            </p>
          </li>
        ))}
      </ul>
      {data && data.exercises.length === 0 && (
        <p className="mt-6 text-sm" style={{ color: 'var(--fp-text-muted)' }}>No exercises match those filters.</p>
      )}
    </div>
  );
}
