import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService.js';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const hasToken = !!authService.getToken();

      if (!hasToken) {
        setIsAuth(false);
        setCheckingAuth(false);
        return;
      }

      if (authService.isAuthenticated()) {
        setIsAuth(true);
        setCheckingAuth(false);
      } else {
        console.log('[ProtectedRoute] Token expired. Attempting silent session refresh...');
        try {
          await authService.refreshSessionSilently();
          setIsAuth(true);
        } catch (err) {
          console.warn('[ProtectedRoute] Silent refresh failed, redirecting to login:', err);
          setIsAuth(false);
        } finally {
          setCheckingAuth(false);
        }
      }
    };

    checkSession();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600/20 border-t-[#0F52BA] rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const user = authService.getUser();
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/login" state={{ denied: true }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
