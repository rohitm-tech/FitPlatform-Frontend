import axios from "axios";

// The httpOnly `accessToken` cookie is the sole auth transport for the SPA.
// Always call this site's own /api path (Vite proxy in dev, nginx in prod)
// so the cookie stays first-party. A direct call to another *.run.app host
// is a different site, and phones drop that cookie.
export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// A sign-in that finishes while an older /me is still in flight used to
// treat that late 401 as a logout. Ignore 401s from before the latest
// sign-in, and never log out because sign-in itself was rejected.
let authEpoch = 0;

type EpochConfig = { authEpoch?: number };

api.interceptors.request.use((config) => {
  (config as EpochConfig).authEpoch = authEpoch;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const url = response.config.url ?? "";
    if (
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/logout")
    ) {
      authEpoch += 1;
    }
    return response;
  },
  (error) => {
    const url = String(error.config?.url ?? "");
    const signingIn =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot");
    const fromCurrentSession =
      (error.config as EpochConfig | undefined)?.authEpoch === authEpoch;
    if (
      error.response?.status === 401 &&
      !signingIn &&
      fromCurrentSession
    ) {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    return Promise.reject(error);
  },
);
