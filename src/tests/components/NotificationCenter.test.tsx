import { beforeEach, expect, it, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationCenter } from "../../components/layout/NotificationCenter";
import { api } from "../../services/api";
vi.mock("../../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: { _id: "athlete" } }),
}));
let read = false;
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  read = false;
  vi.mocked(api.get).mockImplementation(async () => ({
    data: {
      data: {
        items: [
          {
            _id: "notice",
            title: "A workout is ready for you",
            body: "Your coach assigned a session.",
            href: "/athlete/history?date=2026-11-03",
            createdAt: "2026-10-31T10:00:00Z",
            readAt: read ? "2026-10-31T10:01:00Z" : null,
          },
        ],
        unreadCount: read ? 0 : 1,
        nextCursor: null,
      },
    },
  }));
  vi.mocked(api.post).mockImplementation(async () => {
    read = true;
    return { data: {} };
  });
  vi.mocked(api.patch).mockResolvedValue({ data: {} });
});
const mount = () =>
  render(
    <MemoryRouter>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NotificationCenter />
      </QueryClientProvider>
    </MemoryRouter>,
  );
it("shows an unread count and marks database-backed updates read", async () => {
  mount();
  const bell = await screen.findByRole("button", {
    name: "Notifications, 1 unread",
  });
  fireEvent.click(bell);
  expect(
    await screen.findByText("Your coach assigned a session."),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toHaveAttribute("aria-expanded", "true"),
  );
  expect(api.post).toHaveBeenCalledWith("/notifications/read-all");
  expect(await screen.findByText("You’re up to date")).toBeVisible();
});
it("closes with Escape and returns keyboard focus to the bell", async () => {
  mount();
  const bell = await screen.findByRole("button", {
    name: "Notifications, 1 unread",
  });
  fireEvent.click(bell);
  expect(
    await screen.findByRole("heading", { name: "Notifications" }),
  ).toHaveFocus();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(bell).toHaveFocus();
  expect(bell).toHaveAttribute("aria-expanded", "false");
});
