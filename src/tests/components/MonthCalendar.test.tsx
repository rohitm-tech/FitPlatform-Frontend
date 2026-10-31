import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MonthCalendar } from "../../components/workout/MonthCalendar";
import { athleteApi } from "../../services/endpoints/athleteApi";

const fixtures = vi.hoisted(() => {
  const bench = {
    exerciseId: { _id: "bench", name: "Bench press", slug: "bench-press" },
    sets: 4,
    reps: 8,
    targetWeightKg: 60,
    restSec: 90,
    notes: "Pause on the chest",
  };
  const row = {
    exerciseId: { _id: "row", name: "Seated row", slug: "seated-row" },
    sets: 3,
    reps: 10,
    targetWeightKg: null,
    restSec: 90,
    notes: "",
  };
  const press = {
    exerciseId: { _id: "press", name: "Overhead press", slug: "overhead-press" },
    sets: 3,
    reps: 6,
    targetWeightKg: 40,
    restSec: 120,
    notes: "",
  };
  const workouts = [
    {
      _id: "w1",
      athleteId: "ath",
      assignedBy: "coach-1",
      date: new Date(2026, 9, 31, 12).toISOString(),
      title: "Training day — week 6",
      status: "completed",
      items: [bench, row],
    },
    {
      _id: "w2",
      athleteId: "ath",
      assignedBy: "coach-1",
      date: new Date(2026, 9, 31, 15).toISOString(),
      title: "Push + pull foundations",
      status: "planned",
      items: [press],
    },
  ];
  const logs = [
    {
      _id: "log-1",
      athleteId: "ath",
      workoutId: "w1",
      date: new Date(2026, 9, 31, 18).toISOString(),
      durationMin: 50,
      perceivedEffort: 7,
      painFlag: false,
      notes: "Felt smooth.",
      source: "app",
      items: [
        {
          exerciseId: bench.exerciseId,
          sets: [
            { reps: 8, weightKg: 60 },
            { reps: 8, weightKg: 60 },
            { reps: 8, weightKg: 60 },
            { reps: 8, weightKg: 60 },
          ],
        },
        {
          exerciseId: row.exerciseId,
          sets: [
            { reps: 10, weightKg: 40 },
            { reps: 10, weightKg: 40 },
            { reps: 10, weightKg: 40 },
          ],
        },
      ],
    },
  ];
  return { workouts, logs };
});

vi.mock("../../services/endpoints/athleteApi", () => ({
  athleteApi: { listLogs: vi.fn() },
}));
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: { _id: "ath", name: "Asha" } }),
}));
vi.mock("../../queries/useAthlete", () => ({
  useAthleteWorkouts: () => ({
    data: fixtures.workouts,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useComments: (_athleteId: string, params: { workoutId?: string }) => ({
    data:
      params.workoutId === "w2"
        ? [
            {
              _id: "note-1",
              workoutId: "w2",
              workoutLogId: null,
              authorId: { _id: "coach-1", name: "Priya Shah", roles: ["coach"] },
              text: "Keep the last set shy of failure.",
              createdAt: "2026-10-30T08:00:00.000Z",
            },
          ]
        : [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateComment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

beforeEach(() => {
  cleanup();
  vi.mocked(athleteApi.listLogs).mockResolvedValue({
    data: { data: fixtures.logs },
  } as never);
});

it("shows the coach plan and what is already logged for the day", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <MemoryRouter initialEntries={["/athlete/history?date=2026-10-31"]}>
      <QueryClientProvider client={client}>
        <MonthCalendar athleteId="ath" />
      </QueryClientProvider>
    </MemoryRouter>,
  );

  expect(
    await screen.findByText(
      "Your coach assigned 2 sessions. 1 logged, 1 still to log. Push + pull foundations is still open.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("7 sets recorded · 10 sets assigned")).toBeInTheDocument();
  expect(screen.getByText("Bench press")).toBeInTheDocument();
  expect(screen.getByText("Seated row")).toBeInTheDocument();
  expect(screen.getByText("Overhead press")).toBeInTheDocument();
  expect(screen.getByText("Pause on the chest")).toBeInTheDocument();
  expect(document.querySelector(".coach-note-callout")).toHaveTextContent(
    "Keep the last set shy of failure.",
  );
  expect(screen.getByRole("link", { name: /Log this session/ })).toHaveAttribute(
    "href",
    "/athlete/log?workoutId=w2",
  );
  expect(
    screen.getByRole("button", { name: /Training day — week 6/ }),
  ).toHaveTextContent("1/2");
});
