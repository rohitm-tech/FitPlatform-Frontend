import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

type Feature = { key: string; label: string; included: boolean; limit: number | null };

type Profile = {
  plan: string;
  planName: string;
  pricing: {
    plans: { id: string; name: string; priceMinor: number; features: Feature[] }[];
  };
};

const rupees = (minor = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

export function AthletePlanStrip() {
  const profile = useQuery({
    queryKey: ["billing-me"],
    queryFn: async () => (await api.get("/billing/me")).data.data as Profile,
  });
  const data = profile.data;
  if (!data) return null;
  const premium = data.pricing.plans.find((plan) => plan.id === "premium");
  const onPremium = data.plan === "premium";

  return (
    <aside className="plan-chip" aria-label="Your plan">
      <p>
        <strong>{data.planName}</strong>
        <span>
          {onPremium
            ? `${rupees(premium?.priceMinor)} a month`
            : `Subscribe for the community, AI coach, wearables, and coach chats${premium ? ` · ${rupees(premium.priceMinor)} a month` : ""}`}
        </span>
      </p>
      <Link className={onPremium ? "is-quiet" : ""} to="/settings?section=plan">
        {onPremium ? "Your plan" : "Subscribe"}
      </Link>
    </aside>
  );
}

export function CoachRateStrip({
  inviteMinor,
  feePercent,
}: {
  inviteMinor?: number;
  feePercent?: number;
}) {
  if (inviteMinor == null || feePercent == null) return null;
  return (
    <aside className="plan-chip" aria-label="Your coaching rates">
      <p>
        <strong>Free to coach</strong>
        <span>
          Messages to your athletes are free · Invite {rupees(inviteMinor)} · Company keeps {feePercent}%
        </span>
      </p>
    </aside>
  );
}
