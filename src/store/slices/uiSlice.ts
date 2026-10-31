import { createSlice } from '@reduxjs/toolkit';
import type { Role } from '../../types/domain';

interface UiState {
  activeRole: Role | null;
}

// Per-viewer convenience only (which role area is currently selected) — safe
// to lose on a cleared browser, never used as the source of truth for
// permissions (the backend re-checks req.user.roles on every request).
const readStoredRole = (): Role | null => {
  try {
    return (localStorage.getItem('fp-active-role') as Role | null) || null;
  } catch {
    return null;
  }
};

const initialState: UiState = {
  activeRole: readStoredRole(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveRole: (state, action: { payload: Role }) => {
      state.activeRole = action.payload;
      try {
        localStorage.setItem('fp-active-role', action.payload);
      } catch {
        // ignore storage errors (private browsing, blocked storage)
      }
    },
  },
});

export const { setActiveRole } = uiSlice.actions;
export default uiSlice.reducer;
