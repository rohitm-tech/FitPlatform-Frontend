import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodEntry = {
  _id: string;
  meal: Meal;
  name: string;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  createdAt?: string;
};

export type DailyLog = {
  _id: string;
  date: string;
  foods: FoodEntry[];
  waterMl: number;
  weightKg?: number | null;
  mood?: number | null;
  energy?: number | null;
  stress?: number | null;
  note?: string;
};

export function dayKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function useDailyLogs(to: string, days: number) {
  return useQuery({
    queryKey: ["daily-log", to, days],
    queryFn: async () =>
      (await api.get("/daily-log", { params: { to, days } })).data.data
        .logs as DailyLog[],
  });
}

export function foodTotals(foods: FoodEntry[] = []) {
  const sum = (key: "calories" | "proteinG" | "carbsG" | "fatG") =>
    foods.reduce((total, food) => total + (food[key] ?? 0), 0);
  return {
    calories: Math.round(sum("calories")),
    proteinG: Math.round(sum("proteinG")),
    carbsG: Math.round(sum("carbsG")),
    fatG: Math.round(sum("fatG")),
    counted: foods.filter((food) => food.calories != null).length,
    hasProtein: foods.some((food) => food.proteinG != null),
  };
}

export function foodLine(foods: FoodEntry[] = []) {
  const totals = foodTotals(foods);
  const items = `${foods.length} ${foods.length === 1 ? "item" : "items"}`;
  return totals.hasProtein ? `${items} · ${totals.proteinG} g protein` : items;
}

export function litres(ml: number) {
  return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : ml % 100 === 0 ? 1 : 2)} L`;
}
