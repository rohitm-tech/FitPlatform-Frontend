import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

type Feature = {
  key: string;
  label: string;
  included: boolean;
  limit: number | null;
};

type Plan = {
  id: string;
  name: string;
  priceMinor: number;
  interval: "month" | "once";
  features: Feature[];
};

type Pricing = {
  plans: Plan[];
  coachInviteFeeMinor: number;
  coachChatFeeMinor: number;
  coachEarningsFeePercent: number;
  gymMonthlyMinor: number;
  marketplaceFeePercent: number;
};

type MoneySlice = {
  monthMinor: number;
  yearMinor: number;
  totalMinor: number;
  monthCount: number;
  yearCount: number;
  count: number;
};

type RevenueLine = MoneySlice & { kind: string; label: string };

type RevenueSection = MoneySlice & {
  id: string;
  label: string;
  detail: string;
  lines: RevenueLine[];
};

type Revenue = {
  totalMinor: number;
  monthMinor: number;
  yearMinor: number;
  demoMinor: number;
  sections: RevenueSection[];
};

const rupees = (minor = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

const toRupees = (minor: number) => Math.round(minor / 100);
const toMinor = (rupee: number) => Math.round(rupee * 100);
const charges = (count: number) => `${count} ${count === 1 ? "charge" : "charges"}`;

export default function PricingDesk() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [source, setSource] = useState("athletes");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");
    try {
      const [prices, earned] = await Promise.all([
        api.get("/billing/pricing"),
        api.get("/billing/revenue"),
      ]);
      setPricing(prices.data.data);
      setRevenue(earned.data.data);
    } catch {
      setError("Pricing and earnings could not be loaded.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updatePlan = (id: string, patch: Partial<Plan>) => {
    setPricing((current) =>
      current
        ? {
            ...current,
            plans: current.plans.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)),
          }
        : current,
    );
  };

  const updateFeature = (planId: string, key: string, patch: Partial<Feature>) => {
    setPricing((current) =>
      current
        ? {
            ...current,
            plans: current.plans.map((plan) =>
              plan.id === planId
                ? {
                    ...plan,
                    features: plan.features.map((feature) =>
                      feature.key === key ? { ...feature, ...patch } : feature,
                    ),
                  }
                : plan,
            ),
          }
        : current,
    );
  };

  const addFeature = (planId: string) => {
    const key = `feature_${Date.now()}`;
    setPricing((current) =>
      current
        ? {
            ...current,
            plans: current.plans.map((plan) =>
              plan.id === planId
                ? {
                    ...plan,
                    features: [
                      ...plan.features,
                      { key, label: "New feature", included: false, limit: null },
                    ],
                  }
                : plan,
            ),
          }
        : current,
    );
  };

  const save = async () => {
    if (!pricing) return;
    setBusy(true);
    try {
      const saved = await api.patch("/billing/pricing", pricing);
      setPricing(saved.data.data);
      toast.success("Pricing saved");
      const earned = await api.get("/billing/revenue");
      setRevenue(earned.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Pricing could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const section = revenue?.sections.find((item) => item.id === source) ?? revenue?.sections[0];

  return (
    <section className="pricing-desk" aria-label="Pricing and earnings">
      <h2>Platform earnings</h2>
      {error && (
        <p className="form-feedback" role="alert">
          {error}{" "}
          <button type="button" onClick={load}>
            Retry
          </button>
        </p>
      )}
      {revenue && section && (
        <>
          <div className="platform-kpis">
            <div className="platform-kpi">
              <strong>{rupees(revenue.monthMinor)}</strong>
              <span>Earned this month</span>
            </div>
            <div className="platform-kpi">
              <strong>{rupees(revenue.yearMinor)}</strong>
              <span>Earned this year</span>
            </div>
            <div className="platform-kpi">
              <strong>{rupees(revenue.totalMinor)}</strong>
              <span>All-time platform earnings</span>
            </div>
          </div>
          {revenue.demoMinor > 0 && (
            <p className="section-note">
              {rupees(revenue.demoMinor)} of the all-time total is demo data, recorded so the books
              are not empty before a live payment. Amounts are in rupees.
            </p>
          )}
          <div className="platform-tabs" role="tablist" aria-label="Earnings by source">
            {revenue.sections.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === section.id}
                onClick={() => setSource(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="platform-panel" role="tabpanel">
            <p>{section.detail}</p>
            <div className="platform-kpis">
              <div className="platform-kpi">
                <strong>{rupees(section.monthMinor)}</strong>
                <span>This month · {charges(section.monthCount)}</span>
              </div>
              <div className="platform-kpi">
                <strong>{rupees(section.yearMinor)}</strong>
                <span>This year · {charges(section.yearCount)}</span>
              </div>
              <div className="platform-kpi">
                <strong>{rupees(section.totalMinor)}</strong>
                <span>All time · {charges(section.count)}</span>
              </div>
            </div>
            {section.lines.length === 0 ? (
              <p className="section-note">No charges in this section yet.</p>
            ) : (
              <ul className="platform-lines">
                {section.lines.map((line) => (
                  <li key={line.kind}>
                    <strong>{line.label}</strong>
                    <span>
                      <em>This month</em>
                      {rupees(line.monthMinor)}
                    </span>
                    <span>
                      <em>This year</em>
                      {rupees(line.yearMinor)}
                    </span>
                    <span>
                      <em>All time</em>
                      {rupees(line.totalMinor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {pricing && (
        <>
          <h2 className="pricing-heading">Plans and fees</h2>
          <div className="pricing-plans">
            {pricing.plans.map((plan) => (
              <article key={plan.id} className="pricing-plan">
                <div className="pricing-plan-head">
                  <label>
                    Plan name
                    <input
                      className="fp-input"
                      value={plan.name}
                      onChange={(event) => updatePlan(plan.id, { name: event.target.value })}
                    />
                  </label>
                  <label>
                    Price (₹) {plan.interval === "month" ? "each month" : "once"}
                    <input
                      className="fp-input"
                      type="number"
                      min={0}
                      value={toRupees(plan.priceMinor)}
                      onChange={(event) =>
                        updatePlan(plan.id, { priceMinor: toMinor(Number(event.target.value || 0)) })
                      }
                    />
                  </label>
                </div>
                <h3>Features on this plan</h3>
                <ul className="pricing-features">
                  {plan.features.map((feature) => (
                    <li key={feature.key} className="pricing-feature">
                      <label>
                        Feature
                        <input
                          className="fp-input"
                          aria-label={`${plan.name} feature`}
                          value={feature.label}
                          onChange={(event) =>
                            updateFeature(plan.id, feature.key, { label: event.target.value })
                          }
                        />
                      </label>
                      <label className="pricing-check">
                        <input
                          type="checkbox"
                          checked={feature.included}
                          onChange={(event) =>
                            updateFeature(plan.id, feature.key, { included: event.target.checked })
                          }
                        />
                        Included
                      </label>
                      <label>
                        Limit
                        <input
                          className="fp-input"
                          type="number"
                          min={0}
                          value={feature.limit ?? ""}
                          placeholder="None"
                          onChange={(event) =>
                            updateFeature(plan.id, feature.key, {
                              limit: event.target.value === "" ? null : Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="text-action"
                        onClick={() =>
                          updatePlan(plan.id, {
                            features: plan.features.filter((item) => item.key !== feature.key),
                          })
                        }
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="secondary-action" onClick={() => addFeature(plan.id)}>
                  Add a feature
                </button>
              </article>
            ))}
          </div>
          <div className="pricing-fees-card">
            <h3>What the platform charges</h3>
            <div className="pricing-fees">
              <label>
                Coach invite fee (₹)
                <input
                  className="fp-input"
                  type="number"
                  min={0}
                  value={toRupees(pricing.coachInviteFeeMinor)}
                  onChange={(event) =>
                    setPricing({ ...pricing, coachInviteFeeMinor: toMinor(Number(event.target.value || 0)) })
                  }
                />
              </label>
              <label>
                Extra coach conversation (₹)
                <input
                  className="fp-input"
                  type="number"
                  min={0}
                  value={toRupees(pricing.coachChatFeeMinor)}
                  onChange={(event) =>
                    setPricing({ ...pricing, coachChatFeeMinor: toMinor(Number(event.target.value || 0)) })
                  }
                />
              </label>
              <label>
                Share of coach earnings (%)
                <input
                  className="fp-input"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={pricing.coachEarningsFeePercent}
                  onChange={(event) =>
                    setPricing({ ...pricing, coachEarningsFeePercent: Number(event.target.value || 0) })
                  }
                />
              </label>
              <label>
                Gym installation each month (₹)
                <input
                  className="fp-input"
                  type="number"
                  min={0}
                  value={toRupees(pricing.gymMonthlyMinor)}
                  onChange={(event) =>
                    setPricing({ ...pricing, gymMonthlyMinor: toMinor(Number(event.target.value || 0)) })
                  }
                />
              </label>
              <label>
                Marketplace fee on each sale (%)
                <input
                  className="fp-input"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={pricing.marketplaceFeePercent}
                  onChange={(event) =>
                    setPricing({ ...pricing, marketplaceFeePercent: Number(event.target.value || 0) })
                  }
                />
              </label>
            </div>
          </div>
          <p className="section-note">
            Wearable imports, the AI coach, and how many coaches an athlete can message are enforced.
            Extra feature rows are shown on the plan.
          </p>
          <button type="button" className="primary-action" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save pricing"}
          </button>
        </>
      )}
    </section>
  );
}
