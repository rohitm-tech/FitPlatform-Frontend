import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../services/api";

type Feature = { key: string; label: string; included: boolean; limit: number | null };

type Profile = {
  plan: string;
  planName: string;
  features: Feature[];
  coachChatsUsed: number;
  coachChatsIncluded: number;
  pricing: {
    plans: { id: string; name: string; priceMinor: number }[];
  };
};

const rupees = (minor = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default function PlanPanel() {
  const queries = useQueryClient();
  const profile = useQuery({
    queryKey: ["billing-me"],
    queryFn: async () => (await api.get("/billing/me")).data.data as Profile,
  });
  const data = profile.data;
  const premium = data?.pricing.plans.find((plan) => plan.id === "premium");

  const choose = async (planId: string) => {
    try {
      await api.post("/billing/upgrade", { planId });
      toast.success(planId === "free" ? "You are on the free plan." : "Premium is active.");
      await queries.invalidateQueries({ queryKey: ["billing-me"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "The plan could not be changed.");
    }
  };

  if (profile.isLoading) return <p>Loading your plan…</p>;
  if (profile.isError || !data) {
    return (
      <p>
        Your plan could not be loaded.{" "}
        <button type="button" onClick={() => profile.refetch()}>
          Retry
        </button>
      </p>
    );
  }

  return (
    <section className="settings-row" aria-label="Your plan">
      <div>
        <h2>{data.planName}</h2>
        <p className="settings-description">
          Free includes hand logging. Premium adds the AI coach, watch imports, and{" "}
          {data.coachChatsIncluded} coach conversations. You have used {data.coachChatsUsed}.
        </p>
      </div>
      <div>
        <ul className="data-list">
          {data.features.map((feature) => (
            <li key={feature.key}>
              <strong>{feature.label}</strong>
              <span>
                {feature.included
                  ? feature.limit != null
                    ? `${feature.limit} included`
                    : "Included"
                  : "Not included"}
              </span>
            </li>
          ))}
        </ul>
        {data.plan !== "premium" && premium && (
          <button type="button" className="primary-action" onClick={() => choose("premium")}>
            Go Premium · {rupees(premium.priceMinor)} a month
          </button>
        )}
        {data.plan === "premium" && (
          <button type="button" className="secondary-action" onClick={() => choose("free")}>
            Move to Free
          </button>
        )}
      </div>
    </section>
  );
}
