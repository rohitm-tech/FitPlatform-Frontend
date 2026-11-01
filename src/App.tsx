import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { RoleRoute } from "./components/common/RoleRoute";

const Landing = lazy(() => import("./pages/Landing"));
const MarketplacePage = lazy(
  () => import("./pages/marketplace/MarketplacePage"),
);
const ListingDetailPage = lazy(
  () => import("./pages/marketplace/ListingDetailPage"),
);
const MarketManagePage = lazy(
  () => import("./pages/marketplace/MarketManagePage"),
);
const MarketRequestsPage = lazy(
  () => import("./pages/marketplace/MarketRequestsPage"),
);
const PaymentsPage = lazy(() => import("./pages/marketplace/PaymentsPage"));
const SettingsPage = lazy(() => import("./pages/auth/SettingsPage"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
const OnboardingPage = lazy(() => import("./pages/auth/OnboardingPage"));
const CompanionPage = lazy(() => import("./pages/athlete/CompanionPage"));
const RecoveryPage = lazy(() => import("./pages/athlete/RecoveryPage"));
const AthleteHome = lazy(() => import("./pages/athlete/AthleteHome"));
const MuscleExplorerPage = lazy(
  () => import("./pages/athlete/MuscleExplorerPage"),
);
const ExercisesPage = lazy(() => import("./pages/athlete/ExercisesPage"));
const ExerciseDetailPage = lazy(
  () => import("./pages/athlete/ExerciseDetailPage"),
);
const WorkoutLoggerPage = lazy(
  () => import("./pages/athlete/WorkoutLoggerPage"),
);
const HistoryPage = lazy(() => import("./pages/athlete/HistoryPage"));
const CommunityPage = lazy(() => import("./pages/community/CommunityPage"));
const EventsPage = lazy(() => import("./pages/community/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/community/EventDetailPage"));
const CoachHome = lazy(() => import("./pages/coach/CoachHome"));
const DiscoverPage = lazy(() => import("./pages/discover/DiscoverPage"));
const PlaceDetailPage = lazy(
  () => import("./pages/discover/PlaceDetailPage"),
);
const PublicCoachPage = lazy(() => import("./pages/coach/PublicCoachPage"));
const CoachProfilePage = lazy(() => import("./pages/coach/CoachProfilePage"));
const AthleteDetailPage = lazy(() => import("./pages/coach/AthleteDetailPage"));
const CoachExplorePage = lazy(() => import("./pages/coach/CoachExplorePage"));
const WorkoutBuilderPage = lazy(
  () => import("./pages/coach/WorkoutBuilderPage"),
);
const JoinGym = lazy(() => import("./pages/gym/JoinGym"));
const GymHome = lazy(() => import("./pages/gym/GymHome"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const KioskApprove = lazy(() => import("./pages/kiosk/KioskApprove"));
const KioskHome = lazy(() => import("./pages/kiosk/KioskHome"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isKiosk = pathname.startsWith("/kiosk/");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  if (isKiosk) {
    return <main className="min-h-screen bg-black">{children}</main>;
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--fp-bg)", color: "var(--fp-text)" }}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div
            className="mx-auto max-w-6xl px-5 py-16 text-sm text-slate-400"
            role="status"
          >
            Loading workspace…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/coaches" element={<DiscoverPage />} />
          <Route path="/places/:placeId" element={<PlaceDetailPage />} />
          <Route path="/coaches/:coachId" element={<PublicCoachPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:slug" element={<ListingDetailPage />} />
          <Route
            element={<RoleRoute roles={["coach", "gym_owner", "admin"]} />}
          >
            <Route path="/marketplace/manage" element={<MarketManagePage />} />
          </Route>
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/auth/sign-up" element={<SignUp />} />
          <Route path="/kiosk/:gymId" element={<KioskHome />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/kiosk-approve/:requestId"
              element={<KioskApprove />}
            />
            <Route path="/join-gym" element={<JoinGym />} />
            <Route
              path="/marketplace/requests"
              element={<MarketRequestsPage />}
            />
            <Route path="/marketplace/payments" element={<PaymentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/exercises/:slug" element={<ExerciseDetailPage />} />
          </Route>

          <Route element={<RoleRoute roles={["athlete"]} />}>
            <Route path="/athlete" element={<AthleteHome />} />
            <Route path="/athlete/companion" element={<CompanionPage />} />
            <Route path="/athlete/recovery" element={<RecoveryPage />} />
            <Route path="/athlete/explorer" element={<MuscleExplorerPage />} />
            <Route path="/athlete/log" element={<WorkoutLoggerPage />} />
            <Route path="/athlete/history" element={<HistoryPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route
              path="/athlete/insights"
              element={<Navigate to="/athlete" replace />}
            />
          </Route>

          <Route element={<RoleRoute roles={["coach"]} />}>
            <Route path="/coach" element={<CoachHome />} />
            <Route path="/coach/explore" element={<CoachExplorePage />} />
            <Route path="/coach/profile" element={<CoachProfilePage />} />
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
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default App;
