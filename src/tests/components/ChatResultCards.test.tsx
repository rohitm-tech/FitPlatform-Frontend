import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatResultCards, { type ChatCard } from "../../components/athlete/ChatResultCards";

afterEach(cleanup);

const coach = (overrides: Partial<Extract<ChatCard, { type: "coach" }>>) =>
  ({
    type: "coach",
    coachId: "c1",
    name: "Rohan Kulkarni",
    sport: "Swimming",
    headline: "Calm water confidence for adults who never learned.",
    summary: "Starts adults in the shallow end.",
    area: "HSR Layout, Bengaluru",
    distanceKm: 0.84,
    delivery: "in_person",
    experienceYears: 9,
    priceMinor: 320000,
    priceUnit: "month",
    languages: ["English", "Hindi", "Kannada", "Tamil"],
    reasons: ["Swimming is their main sport", "0.8 km from HSR Layout"],
    cautions: [],
    isDemo: true,
    ...overrides,
  }) as ChatCard;

function renderCards(cards: ChatCard[]) {
  render(
    <MemoryRouter>
      <ChatResultCards cards={cards} />
    </MemoryRouter>,
  );
}

it("shows each coach as a card with a summary, facts and reasons, linking to their profile", () => {
  renderCards([
    coach({}),
    coach({
      coachId: "c2",
      name: "Ananya Rao",
      delivery: "online",
      distanceKm: 18.2,
      reasons: ["18.2 km away, but coaches online"],
      cautions: ["From ₹4,500/month, above your ₹4,000 budget"],
      isDemo: false,
    }),
  ]);

  const first = screen.getByRole("article", { name: "Rohan Kulkarni, Swimming coach" });
  expect(within(first).getByText("Best fit")).toBeTruthy();
  expect(within(first).getByText("Starts adults in the shallow end.")).toBeTruthy();
  expect(within(first).getByText("0.8 km away")).toBeTruthy();
  expect(within(first).getByText("9 yrs coaching")).toBeTruthy();
  expect(within(first).getByText("From ₹3,200/month")).toBeTruthy();
  expect(within(first).getByText("English, Hindi, Kannada")).toBeTruthy();
  expect(within(first).getByText("Swimming is their main sport")).toBeTruthy();
  expect(within(first).getByText("Demo profile")).toBeTruthy();
  expect(
    within(first).getByRole("link", { name: /view profile/i }).getAttribute("href"),
  ).toBe("/coaches/c1");

  renderCards([coach({ coachId: "c3", name: "Karthik S", delivery: "online", distanceKm: 290, city: "Chennai" })]);
  expect(screen.getByText("Online · based in Chennai")).toBeTruthy();

  const second = screen.getByRole("article", { name: "Ananya Rao, Swimming coach" });
  expect(within(second).queryByText("Best fit")).toBeNull();
  expect(within(second).getByText("Online · 18.2 km away")).toBeTruthy();
  expect(within(second).getByText("From ₹4,500/month, above your ₹4,000 budget")).toBeTruthy();
  expect(within(second).queryByText("Demo profile")).toBeNull();
});

it("renders venues and legacy exercise cards that have no type", () => {
  renderCards([
    {
      type: "place",
      placeId: "p1",
      name: "HSR community pool",
      kind: "pool",
      sport: "Swimming",
      area: "HSR Layout",
      distanceKm: 0.3,
      priceMinor: 15000,
      priceUnit: "hour",
      hours: "06:00–20:00",
    },
    { exerciseId: "e1", name: "Goblet squat", slug: "goblet-squat", difficulty: "beginner" },
  ]);
  const pool = screen.getByRole("link", { name: /HSR community pool/ });
  expect(pool.getAttribute("href")).toBe("/places/p1");
  expect(within(pool).getByText("Swimming · Pools · HSR Layout")).toBeTruthy();
  expect(within(pool).getByText("0.3 km · ₹150 per hour · 06:00–20:00")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Goblet squat/ }).getAttribute("href")).toBe(
    "/exercises/goblet-squat",
  );
  expect(screen.queryByRole("article")).toBeNull();
});

it("links a life-log summary back to the daily log", () => {
  renderCards([
    {
      type: "life",
      name: "18 Oct 2026 – 1 Nov 2026",
      headline: "4 of 14 days logged",
      summary: "1,840 kcal/day · 92 g protein · 2.1 L water",
      href: "/athlete#dash-daylog-title",
    },
    {
      type: "life",
      name: "Outside link",
      href: "https://example.com/log",
    },
  ]);
  const log = screen.getByRole("link", { name: /18 Oct 2026/ });
  expect(log.getAttribute("href")).toBe("/athlete#dash-daylog-title");
  expect(within(log).getByText("4 of 14 days logged")).toBeTruthy();
  expect(within(log).getByText("1,840 kcal/day · 92 g protein · 2.1 L water")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Outside link/ }).getAttribute("href")).toBe(
    "/athlete/recovery",
  );
});
