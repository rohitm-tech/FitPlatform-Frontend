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

type Revenue = {
  totalMinor: number;
  monthMinor: number;
  demoMinor: number;
  breakdown: { kind: string; label: string; amountMinor: number; count: number }[];
};

const rupees = (minor = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

const toRupees = (minor: number) => Math.round(minor / 100);
const toMinor = (rupee: number) => Math.round(rupee * 100);

export default function PricingDesk() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
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
      {revenue && (
        <>
          <div className="coach-facts">
            <div>
              <strong>{rupees(revenue.totalMinor)}</strong>
              <span>Total platform earnings</span>
            </div>
            <div>
              <strong>{rupees(revenue.monthMinor)}</strong>
              <span>Earned this month</span>
            </div>
            <div>
              <strong>{rupees(revenue.demoMinor)}</strong>
              <span>Of which demo charges</span>
            </div>
          </div>
          <ul className="data-list">
            {revenue.breakdown.map((row) => (
              <li key={row.kind}>
                <strong>{row.label}</strong>
                <span>
                  {rupees(row.amountMinor)} · {row.count} {row.count === 1 ? "charge" : "charges"}
                </span>
              </li>
            ))}
          </ul>
          {revenue.demoMinor > 0 && (
            <p className="section-note">
              Demo charges fill the books until a live payment is captured. Amounts are in rupees.
            </p>
          )}
        </>
      )}

      {pricing && (
        <>
          <h2 className="pricing-heading">Plans and fees</h2>
          <div className="pricing-plans">
            {pricing.plans.map((plan) => (
              <article key={plan.id} className="pricing-plan">
                <label>
                  Plan name
                  <input
                    className="fp-input"
                    value={plan.name}
                    onChange={(event) => updatePlan(plan.id, { name: event.target.value })}
                  />
                </label>
                <label>
                  Price in rupees {plan.interval === "month" ? "per month" : "once"}
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
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature.key} className="pricing-feature">
                      <input
                        aria-label={`${plan.name} feature`}
                        value={feature.label}
                        onChange={(event) =>
                          updateFeature(plan.id, feature.key, { label: event.target.value })
                        }
                      />
                      <label>
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
                          type="number"
                          min={0}
                          value={feature.limit ?? ""}
                          placeholder="—"
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
