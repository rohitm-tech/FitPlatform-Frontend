import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import uiReducer from '../../store/slices/uiSlice';
import { RoleRoute } from '../../components/common/RoleRoute';

const renderWithRole = (roles: string[]) => {
  const store = configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState: {
      auth: {
        user: { _id: '1', name: 'Test', email: 't@t.com', roles, profile: {}, onboardingCompleted: true, createdAt: '' } as any,
        isAuthenticated: true,
        status: 'ready' as const,
      },
      ui: { activeRole: null },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/coach']}>
        <Routes>
          <Route element={<RoleRoute roles={['coach']} />}>
            <Route path="/coach" element={<p>Coach area</p>} />
          </Route>
          <Route path="/" element={<p>Home</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('RoleRoute', () => {
  it('renders the protected content when the user holds the required role', () => {
    renderWithRole(['coach']);
    expect(screen.getByText('Coach area')).toBeInTheDocument();
  });

  it('redirects away when the user lacks the required role', () => {
    renderWithRole(['athlete']);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
