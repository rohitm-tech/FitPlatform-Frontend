import { useState } from 'react';
import toast from 'react-hot-toast';
import { useExercises } from '../../queries/useExercises';
import { useMyAthletes } from '../../queries/useCoach';
import { useCreateTemplate, useAssignTemplate, useTemplates } from '../../queries/useCoach';

interface BuilderItem {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  targetWeightKg: number;
}

export default function WorkoutBuilderPage() {
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [assignDate, setAssignDate] = useState('');
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

  const { data: searchResults } = useExercises({ q: query || undefined, limit: 8 });
  const { data: athletesData } = useMyAthletes();
  const { data: templates } = useTemplates();
  const createTemplate = useCreateTemplate();
  const assignTemplate = useAssignTemplate();

  const addExercise = (exerciseId: string, exerciseName: string) => {
    setItems((prev) => [...prev, { exerciseId, exerciseName, sets: 3, reps: 10, targetWeightKg: 20 }]);
    setQuery('');
  };

  const updateItem = (index: number, field: keyof BuilderItem, value: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSaveTemplate = async () => {
    if (!title.trim() || items.length === 0) {
      toast.error('Add a title and at least one exercise');
      return;
    }
    try {
      const res = await createTemplate.mutateAsync({
        title,
        items: items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, reps: i.reps, targetWeightKg: i.targetWeightKg })),
      });
      setSavedTemplateId(res.data.data._id);
      toast.success('Template saved');
    } catch {
      toast.error('Could not save template');
    }
  };

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handleAssign = async (templateId: string) => {
    if (selectedAthletes.length === 0 || !assignDate) {
      toast.error('Pick at least one athlete and a date');
      return;
    }
    try {
      await assignTemplate.mutateAsync({ templateId, athleteIds: selectedAthletes, dates: [assignDate] });
      toast.success('Workout assigned');
    } catch {
      toast.error('Could not assign workout');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold">Workout builder</h1>

      <div className="mt-4 fp-surface rounded-lg p-4">
        <label className="fp-label" htmlFor="title">Template title</label>
        <input id="title" className="fp-input" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="mt-3">
          <input
            className="fp-input"
            placeholder="Add an exercise…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && searchResults && (
            <ul className="mt-1 fp-surface rounded-lg">
              {searchResults.exercises.map((ex) => (
                <li key={ex._id}>
                  <button className="w-full px-3 py-2 text-left text-sm hover:opacity-80" onClick={() => addExercise(ex._id, ex.name)}>
                    {ex.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={`${item.exerciseId}-${i}`} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{item.exerciseName}</span>
              <input type="number" className="fp-input !w-16" value={item.sets} onChange={(e) => updateItem(i, 'sets', Number(e.target.value))} />
              <span>sets ×</span>
              <input type="number" className="fp-input !w-16" value={item.reps} onChange={(e) => updateItem(i, 'reps', Number(e.target.value))} />
              <span>reps @</span>
              <input type="number" className="fp-input !w-20" value={item.targetWeightKg} onChange={(e) => updateItem(i, 'targetWeightKg', Number(e.target.value))} />
              <span>kg</span>
            </div>
          ))}
        </div>

        <button
          className="mt-4 rounded-lg border px-4 py-2 text-sm"
          style={{ borderColor: 'var(--fp-border)' }}
          onClick={handleSaveTemplate}
          disabled={createTemplate.isPending}
        >
          {createTemplate.isPending ? 'Saving…' : 'Save template'}
        </button>
      </div>

      {savedTemplateId && (
        <div className="mt-6 fp-surface rounded-lg p-4">
          <h2 className="font-semibold">Assign "{title}"</h2>
          <div className="mt-2 flex flex-col gap-1">
            {athletesData?.athletes.map((entry) => (
              <label key={entry.athlete._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAthletes.includes(entry.athlete._id)}
                  onChange={() => toggleAthlete(entry.athlete._id)}
                />
                {entry.athlete.name}
              </label>
            ))}
          </div>
          <input type="date" className="fp-input mt-2 !w-48" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
          <button
            className="mt-3 rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: 'var(--fp-border)' }}
            onClick={() => handleAssign(savedTemplateId)}
            disabled={assignTemplate.isPending}
          >
            {assignTemplate.isPending ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      )}

      {templates && templates.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold">Saved templates</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {templates.map((t) => (
              <li key={t._id} className="fp-surface flex items-center justify-between rounded-lg p-3 text-sm">
                <span>{t.title} ({t.items.length} exercises)</span>
                <button className="text-xs underline" onClick={() => setSavedTemplateId(t._id)}>
                  Assign
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
