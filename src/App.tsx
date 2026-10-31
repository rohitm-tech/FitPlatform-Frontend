import {lazy,Suspense} from 'react';
import { Route, Routes, useLocation } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { RoleRoute } from "./components/common/RoleRoute";

import Landing from "./pages/Landing";
const SettingsPage=lazy(()=>import("./pages/auth/SettingsPage"));
const ForgotPassword=lazy(()=>import("./pages/auth/ForgotPassword"));
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
const OnboardingPage=lazy(()=>import("./pages/auth/OnboardingPage"));
const RecoveryPage=lazy(()=>import("./pages/athlete/RecoveryPage"));
const AthleteHome=lazy(()=>import("./pages/athlete/AthleteHome"));
const MuscleExplorerPage=lazy(()=>import("./pages/athlete/MuscleExplorerPage"));
const ExercisesPage=lazy(()=>import("./pages/athlete/ExercisesPage"));
const ExerciseDetailPage=lazy(()=>import("./pages/athlete/ExerciseDetailPage"));
const WorkoutLoggerPage=lazy(()=>import("./pages/athlete/WorkoutLoggerPage"));
const HistoryPage=lazy(()=>import("./pages/athlete/HistoryPage"));
const InsightsPage=lazy(()=>import("./pages/athlete/InsightsPage"));
const CoachHome=lazy(()=>import("./pages/coach/CoachHome"));
const AthleteDetailPage=lazy(()=>import("./pages/coach/AthleteDetailPage"));
const WorkoutBuilderPage=lazy(()=>import("./pages/coach/WorkoutBuilderPage"));
const JoinGym=lazy(()=>import("./pages/gym/JoinGym"));
const GymHome=lazy(()=>import("./pages/gym/GymHome"));
const AdminHome=lazy(()=>import("./pages/admin/AdminHome"));
const KioskApprove=lazy(()=>import("./pages/kiosk/KioskApprove"));
const KioskHome=lazy(()=>import("./pages/kiosk/KioskHome"));
const NotFound=lazy(()=>import("./pages/NotFound"));

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isKiosk = pathname.startsWith("/kiosk");

  if (isKiosk) {
    return <main className="min-h-screen bg-black">{children}</main>;
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--fp-bg)", color: "var(--fp-text)" }}
    >
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-16 text-sm text-slate-400" role="status">Loading workspace…</div>}><Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/sign-up" element={<SignUp />} />
        <Route path="/kiosk/:gymId" element={<KioskHome />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/kiosk-approve/:requestId" element={<KioskApprove />} />
          <Route path="/join-gym" element={<JoinGym />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/:slug" element={<ExerciseDetailPage />} />
        </Route>

        <Route element={<RoleRoute roles={["athlete"]} />}>
          <Route path="/athlete" element={<AthleteHome />} />
          <Route path="/athlete/recovery" element={<RecoveryPage />} />
          <Route path="/athlete/explorer" element={<MuscleExplorerPage />} />
          <Route path="/athlete/log" element={<WorkoutLoggerPage />} />
          <Route path="/athlete/history" element={<HistoryPage />} />
          <Route path="/athlete/insights" element={<InsightsPage />} />
        </Route>

        <Route element={<RoleRoute roles={["coach"]} />}>
          <Route path="/coach" element={<CoachHome />} />
          <Route
            path="/coach/athletes/:athleteId"
            element={<AthleteDetailPage />}
          />
          <Route path="/coach/builder" element={<WorkoutBuilderPage />} />
        </Route>

        <Route element={<RoleRoute roles={["gym_owner"]} />}>
          <Route path="/gym" element={<GymHome />} />
        </Route>

        <Route element={<RoleRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminHome />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes></Suspense>
    </AppShell>
  );
}

export default App;
