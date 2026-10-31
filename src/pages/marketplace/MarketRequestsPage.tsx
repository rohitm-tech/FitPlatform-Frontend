import toast from "react-hot-toast";
import { payForPackage } from "../../services/packageCheckout";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { money } from "./marketplaceShared";
import "../../marketplace.css";
export default function MarketRequestsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const provider = params.get("view") === "provider";
  const canProvide = user?.roles.some((role) =>
    ["coach", "gym_owner", "admin"].includes(role),
  );
  const cache = useQueryClient();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const paymentConfig = useQuery({
    queryKey: ["payment-configuration", user?._id],
    queryFn: async () => (await api.get("/payments/configuration")).data.data,
  });
  const payments = useQuery({
    queryKey: ["payments", user?._id],
    queryFn: async () => (await api.get("/payments")).data.data,
    refetchInterval: 15000,
  });
  const query = useQuery({
    queryKey: ["marketplace-requests", user?._id, provider],
    queryFn: async () =>
      (
        await api.get("/marketplace/requests", {
          params: { view: provider ? "provider" : "customer" },
        })
      ).data.data,
  });
  const pay = async (id: string) => {
    setBusy(id);
    setError("");
    try {
      const result = await payForPackage(id, {
        name: user!.name,
        email: user!.email,
      });
      if (result.status === "paid")
        toast.success("Payment captured. Check fulfilment in your payment records.");
      else if (result.status === "processing")
        toast.success("Payment authorised. Waiting for capture confirmation.");
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["marketplace-requests"] }),
        cache.invalidateQueries({ queryKey: ["payments"] }),
        cache.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "Payment could not be completed. Check your records before retrying.",
      );
    } finally {
      setBusy("");
    }
  };
  const decide = async (id: string, status: string) => {
    setBusy(id);
    setError("");
    try {
      await api.patch(`/marketplace/requests/${id}`, {
        status,
        responseNote: notes[id] || "",
      });
      await cache.invalidateQueries({ queryKey: ["marketplace-requests"] });
      cache.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          "This request could not be updated. Try again.",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="product-page marketplace-page">
      <Link className="page-back" to="/marketplace">
        <ArrowLeft size={16} />
        Marketplace
      </Link>
      {canProvide && (
        <div className="page-top-actions">
          <Link className="secondary-action" to="/marketplace/manage">
            Manage listings
            <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
      {canProvide && (
        <nav className="settings-tabs" aria-label="Marketplace request views">
          <button
            aria-current={!provider ? "page" : undefined}
            onClick={() => setParams({})}
          >
            My requests
          </button>
          <button
            aria-current={provider ? "page" : undefined}
            onClick={() => setParams({ view: "provider" })}
          >
            Incoming enquiries
          </button>
        </nav>
      )}
      {error && (
        <p className="form-feedback" role="alert">
          {error}
        </p>
      )}
      {query.isLoading ? (
        <div className="page-state mt-6" role="status">
          Loading requests…
        </div>
      ) : query.isError ? (
        <div className="page-state mt-6">
          <h2>Requests couldn’t be loaded.</h2>
          <button onClick={() => query.refetch()}>Retry</button>
        </div>
      ) : !query.data?.length ? (
        <div className="page-state mt-6">
          <h2>
            {provider ? "No enquiries yet." : "Find something worth exploring."}
          </h2>
          <p>
            {provider
              ? "New enquiries for your published listings appear here."
              : "Ask a provider about a plan or package to start a request."}
          </p>
          <Link to={provider ? "/marketplace/manage" : "/marketplace"}>
            {provider ? "Manage your listings" : "Explore the marketplace"}
          </Link>
        </div>
      ) : (
        <div className="market-request-list">
          {query.data.map((request: any) => (
            <article key={request._id} className="page-section">
              <div className="section-row">
                <div>
                  <h2>{request.titleSnapshot}</h2>
                  <p className="section-note">
                    {provider
                      ? `From ${request.customerId?.name || "Former member"}`
                      : `With ${request.providerId?.name || "Former provider"}`}{" "}
                    · {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`request-status status-${request.status}`}>
                  {request.status}
                </span>
              </div>
              <div className="request-message">
                <strong>
                  {provider ? "Athlete’s message" : "Your message"}
                </strong>
                <p>{request.message}</p>
              </div>
              <div className="section-row">
                <p className="section-note">
                  Listed price: {money(request.priceMinor, request.currency)}
                  {request.isDemo ? " · Demo listing" : ""}
                </p>
                {request.listingId?.slug && (
                  <Link
                    className="page-back"
                    to={`/marketplace/${request.listingId.slug}`}
                  >
                    View listing
                    <ArrowUpRight size={14} />
                  </Link>
                )}
              </div>
              {request.responseNote && (
                <div className="request-message">
                  <strong>Response</strong>
                  <p>{request.responseNote}</p>
                </div>
              )}
              {provider && request.customerId?.email && (
                <p className="section-note">
                  Contact shared for this enquiry:{" "}
                  <a href={`mailto:${request.customerId.email}`}>
                    {request.customerId.email}
                  </a>
                </p>
              )}
              {request.status === "requested" &&
                (provider ? (
                  <div className="request-response">
                    <label
                      className="fp-label"
                      htmlFor={`response-${request._id}`}
                    >
                      Response note{" "}
                      <span className="font-normal">(optional)</span>
                    </label>
                    <textarea
                      id={`response-${request._id}`}
                      className="fp-input"
                      rows={2}
                      maxLength={1500}
                      value={notes[request._id] || ""}
                      onChange={(e) =>
                        setNotes((current) => ({
                          ...current,
                          [request._id]: e.target.value,
                        }))
                      }
                      placeholder="Availability and suggested next steps"
                    />
                    <div className="header-actions mt-4">
                      <button
                        className="secondary-action"
                        disabled={busy === request._id}
                        onClick={() => decide(request._id, "declined")}
                      >
                        Decline
                      </button>
                      <button
                        className="primary-action"
                        disabled={busy === request._id}
                        onClick={() => decide(request._id, "accepted")}
                      >
                        {busy === request._id ? "Saving…" : "Accept enquiry"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="secondary-action mt-4"
                    disabled={busy === request._id}
                    onClick={() => decide(request._id, "cancelled")}
                  >
                    {busy === request._id ? "Cancelling…" : "Cancel request"}
                  </button>
                ))}
              {request.status === "accepted" &&
                (() => {
                  const payment = payments.data?.find(
                    (item: any) => String(item.requestId) === request._id,
                  );
                  const paid =
                    request.paymentStatus === "paid" ||
                    payment?.status === "paid";
                  return (
                    <div className="accepted-package">
                      <p
                        className={paid ? "assignment-success" : "section-note"}
                      >
                        {paid
                          ? payment?.fulfillment === "needs_review"
                            ? "Payment received. Platform support is reviewing access."
                            : payment?.fulfillment === "coaching_active"
                              ? "Payment confirmed. Your coaching relationship is active."
                              : "Payment confirmed. The provider will arrange the next step."
                          : provider
                            ? "You accepted this request. The athlete can now pay the agreed package fee."
                            : "Your request is accepted. Pay the agreed package fee to confirm."}
                      </p>
                      {!paid && !provider && (
                        <>
                          <p className="section-note">
                            {money(request.priceMinor, request.currency)}
                            {request.billingSnapshot === "month"
                              ? " for the first month. No automatic renewal."
                              : " one-time package payment."}
                          </p>
                          {paymentConfig.data?.mode === "test" && (
                            <p className="demo-listing-note mt-3">
                              Razorpay test mode · no real money will be
                              charged.
                            </p>
                          )}
                          <button
                            className="primary-action mt-4"
                            disabled={
                              busy === request._id ||
                              !paymentConfig.data?.enabled
                            }
                            onClick={() => pay(request._id)}
                          >
                            {busy === request._id
                              ? "Opening secure checkout…"
                              : `Pay ${money(request.priceMinor, request.currency)} with Razorpay`}
                          </button>
                          {!paymentConfig.data?.enabled && (
                            <p className="section-note">
                              {paymentConfig.data?.reason ||
                                "Checking payment availability…"}
                            </p>
                          )}
                          <p className="section-note">
                            Secure checkout is provided by Razorpay. Your name
                            and email prefill the payment form. Coaching access
                            starts only after the server confirms capture.
                          </p>
                        </>
                      )}
                      <Link
                        className="page-back mt-4"
                        to="/marketplace/payments"
                      >
                        View payment records
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  );
                })()}
            </article>
          ))}
        </div>
      )}
      <p className="marketplace-boundary">
        The provider accepts first. Payment confirms the agreed package;
        coaching access is activated only after verified capture.
      </p>
    </div>
  );
}
