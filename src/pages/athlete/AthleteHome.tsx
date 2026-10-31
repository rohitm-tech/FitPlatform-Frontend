import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Moon,
  Activity,
  Dumbbell,
  ShieldCheck,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAthleteHome, useAthleteWorkouts } from '../../queries/useAthlete';
import { usePerformance } from '../../queries/usePerformance';
import TrainingCompanion from '../../components/athlete/TrainingCompanion';
export default function AthleteHome() {
  const [planning, setPlanning] = useState(false);
  const queries = useQueryClient();
  const draft = async () => {
    setPlanning(true);
    try {
      const r = await api.post('/ai/plan');
      toast.success(
        r.data.data.coachApprovalRequired
          ? 'Weekly draft sent for coach approval'
          : 'Your training week is ready',
      );
      queries.invalidateQueries({ queryKey: ['performance'] });
      queries.invalidateQueries({ queryKey: ['athlete-workouts'] });
    } catch {
      toast.error('Could not generate a training draft');
    } finally {
      setPlanning(false);
    }
  };
  const { user } = useAuth();
  const { data: home } = useAthleteHome(user?._id);
  const { data: workouts } = useAthleteWorkouts(user?._id);
  const { data, isLoading, isError, refetch } = usePerformance();
  const reduced = useReducedMotion();
  const latest = data?.records?.[0],
    readiness = data?.readiness,
    review = data?.reviews?.[0];
  const next =
    home?.todaysWorkout?.status === 'planned'
      ? home.todaysWorkout
      : (workouts || []).find(
          (w) =>
            w.status === 'planned' &&
            new Date(w.date) >= new Date(new Date().setHours(0, 0, 0, 0)),
        );
  const sleep = latest?.sleepMinutes;
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return (
    <motion.div
      className="product-page"
      initial={reduced ? false : { opacity: 0.7, transform: 'translateY(8px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-greeting">
        <div>
          <h1>A good day starts with you.</h1>
          <p>
            {user?.name.split(' ')[0]}, your training and recovery, connected
            from morning to night.
          </p>
        </div>
        <div className="page-date">{date}</div>
      </div>
      {isError && (
        <div className="product-alert">
          Your performance data could not be loaded.{' '}
          <button onClick={() => refetch()}>Try again</button>
        </div>
      )}
      <div className="day-grid">
        <section className="daily-rhythm">
          <div className="section-heading">
            <h2>Your daily rhythm</h2>
            <span className="status-pill">Today · 4 moments</span>
          </div>
          <div className="day-timeline">
            <article className="day-event">
              <div className="event-time">MORNING</div>
              <div className="event-rail">
                <Moon size={15} />
              </div>
              <div className="event-content">
                <h3>
                  {isLoading
                    ? 'Loading your recovery…'
                    : sleep == null
                      ? 'Start with a recovery check-in'
                      : 'Your night, in context'}
                </h3>
                <p>
                  {latest
                    ? `${latest.sourceLabel || latest.source} · ${latest.date}`
                    : 'Add sleep, fatigue or wearable data to build your daily context.'}
                  {latest?.source === 'demo' && (
                    <span className="demo-badge">Demo data</span>
                  )}
                </p>
                <div className="recovery-metrics">
                  {[
                    [
                      sleep != null
                        ? `${Math.floor(sleep / 60)}h ${sleep % 60}m`
                        : '—',
                      'Sleep',
                    ],
                    [latest?.hrvMs ? `${latest.hrvMs} ms` : '—', 'HRV'],
                    [
                      latest?.restingHeartRate
                        ? `${latest.restingHeartRate} bpm`
                        : '—',
                      'Resting heart rate',
                    ],
                  ].map(([v, l]) => (
                    <div key={l}>
                      <strong>{v}</strong>
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
                <Link className="text-action" to="/athlete/recovery">
                  <Plus size={14} />
                  Check in or import data
                </Link>
              </div>
            </article>
            <article className="day-event">
              <div className="event-time">BEFORE</div>
              <div className="event-rail">
                <Activity size={15} />
              </div>
              <div className="event-content">
                <h3>
                  {readiness?.score != null
                    ? readiness.score < 50
                      ? 'Make room for recovery'
                      : readiness.score < 75
                        ? 'Ready, with a little restraint'
                        : 'A steady foundation for today'
                    : 'Your recovery picture is building'}
                </h3>
                <p>
                  {readiness?.reasons?.[0] ||
                    'Readiness appears when there is enough recent data.'}
                </p>
                <div className="readiness-line">
                  <span
                    className={`readiness-tag ${readiness?.status || 'missing'}`}
                  >
                    {readiness?.score != null
                      ? `${readiness.score} / 100`
                      : 'No score yet'}
                  </span>
                  <span>Training-readiness estimate · rules-based</span>
                </div>
                <p className="small-note">
                  Missing readings stay missing. This is not a medical
                  assessment.
                </p>
              </div>
            </article>
            <article className="day-event session-event">
              <div className="event-time">TRAINING</div>
              <div className="event-rail">
                <Dumbbell size={15} />
              </div>
              <div className="event-content">
                <h3>Strength that builds</h3>
                <p>
                  {next
                    ? 'Your assigned session, ready when you are.'
                    : 'No upcoming session. Build one or generate a draft week.'}
                </p>
                <div className="session-strip">
                  <div>
                    <strong>{next?.title || 'Your next session'}</strong>
                    <p>
                      {next
                        ? `${next.items.length} exercises · ${new Date(next.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
                        : 'Choose your movements. Train at your pace.'}
                    </p>
                  </div>
                  <Link
                    className="primary-action"
                    to={
                      next
                        ? `/athlete/log?workoutId=${next._id}`
                        : '/athlete/log'
                    }
                  >
                    {next ? 'Start session' : 'Log workout'}
                    <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="inline-links">
                  <button onClick={draft} disabled={planning}>
                    {planning ? 'Drafting your week…' : 'Draft my week with AI'}
                  </button>
                  <Link to="/athlete/history">Training calendar</Link>
                  <Link to="/athlete/explorer">
                    Explore your muscles <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </article>
            <article className="day-event">
              <div className="event-time">AFTER</div>
              <div className="event-rail">
                <ShieldCheck size={15} />
              </div>
              <div className="event-content">
                <h3>A review, without the guesswork</h3>
                <p>
                  {review?.analysis?.summary ||
                    'Log a session or save recovery data. The system compares your records with the plan, applies safety rules, then asks Gemini to explain.'}
                </p>
                <div className="review-state">
                  <span className="status-dot" />
                  <span>
                    {review
                      ? `${review.status === 'processing' ? 'AI review running' : review.status === 'queued' ? 'Review queued' : review.status === 'failed' ? 'Review needs attention' : 'Review complete'}${review.approval === 'pending' ? ' · Awaiting coach approval' : ''}`
                      : 'Automatic review is ready for your next update'}
                  </span>
                </div>
                {review?.rules?.completion?.coverage != null && (
                  <p className="small-note">
                    {review.rules.completion.coverage}% of assigned set targets
                    met in your log.
                  </p>
                )}
                <p className="small-note">
                  Your coach approves proposed changes. Your log is a record,
                  not proof of physical completion.
                </p>
                <Link className="text-action" to="/athlete/recovery">
                  View reviews and evidence <ArrowUpRight size={14} />
                </Link>
              </div>
            </article>
          </div>
          <div className="rhythm-footer">
            <span>{home?.currentStreak ?? 0} day streak</span>
            <Link to="/athlete/insights">
              See your progress <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
        <TrainingCompanion />
      </div>
    </motion.div>
  );
}
