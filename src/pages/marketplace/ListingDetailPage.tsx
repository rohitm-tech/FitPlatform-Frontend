import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ArrowUpRight } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { ListingCover, money, categories } from "./marketplaceShared";
import type { Listing } from "./marketplaceShared";
import "../../marketplace.css";
export default function ListingDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const query = useQuery<Listing>({
    queryKey: ["marketplace-detail", slug],
    queryFn: async () => (await api.get(`/marketplace/${slug}`)).data.data,
  });
  const listing = query.data;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      navigate("/auth/sign-in", { state: { from: location } });
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post(`/marketplace/listings/${listing!._id}/request`, {
        message,
      });
      setSent(true);
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          "Your enquiry could not be sent. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="product-page marketplace-page">
      <Link className="page-back" to="/marketplace">
        <ArrowLeft size={16} />
        Marketplace
      </Link>
      {query.isLoading ? (
        <div className="page-state" role="status">
          Loading listing…
        </div>
      ) : query.isError || !listing ? (
        <div className="page-state">
          <h1>This listing isn’t available.</h1>
          <p>It may have been withdrawn or is awaiting review.</p>
          <Link to="/marketplace">Back to the catalogue</Link>
        </div>
      ) : (
        <>
          <div className="page-greeting">
            <div>
              <h1>{listing.title}</h1>
              <p>{listing.summary}</p>
            </div>
          </div>
          <div className="listing-detail-layout">
            <div>
              <ListingCover listing={listing} />
              <section className="page-section mt-6">
                <h2>What to expect</h2>
                <p className="listing-description">{listing.description}</p>
                <ul className="listing-includes">
                  {listing.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="listing-provider-detail">
                  <span className="header-avatar">
                    {listing.providerId?.name
                      ?.split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <strong>{listing.providerId?.name}</strong>
                    <p>
                      Platform provider ·{" "}
                      {
                        categories.find(
                          ([key]) => key === listing.category,
                        )?.[1]
                      }
                    </p>
                  </div>
                </div>
              </section>
            </div>
            <section className="page-section listing-request-panel">
              <div className="listing-detail-price">
                <strong>{money(listing.priceMinor, listing.currency)}</strong>
                <span>
                  {listing.billing === "month"
                    ? "per month"
                    : "one-time listed price"}
                  {listing.duration ? ` · ${listing.duration}` : ""}
                </span>
              </div>
              {listing.isDemo && (
                <p className="demo-listing-note">
                  Demo listing · sample price for exploring the platform.
                </p>
              )}
              {sent ? (
                <div className="chat-state" role="status">
                  <Check size={24} />
                  <h2>Your enquiry is with the provider.</h2>
                  <p>
                    You’ll receive a notification when they respond. No payment
                    has been collected.
                  </p>
                  <Link
                    className="secondary-action mt-5"
                    to="/marketplace/requests"
                  >
                    View my requests
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              ) : String(user?._id) === String(listing.providerId?._id) ? (
                <div className="chat-state">
                  <h2>This is your listing.</h2>
                  <Link to="/marketplace/manage">Manage listing</Link>
                </div>
              ) : !user ? (
                <div className="chat-state">
                  <h2>Find out if it’s a fit.</h2>
                  <p>
                    Sign in to ask the provider about availability and next
                    steps.
                  </p>
                  <Link
                    className="primary-action mt-5"
                    to="/auth/sign-in"
                    state={{ from: location }}
                  >
                    Sign in to enquire
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              ) : !user.roles.includes("athlete") ? (
                <p className="section-note">
                  Enquiries are available from an athlete workspace. Providers
                  can manage their offerings from Provider workspace.
                </p>
              ) : (
                <form onSubmit={submit}>
                  <h2>Ask about availability</h2>
                  <p className="section-note">
                    Tell the provider what you’re looking for. They’ll confirm
                    fit, availability and the next steps.
                  </p>
                  <label className="fp-label mt-5" htmlFor="listing-message">
                    Your message
                  </label>
                  <textarea
                    id="listing-message"
                    className="fp-input"
                    rows={5}
                    minLength={5}
                    maxLength={2000}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="My goal, experience and when I’d like to start…"
                  />
                  {error && (
                    <div
                      ref={errorRef}
                      tabIndex={-1}
                      className="form-feedback"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="primary-action mt-5"
                    disabled={busy}
                  >
                    {busy
                      ? "Sending enquiry…"
                      : user
                        ? "Send enquiry"
                        : "Sign in to enquire"}
                    <ArrowUpRight size={16} />
                  </button>
                  <p className="section-note">
                    Sending shares your name, email and message with this
                    provider. A paid coaching package activates their ability to
                    assign workouts and view summary training signals. You
                    control detailed record sharing in Settings.
                  </p>
                </form>
              )}
              <p className="marketplace-boundary">
                The provider accepts first. You can then pay the listed package
                fee securely. Coaching access starts after payment capture;
                automatic renewal is not enabled.
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
