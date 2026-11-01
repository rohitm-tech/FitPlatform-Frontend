export type PlatformEvent = {
  _id: string;
  title: string;
  summary: string;
  place: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  fullPriceMinor: number;
  premiumPriceMinor: number;
  publicOpensAt: string;
  status: "draft" | "published" | "cancelled";
  goingCount: number;
  yourPriceMinor: number;
  access: "early" | "open" | "closed";
  canRsvp: boolean;
  rsvp: null | {
    status: "going" | "cancelled";
    priceMinor: number;
    planAtSignup: "free" | "premium";
  };
};
