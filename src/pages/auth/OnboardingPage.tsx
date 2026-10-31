import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userApi } from '../../services/endpoints/userApi';
import { useAppDispatch } from '../../store/hooks';
import { bootstrapAuth } from '../../store/slices/authSlice';
import type { UserProfile } from '../../types/domain';

const GOAL_OPTIONS: { value: NonNullable<UserProfile['goal']>; label: string }[] = [
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'strength', label: 'Strength' },
  { value: 'general_fitness', label: 'General fitness' },
  { value: 'race', label: 'Race' },
];

export default function OnboardingPage() {
  const [goal, setGoal] = useState<UserProfile['goal']>('general_fitness');
  const [experienceLevel, setExperienceLevel] = useState<UserProfile['experienceLevel']>('beginner');
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(3);
  const [equipmentAccess, setEquipmentAccess] = useState('bodyweight');
  const [injuries, setInjuries] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await userApi.completeOnboarding({
        goal,
        experienceLevel,
        trainingDaysPerWeek,
        equipmentAccess: equipmentAccess.split(',').map((item) => item.trim()).filter(Boolean),
        injuries,
      });
      await dispatch(bootstrapAuth());
      navigate('/athlete', { replace: true });
    } catch {
      toast.error('Could not save your profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <h1 className="font-display text-2xl font-semibold">Tell us about your training</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="fp-label" htmlFor="goal">Goal</label>
          <select id="goal" className="fp-input" value={goal} onChange={(e) => setGoal(e.target.value as UserProfile['goal'])}>
            {GOAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="fp-label" htmlFor="experience">Experience level</label>
          <select
            id="experience"
            className="fp-input"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as UserProfile['experienceLevel'])}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="fp-label" htmlFor="days">Training days per week</label>
          <input
            id="days"
            type="number"
            min={1}
            max={7}
            className="fp-input"
            value={trainingDaysPerWeek}
            onChange={(e) => setTrainingDaysPerWeek(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="fp-label" htmlFor="equipment">Equipment access (comma separated)</label>
          <input
            id="equipment"
            className="fp-input"
            value={equipmentAccess}
            onChange={(e) => setEquipmentAccess(e.target.value)}
          />
        </div>
        <div>
          <label className="fp-label" htmlFor="injuries">Injuries or limitations (optional)</label>
          <textarea
            id="injuries"
            className="fp-input"
            rows={3}
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--fp-text-muted)' }}>
            This is used only to show a "consult a professional" notice — it is not medical advice.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ borderColor: 'var(--fp-border)' }}
        >
          {isSubmitting ? 'Saving…' : 'Finish'}
        </button>
      </form>
    </div>
  );
}
