import { api } from "./api";

type GatewayResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type CheckoutOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (result: GatewayResult) => void;
  modal: { ondismiss: () => void };
};
declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => { open: () => void };
  }
}
let loading: Promise<void> | null = null;
async function loadCheckout() {
  if (window.Razorpay) return;
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve();
      else {
        loading = null;
        reject(new Error("Secure checkout could not be loaded"));
      }
    };
    script.onerror = () => {
      script.remove();
      loading = null;
      reject(
        new Error(
          "Secure checkout could not be loaded. Check your connection and try again.",
        ),
      );
    };
    document.head.appendChild(script);
  });
  return loading;
}
export async function payForPackage(
  requestId: string,
  user: { name: string; email: string },
) {
  const order = (await api.post("/payments/orders", { requestId })).data.data;
  if (order.alreadyPaid) return { status: "paid", payment: order.payment };
  await loadCheckout();
  return new Promise<{ status: string; message?: string }>(
    (resolve, reject) => {
      let finishing = false;
      const checkout = new window.Razorpay!({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Rhythm",
        description: order.title,
        prefill: user,
        theme: {
          color:
            getComputedStyle(document.documentElement)
              .getPropertyValue("--fp-accent")
              .trim() || "#d32f2f",
        },
        handler: async (result) => {
          finishing = true;
          try {
            resolve(
              (await api.post("/payments/verify", { requestId, ...result }))
                .data.data,
            );
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => {
            if (!finishing) resolve({ status: "cancelled" });
          },
        },
      });
      checkout.open();
    },
  );
}
