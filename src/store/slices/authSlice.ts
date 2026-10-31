import { queryClient } from '../../queries/queryClient';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../services/endpoints/authApi';
import type { User } from '../../types/domain';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'ready';
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
};

// No token or user object is ever persisted client-side — the httpOnly
// cookie is the only durable auth state. On every app load we re-verify
// against the server instead.
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const res = await authApi.me();
  return res.data.data;
});

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string },{rejectWithValue}) => {
    try{const res = await authApi.login(payload);await queryClient.cancelQueries();queryClient.clear();return res.data.data.user;}catch(error:any){return rejectWithValue({status:error.response?.status,code:error.code,message:error.response?.data?.message||error.message});}
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: { name: string; email: string; password: string; roles?: User['roles']; gymName?: string },{rejectWithValue}) => {
    try{const res = await authApi.register(payload);await queryClient.cancelQueries();queryClient.clear();return res.data.data.user;}catch(error:any){return rejectWithValue({status:error.response?.status,code:error.code,message:error.response?.data?.message||error.message});}
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
  await queryClient.cancelQueries();
  queryClient.clear();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: { payload: User }) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = 'ready';
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'ready';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
