import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { categories, money } from "./marketplaceShared";
import type { Listing } from "./marketplaceShared";
import "../../marketplace.css";
const blank = {
  title: "",
  category: "plan",
  summary: "",
  description: "",
  features: "",
  price: "",
  currency: "INR",
  billing: "once",
  duration: "",
  sellerLicenceRef: "",
  reviewNote: "",
};
export default function MarketManagePage() {
  const { user } = useAuth();
  const admin = !!user?.roles.includes("admin");
  const coach = !!user?.roles.includes("coach");
  const cache = useQueryClient();
  const [selected, setSelected] = useState<Listing | null>(null);
  const [form, setForm] = useState({
    ...blank,
    category: coach || admin ? "plan" : "gear",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verified, setVerified] = useState(false);
  const query = useQuery<Listing[]>({
    queryKey: ["marketplace-provider", user?._id, admin],
    queryFn: async () =>
      (
        await api.get("/marketplace/provider/listings", {
          params: { all: admin },
        })
      ).data.data,
  });
  const allowed = categories.filter(
    ([key]) =>
      key !== "all" &&
      (admin ||
        (coach && ["plan", "coaching"].includes(key)) ||
        (user?.roles.includes("gym_owner") &&
          ["meal", "supplement", "gear"].includes(key))),
  );
  const field = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const edit = (listing: Listing) => {
    setSelected(listing);
    setVerified(false);
    setError("");
    setForm({
      title: listing.title,
      category: listing.category,
      summary: listing.summary,
      description: listing.description,
      features: listing.features.join("\n"),
      price: String(listing.priceMinor / 100),
      currency: listing.currency,
      billing: listing.billing,
      duration: listing.duration || "",
      sellerLicenceRef: listing.sellerLicenceRef || "",
      reviewNote: listing.reviewNote || "",
    });
    document.getElementById("market-listing-title")?.focus();
  };
  const save = async (status: string) => {
    setError("");
    const element = document.getElementById(
      "market-listing-form",
    ) as HTMLFormElement;
    if (!element.reportValidity()) return;
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        category: form.category,
        summary: form.summary,
        description: form.description,
        features: form.features
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        priceMinor: Math.round(Number(form.price) * 100),
        currency: form.currency,
        billing: form.billing,
        duration: form.duration,
        sellerLicenceRef: form.sellerLicenceRef,
        ...(admin ? { reviewNote: form.reviewNote } : {}),
      };
      let listing: Listing;
      if (selected) {
        listing = (
          await api.patch(`/marketplace/provider/listings/${selected._id}`, {
            ...payload,
            status,
            ...(verified ? { verificationAcknowledged: true } : {}),
          })
        ).data.data;
      } else {
        listing = (await api.post("/marketplace/provider/listings", payload))
          .data.data;
        if (status !== "draft")
          listing = (
            await api.patch(`/marketplace/provider/listings/${listing._id}`, {
              status,
              ...(verified ? { verificationAcknowledged: true } : {}),
            })
          ).data.data;
      }
      setSelected(listing);
      await cache.invalidateQueries({ queryKey: ["marketplace-provider"] });
      cache.invalidateQueries({ queryKey: ["marketplace"] });
      cache.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        status === "published"
          ? "Listing published"
          : status === "pending"
            ? "Listing sent for admin review"
            : "Draft saved",
      );
    } catch (e: any) {
      setError(
        e.response?.data?.errors?.[0] ||
          e.response?.data?.message ||
          "Listing could not be saved. Your edits are still here.",
      );
    } finally {
      setBusy(false);
    }
  };
  const food = ["meal", "supplement"].includes(form.category);
  const rows =
    query.data?.filter(
      (row) => statusFilter === "all" || row.status === statusFilter,
    ) || [];
  return (
    <div className="product-page marketplace-page">
      <Link className="page-back" to="/marketplace">
        <ArrowLeft size={16} />
        Marketplace
      </Link>
      <div className="page-top-actions">
        <Link
          className="secondary-action"
          to="/marketplace/requests?view=provider"
        >
          Incoming enquiries
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="market-manage-layout">
        <section className="page-section">
          <div className="section-row">
            <h2>{admin ? "All listings" : "Your listings"}</h2>
            <button
              className="row-action"
              onClick={() => {
                setSelected(null);
                setForm({
                  ...blank,
                  category: coach || admin ? "plan" : "gear",
                });
                setError("");
                setVerified(false);
                document.getElementById("market-listing-title")?.focus();
              }}
            >
              <Plus size={16} />
              New
            </button>
          </div>
          <label className="sr-only" htmlFor="listing-status-filter">
            Filter listing status
          </label>
          <select
            id="listing-status-filter"
            className="fp-input mt-4"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Awaiting review</option>
            <option value="published">Published</option>
          </select>
          {query.isLoading ? (
            <p className="empty-copy" role="status">
              Loading listings…
            </p>
          ) : query.isError ? (
            <div className="page-state">
              <p>Listings couldn’t be loaded.</p>
              <button onClick={() => query.refetch()}>Retry</button>
            </div>
          ) : rows.length ? (
            <ul className="provider-listings">
              {rows.map((listing) => (
                <li key={listing._id}>
                  <button
                    className={selected?._id === listing._id ? "selected" : ""}
                    onClick={() => edit(listing)}
                  >
                    <strong>{listing.title}</strong>
                    <span>
                      {admin ? `${listing.providerId?.name} · ` : ""}
                      {money(listing.priceMinor, listing.currency)}
                    </span>
                    <small>
                      {listing.status === "pending"
                        ? "Awaiting review"
                        : listing.status}
                      {listing.isDemo ? " · Demo" : ""}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-copy">No listings in this view.</p>
          )}
        </section>
        <form
          id="market-listing-form"
          className="page-section"
          onSubmit={(e) => {
            e.preventDefault();
            save("draft");
          }}
        >
          <div className="section-row">
            <h2>{selected ? "Edit listing" : "Create an offering"}</h2>
            {selected?.status === "published" && (
              <Link className="page-back" to={`/marketplace/${selected.slug}`}>
                View public listing
                <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
          {admin && selected && (
            <p>Provider: {selected.providerId?.name || "Selected provider"}</p>
          )}
          <label className="fp-label mt-5" htmlFor="market-listing-title">
            Title
          </label>
          <input
            id="market-listing-title"
            className="fp-input"
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
            required
            minLength={3}
            maxLength={100}
          />
          <div className="form-grid mt-5">
            <label>
              Category
              <select
                className="fp-input"
                value={form.category}
                onChange={(e) => {
                  field("category", e.target.value);
                  setVerified(false);
                }}
              >
                {allowed.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Duration or scope
              <input
                className="fp-input"
                value={form.duration}
                maxLength={80}
                onChange={(e) => field("duration", e.target.value)}
                placeholder="e.g. 4 weeks"
              />
            </label>
          </div>
          <label className="fp-label mt-5" htmlFor="listing-summary">
            Short description
          </label>
          <input
            id="listing-summary"
            className="fp-input"
            value={form.summary}
            required
            minLength={10}
            maxLength={220}
            onChange={(e) => field("summary", e.target.value)}
          />
          <label className="fp-label mt-5" htmlFor="listing-description">
            Full description
          </label>
          <textarea
            id="listing-description"
            className="fp-input"
            rows={5}
            value={form.description}
            required
            minLength={20}
            maxLength={4000}
            onChange={(e) => field("description", e.target.value)}
          />
          <label className="fp-label mt-5" htmlFor="listing-features">
            What’s included <span className="font-normal">(up to 8 lines)</span>
          </label>
          <textarea
            id="listing-features"
            className="fp-input"
            rows={3}
            value={form.features}
            onChange={(e) => field("features", e.target.value)}
          />
          <div className="field-row mt-5">
            <label className="numeric-field">
              Listed price
              <input
                className="fp-input"
                type="number"
                min={0}
                max={1000000}
                step="0.01"
                required
                value={form.price}
                onChange={(e) => field("price", e.target.value)}
              />
            </label>
            <label className="numeric-field">
              Currency
              <select
                className="fp-input"
                value={form.currency}
                onChange={(e) => field("currency", e.target.value)}
              >
                <option>INR</option>
                <option>USD</option>
              </select>
            </label>
            <label className="numeric-field">
              Price period
              <select
                className="fp-input"
                value={form.billing}
                onChange={(e) => field("billing", e.target.value)}
              >
                <option value="once">One time</option>
                <option value="month">Per month</option>
              </select>
            </label>
          </div>
          {food && (
            <div className="licence-review">
              <label className="fp-label" htmlFor="seller-licence">
                Seller licence reference
              </label>
              <input
                id="seller-licence"
                className="fp-input"
                value={form.sellerLicenceRef}
                maxLength={160}
                onChange={(e) => {
                  field("sellerLicenceRef", e.target.value);
                  setVerified(false);
                }}
              />
              <p className="section-note">
                An admin must review the seller’s licence and product
                documentation before publication.
              </p>
              {admin && (
                <label className="athlete-choice">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                  />
                  I reviewed the seller licence and supporting documents.
                </label>
              )}
            </div>
          )}
          {admin && (
            <>
              <label className="fp-label mt-5" htmlFor="market-review-note">
                Admin review note
              </label>
              <textarea
                id="market-review-note"
                className="fp-input"
                rows={2}
                maxLength={1000}
                value={form.reviewNote}
                onChange={(e) => field("reviewNote", e.target.value)}
              />
            </>
          )}
          {error && (
            <div className="form-feedback" role="alert">
              {error}
            </div>
          )}
          <div className="market-manage-actions">
            <button className="secondary-action" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save draft"}
            </button>
            {admin ? (
              <button
                className="primary-action"
                type="button"
                disabled={
                  busy || (food && (!verified || !form.sellerLicenceRef.trim()))
                }
                onClick={() => save("published")}
              >
                Approve & publish
              </button>
            ) : (
              <button
                className="primary-action"
                type="button"
                disabled={busy}
                onClick={() => save("pending")}
              >
                Submit for review
              </button>
            )}
          </div>
          <p className="section-note">
            {admin
              ? "Approval publishes this listing in the catalogue. Payment collection remains separate."
              : "An admin reviews every offering. Editing a published listing sends it back for review."}
          </p>
        </form>
      </div>
    </div>
  );
}
