import { beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MusclePanel } from "../../components/muscle/MusclePanel";
const state = vi.hoisted(() => ({
  selected: "middle-chest",
  dispatch: vi.fn(),
}));
vi.mock("../../store/hooks", () => ({
  useAppDispatch: () => state.dispatch,
  useAppSelector: (select: any) =>
    select({ explorer: { selectedMuscleKey: state.selected } }),
}));
vi.mock("../../queries/useMuscles", () => ({
  useMuscleDetail: () => ({
    data: {
      muscle: {
        _id: "muscle-id",
        displayName: "Middle Chest",
        group: "chest",
        description: "Pectoralis major.",
      },
      primaryExercises: [
        {
          _id: "press",
          slug: "bench-press",
          name: "Bench Press",
          equipment: ["barbell"],
          difficulty: "beginner",
        },
      ],
      secondaryExercises: [
        {
          _id: "close",
          slug: "close-grip",
          name: "Close-Grip Press",
          equipment: ["barbell"],
          difficulty: "intermediate",
        },
      ],
    },
  }),
}));
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  state.selected = "middle-chest";
});
it("switches muscle involvement and links to real exercise and library routes", () => {
  render(
    <MemoryRouter>
      <MusclePanel />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: /Bench Press/ })).toHaveAttribute(
    "href",
    "/exercises/bench-press",
  );
  expect(
    screen.getByRole("link", { name: /Open in exercise library/ }),
  ).toHaveAttribute("href", "/exercises?muscle=muscle-id");
  fireEvent.click(screen.getByRole("button", { name: "Supporting 1" }));
  expect(screen.getByRole("button", { name: "Supporting 1" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    screen.queryByRole("link", { name: /Bench Press/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Close-Grip Press/ }),
  ).toHaveAttribute("href", "/exercises/close-grip");
  fireEvent.click(
    screen.getByRole("button", { name: "Clear selected muscle" }),
  );
  expect(state.dispatch).toHaveBeenCalledWith({
    type: "explorer/clearSelectedMuscle",
    payload: undefined,
  });
});
it("explains how to select a muscle when nothing is selected", () => {
  state.selected = "";
  render(
    <MemoryRouter>
      <MusclePanel />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "Start with a muscle." }),
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: /Browse all exercises/ }),
  ).toHaveAttribute("href", "/exercises");
});
