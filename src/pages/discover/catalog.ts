export const KINDS = [
  ["coach", "Coaches"],
  ["gym", "Gyms"],
  ["pool", "Pools"],
  ["box", "HYROX & CrossFit"],
  ["studio", "Studios"],
  ["court", "Courts"],
  ["wall", "Climbing walls"],
  ["dojo", "Combat gyms"],
  ["turf", "Turf"],
  ["cricket", "Cricket grounds"],
  ["track", "Tracks & routes"],
] as const;

export type Kind = (typeof KINDS)[number][0];

export const SPORTS = [
  "Strength",
  "Running",
  "Swimming",
  "Cricket",
  "Football",
  "HYROX",
  "CrossFit",
  "Yoga",
  "Pilates",
  "Cycling",
  "Boxing",
  "Martial Arts",
  "Tennis",
  "Badminton",
  "Basketball",
  "Climbing",
  "Calisthenics",
  "Dance",
  "Triathlon",
  "Squash",
] as const;

export type Sport = (typeof SPORTS)[number];

export const RADII = [2, 5, 8, 15, 25] as const;

export const BENGALURU = { lat: 12.9716, lng: 77.5946 };

export function noun(kind: Kind, count: number) {
  const one = count === 1;
  switch (kind) {
    case "coach":
      return one ? "coach" : "coaches";
    case "gym":
      return one ? "gym" : "gyms";
    case "pool":
      return one ? "pool" : "pools";
    case "box":
      return one ? "HYROX or CrossFit box" : "HYROX and CrossFit boxes";
    case "studio":
      return one ? "studio" : "studios";
    case "court":
      return one ? "court" : "courts";
    case "wall":
      return one ? "climbing wall" : "climbing walls";
    case "dojo":
      return one ? "combat gym" : "combat gyms";
    case "cricket":
      return one ? "cricket ground" : "cricket grounds";
    case "turf":
      return one ? "turf pitch" : "turf pitches";
    case "track":
      return one ? "track or route" : "tracks and routes";
  }
}

export function findingLine(
  count: number,
  kind: Kind,
  radiusKm: number,
  place: string,
) {
  return `${count} ${noun(kind, count)} inside ${radiusKm} km of ${place}.`;
}

export function priceUnitLabel(unit: string) {
  switch (unit) {
    case "month":
      return "per month";
    case "hour":
      return "per hour";
    case "session":
      return "per session";
    case "class":
      return "per class";
    case "lane-hour":
      return "per lane-hour";
    case "package":
      return "per package";
    case "none":
      return "no charge";
    default:
      return "";
  }
}

export function widerRadius(current: number, nearestKm: number | null) {
  if (nearestKm != null) {
    const fit = RADII.find((km) => km >= nearestKm && km > current);
    if (fit) return fit;
  }
  return RADII.find((km) => km > current) ?? null;
}
