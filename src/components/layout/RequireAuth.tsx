import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

/**
 * Gates the entire existing app shell behind a real session. Runs the
 * silent-refresh attempt once on first mount (see useAppStore.initializeAuth)
 * so a page reload doesn't force a fresh login when a valid refresh-token
 * cookie still exists.
 */
export const RequireAuth: React.FC = () => {
  const { isAuthenticated, isAuthReady, initializeAuth } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthReady) void initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xs text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};
