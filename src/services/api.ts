import axios from 'axios';

// The httpOnly `accessToken` cookie is the sole auth transport for the SPA
// (sent automatically via withCredentials) — there is no raw token held in
// JS/Redux/localStorage to inject via an Authorization header.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);
