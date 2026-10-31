import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { store } from "./store/store";
import { queryClient } from "./queries/queryClient";
import { AuthProvider } from "./components/AuthProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import App from "./App";
import "./index.css";
import "./product.css";
import "./workspace.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("PWA worker registration failed", error)),
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--fp-surface)",
                  color: "var(--fp-text)",
                  border: "1px solid var(--fp-border)",
                  borderRadius: 8,
                  boxShadow: "none",
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
