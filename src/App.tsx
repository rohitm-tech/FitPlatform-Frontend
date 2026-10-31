import { Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleRoute } from './components/common/RoleRoute';

import Landing from './pages/Landing';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import OnboardingPage from './pages/auth/OnboardingPage';
import AthleteHome from './pages/athlete/AthleteHome';
import MuscleExplorerPage from './pages/athlete/MuscleExplorerPage';
import ExercisesPage from './pages/athlete/ExercisesPage';
import ExerciseDetailPage from './pages/athlete/ExerciseDetailPage';
import WorkoutLoggerPage from './pages/athlete/WorkoutLoggerPage';
import HistoryPage from './pages/athlete/HistoryPage';
import InsightsPage from './pages/athlete/InsightsPage';
import CoachHome from './pages/coach/CoachHome';
import GymHome from './pages/gym/GymHome';
import AdminHome from './pages/admin/AdminHome';
import KioskHome from './pages/kiosk/KioskHome';
import NotFound from './pages/NotFound';

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isKiosk = pathname.startsWith('/kiosk');

  if (isKiosk) {
    return <main className="min-h-screen bg-black">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--fp-bg)', color: 'var(--fp-text)' }}>
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/sign-up" element={<SignUp />} />
        <Route path="/kiosk/:gymId" element={<KioskHome />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/:slug" element={<ExerciseDetailPage />} />
        </Route>

        <Route element={<RoleRoute roles={['athlete']} />}>
          <Route path="/athlete" element={<AthleteHome />} />
          <Route path="/athlete/explorer" element={<MuscleExplorerPage />} />
          <Route path="/athlete/log" element={<WorkoutLoggerPage />} />
          <Route path="/athlete/history" element={<HistoryPage />} />
          <Route path="/athlete/insights" element={<InsightsPage />} />
        </Route>

        <Route element={<RoleRoute roles={['coach']} />}>
          <Route path="/coach" element={<CoachHome />} />
        </Route>

        <Route element={<RoleRoute roles={['gym_owner']} />}>
          <Route path="/gym" element={<GymHome />} />
        </Route>

        <Route element={<RoleRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminHome />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

export default App;
