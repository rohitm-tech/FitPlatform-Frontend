import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { payForPackage } from "../services/packageCheckout";
import { api } from "../services/api";
vi.mock("../services/api", () => ({ api: { post: vi.fn() } }));
let options: any;
beforeEach(() => {
  vi.clearAllMocks();
  (window as any).Razorpay = function (data: any) {
    options = data;
    return { open: vi.fn() };
  };
  vi.mocked(api.post).mockImplementation(async (path: any) => ({
    data: {
      data:
        path === "/payments/orders"
          ? {
              keyId: "rzp_test_example",
              orderId: "order_test",
              amount: 299900,
              currency: "INR",
              title: "Coaching",
              mode: "test",
            }
          : { status: "processing", message: "Awaiting capture" },
    },
  }));
});
afterEach(() => {
  delete window.Razorpay;
});
it("uses the server order and preserves an authorised payment as processing", async () => {
  const result = payForPackage("request", {
    name: "Athlete",
    email: "test@example.com",
  });
  await waitFor(() => expect(options.order_id).toBe("order_test"));
  expect(options.amount).toBe(299900);
  await options.handler({
    razorpay_order_id: "order_test",
    razorpay_payment_id: "pay_test",
    razorpay_signature: "signature",
  });
  expect((await result).status).toBe("processing");
  expect(api.post).toHaveBeenLastCalledWith("/payments/verify", {
    requestId: "request",
    razorpay_order_id: "order_test",
    razorpay_payment_id: "pay_test",
    razorpay_signature: "signature",
  });
});
it("keeps closing checkout separate from payment success", async () => {
  options = null;
  const result = payForPackage("request", {
    name: "Athlete",
    email: "test@example.com",
  });
  await waitFor(() => expect(options).not.toBeNull());
  options.modal.ondismiss();
  expect((await result).status).toBe("cancelled");
  expect(api.post).toHaveBeenCalledTimes(1);
});
