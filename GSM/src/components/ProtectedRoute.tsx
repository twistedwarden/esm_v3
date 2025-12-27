import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/v1authStore';
import type { AuthUser } from '../store/v1authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const currentUser = useAuthStore(s => s.currentUser);
  const isLoading = useAuthStore(s => s.isLoading);
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Show splash while checking authentication OR redirect if not authenticated
  if (isLoading || !minSplashDone || !currentUser) {
    if (isLoading || !minSplashDone) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <img src="/splash.svg" alt="Loading" className="splash-logo" />
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  // Prevent admins/staff/ssc from accessing student portal routes
  const role = (currentUser as AuthUser).role;
  if (role === 'admin' || role === 'staff' || String(role).startsWith('ssc')) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
