import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService.js';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuth = authService.isAuthenticated();

  if (!isAuth) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const user = authService.getUser();
    if (!user || !allowedRoles.includes(user.role)) {
      // Redirect to login or access-denied if user doesn't have required role
      return <Navigate to="/login" state={{ denied: true }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
