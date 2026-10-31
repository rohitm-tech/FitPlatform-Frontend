import { beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WorkoutLoggerPage from "../../pages/athlete/WorkoutLoggerPage";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: { _id: "athlete-1" } }),
}));

vi.mock("../../queries/useExercises", () => ({
  useExercises: () => ({
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    data: {
      exercises: [
        {
          _id: "bench",
          name: "Barbell Bench Press",
          slug: "barbell-bench-press",
          primaryMuscles: [
            {
              _id: "m1",
              key: "middle-chest",
              displayName: "Middle Chest",
              group: "chest",
            },
          ],
          secondaryMuscles: [],
          equipment: ["barbell"],
          difficulty: "intermediate",
          type: "strength",
          instructions: [],
          videoUrl: null,
        },
        {
          _id: "row",
          name: "Barbell Row",
          slug: "barbell-row",
          primaryMuscles: [
            {
              _id: "m2",
              key: "upper-back",
              displayName: "Upper Back",
              group: "back",
            },
          ],
          secondaryMuscles: [],
          equipment: ["barbell"],
          difficulty: "intermediate",
          type: "strength",
          instructions: [],
          videoUrl: null,
        },
        {
          _id: "squat",
          name: "Goblet Squat",
          slug: "goblet-squat",
          primaryMuscles: [
            {
              _id: "m3",
              key: "quadriceps",
              displayName: "Quadriceps",
              group: "legs",
            },
          ],
          secondaryMuscles: [],
          equipment: ["dumbbell"],
          difficulty: "beginner",
          type: "strength",
          instructions: [],
          videoUrl: null,
        },
      ],
      page: 1,
      limit: 200,
      total: 3,
    },
  }),
}));

vi.mock("../../queries/useAthlete", () => ({
  useAthleteWorkouts: () => ({
    data: [],
    isLoading: false,
    refetch: vi.fn(),
  }),
  useLogWorkout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAthleteLogs: () => ({
    data: [
      {
        _id: "log-1",
        date: "2026-10-30",
        items: [
          {
            exerciseId: {
              _id: "squat",
              name: "Goblet Squat",
              slug: "goblet-squat",
            },
            sets: [],
          },
        ],
      },
    ],
    isError: false,
    refetch: vi.fn(),
  }),
}));

const mount = () =>
  render(
    <MemoryRouter initialEntries={["/athlete/log"]}>
      <WorkoutLoggerPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  cleanup();
});

it("lists a body area so several exercises can be added without searching again", () => {
  mount();
  expect(
    screen.getByText("Choose a body area to see exercises you can add."),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "Add Barbell Bench Press" })).not
    .toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Chest" }));
  const chest = screen.getByRole("region", { name: "Chest exercises" });
  expect(
    within(chest).getByRole("button", { name: "Add Barbell Bench Press" }),
  ).toBeVisible();
  expect(
    within(chest).queryByRole("button", { name: "Add Goblet Squat" }),
  ).not.toBeInTheDocument();

  fireEvent.click(
    within(chest).getByRole("button", { name: "Add Barbell Bench Press" }),
  );
  expect(
    screen.getByRole("heading", { name: "Barbell Bench Press" }),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Barbell Bench Press is in this session" }),
  ).toBeVisible();
  expect(screen.getByLabelText("Search by name")).toHaveValue("");

  fireEvent.click(
    screen.getByRole("button", { name: "Barbell Bench Press is in this session" }),
  );
  expect(screen.getAllByRole("heading", { name: "Barbell Bench Press" })).toHaveLength(
    1,
  );

  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  fireEvent.click(screen.getByRole("button", { name: "Add Barbell Row" }));
  expect(screen.getByRole("heading", { name: "Barbell Row" })).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Barbell Bench Press" }),
  ).toBeVisible();
});

it("finds an exercise from part of its name and from recent sessions", () => {
  mount();
  fireEvent.change(screen.getByLabelText("Search by name"), {
    target: { value: "gob" },
  });
  const matches = screen.getByRole("region", {
    name: "Exercises matching your search",
  });
  expect(
    within(matches).getByRole("button", { name: "Add Goblet Squat" }),
  ).toBeVisible();
  expect(
    within(matches).queryByRole("button", { name: "Add Barbell Bench Press" }),
  ).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Search by name"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add Goblet Squat" }));
  expect(screen.getByRole("heading", { name: "Goblet Squat" })).toBeVisible();
});
