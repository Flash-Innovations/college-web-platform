import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to the user's primary dashboard if attempting to access another role's routes
    if (role === "super_admin" || role === "university_admin") {
      return <Navigate to="/college/dashboard" replace />;
    }
    if (role === "tpo" || role === "placement") {
      return <Navigate to="/tpo/dashboard" replace />;
    }
    if (role === "branch_admin") {
      return <Navigate to="/branch/dashboard" replace />;
    }
    if (role === "department_admin" || role === "admin") {
      return <Navigate to="/dept/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
