import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import { money } from "./marketplaceShared";
import "../../marketplace.css";

export default function PaymentsPage() {
  const { user } = useAuth();
  const admin = !!user?.roles.includes("admin");
  const [orders, setOrders] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [support, setSupport] = useState<Record<string, string>>({});
  const [supportSent, setSupportSent] = useState("");
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["payments", user?._id, admin],
    queryFn: async () =>
      (await api.get("/payments", { params: { all: admin } })).data.data,
    refetchInterval: 30000,
  });
  return (
    <div className="product-page marketplace-page">
      <Link className="page-back" to="/marketplace/requests">
        <ArrowLeft size={16} />
        Marketplace requests
      </Link>
      <div className="page-greeting">
        <div>
          <h1>{admin ? "Payment records" : "Your payments"}</h1>
          <p>Gateway-confirmed transactions and their fulfilment status.</p>
        </div>
        <Link className="secondary-action" to="/settings?section=data">
          Export account records
        </Link>
      </div>
      {error && (
        <p className="form-feedback" role="alert">
          {error}
        </p>
      )}
      {query.isLoading ? (
        <div className="page-state" role="status">
          Loading payment records…
        </div>
      ) : query.isError ? (
        <div className="page-state">
          <h2>Payments couldn’t be loaded.</h2>
          <button onClick={() => query.refetch()}>Retry</button>
        </div>
      ) : query.data?.length ? (
        <div className="market-request-list">
          {query.data.map((payment: any) => (
            <article className="page-section" key={payment._id}>
              <div className="section-row">
                <div>
                  <h2>{payment.title}</h2>
                  <p className="section-note">
                    {new Date(payment.createdAt).toLocaleString()} ·{" "}
                    {payment.mode === "test" ? "Test payment" : "Live payment"}
                  </p>
                </div>
                <strong className="payment-amount">
                  {money(payment.amount, payment.currency)}
                </strong>
              </div>
              <dl className="payment-details">
                <div>
                  <dt>Payment status</dt>
                  <dd>
                    {payment.status === "paid"
                      ? "Captured"
                      : payment.status === "reconcile_required"
                        ? "Merchant reconciliation needed"
                        : "Awaiting payment"}
                  </dd>
                </div>
                <div>
                  <dt>Fulfilment</dt>
                  <dd>{payment.fulfillment.replace(/_/g, " ")}</dd>
                </div>
                <div>
                  <dt>Gateway order</dt>
                  <dd>{payment.orderId || "Awaiting confirmation"}</dd>
                </div>
                {payment.paymentId && (
                  <div>
                    <dt>Payment reference</dt>
                    <dd>{payment.paymentId}</dd>
                  </div>
                )}
                <div>
                  <dt>
                    {String(payment.customerId?._id) === String(user?._id)
                      ? "Provider"
                      : "Customer"}
                  </dt>
                  <dd>
                    {String(payment.customerId?._id) === String(user?._id)
                      ? payment.providerId?.name
                      : payment.customerId?.name}
                  </dd>
                </div>
              </dl>
              {payment.mode === "test" && (
                <p className="demo-listing-note mt-4">
                  Test mode · no real money was collected.
                </p>
              )}
              {payment.status === "paid" && (
                <p className="assignment-success">
                  <ShieldCheck size={17} />
                  Payment capture was confirmed by the server. Settlements and
                  refunds are managed through the merchant account.
                </p>
              )}
              {payment.orderId && (
                <button
                  className="secondary-action mt-5"
                  disabled={busy === payment._id}
                  onClick={async () => {
                    setBusy(payment._id);
                    setError("");
                    try {
                      await api.post(`/payments/${payment._id}/refresh`);
                      await cache.invalidateQueries({ queryKey: ["payments"] });
                      cache.invalidateQueries({
                        queryKey: ["marketplace-requests"],
                      });
                    } catch (e: any) {
                      setError(
                        e.response?.data?.message ||
                          "Payment status could not be refreshed",
                      );
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  Refresh gateway status
                </button>
              )}
              {payment.supportMessage && admin && (
                <div className="form-feedback">
                  <strong>Support request</strong>
                  <p>{payment.supportMessage}</p>
                </div>
              )}
              {!admin && (
                <details className="coach-notes">
                  <summary>Need help with this payment?</summary>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(payment._id);
                      setError("");
                      try {
                        await api.post(`/payments/${payment._id}/support`, {
                          message: support[payment._id],
                        });
                        setSupportSent(payment._id);
                      } catch (e: any) {
                        setError(
                          e.response?.data?.message ||
                            "Help request could not be saved",
                        );
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    <label
                      className="sr-only"
                      htmlFor={`payment-help-${payment._id}`}
                    >
                      Payment help request
                    </label>
                    <input
                      id={`payment-help-${payment._id}`}
                      className="fp-input"
                      required
                      minLength={5}
                      maxLength={2000}
                      value={support[payment._id] || ""}
                      onChange={(e) =>
                        setSupport((current) => ({
                          ...current,
                          [payment._id]: e.target.value,
                        }))
                      }
                      placeholder="Describe the issue"
                    />
                    <button
                      className="secondary-action"
                      type="submit"
                      disabled={busy === payment._id}
                    >
                      Request help
                    </button>
                  </form>
                  {supportSent === payment._id && (
                    <p className="assignment-success" role="status">
                      Your request is saved and the platform admin has been
                      notified.
                    </p>
                  )}
                </details>
              )}
              {admin && payment.status === "reconcile_required" && (
                <form
                  className="mt-5"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setBusy(payment._id);
                    setError("");
                    try {
                      await api.post(`/payments/${payment._id}/reconcile`, {
                        orderId: orders[payment._id],
                      });
                      await cache.invalidateQueries({ queryKey: ["payments"] });
                    } catch (e: any) {
                      setError(
                        e.response?.data?.message ||
                          "The gateway order could not be reconciled",
                      );
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  <label
                    className="fp-label"
                    htmlFor={`gateway-order-${payment._id}`}
                  >
                    Gateway order from merchant dashboard
                  </label>
                  <input
                    id={`gateway-order-${payment._id}`}
                    className="fp-input"
                    required
                    pattern="order_[A-Za-z0-9]+"
                    value={orders[payment._id] || ""}
                    onChange={(event) =>
                      setOrders((current) => ({
                        ...current,
                        [payment._id]: event.target.value,
                      }))
                    }
                  />
                  <p className="section-note">
                    Match the merchant receipt to payment record {payment._id}.
                    The server checks amount, currency and receipt before
                    binding it.
                  </p>
                  <button
                    className="secondary-action mt-4"
                    type="submit"
                    disabled={busy === payment._id}
                  >
                    {busy === payment._id ? "Checking…" : "Reconcile order"}
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="page-state">
          <h2>No payment records yet.</h2>
          <p>
            Accepted package requests can be paid securely when online payments
            are enabled.
          </p>
          <Link to="/marketplace/requests">View your requests</Link>
        </div>
      )}
    </div>
  );
}
