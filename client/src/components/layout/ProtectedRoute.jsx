import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, siteSettings } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-slate-300">Loading secure content...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (siteSettings?.maintenanceMode && user.role !== "admin") {
    return <Navigate to="/maintenance" replace />;
  }

  // Strict admin check: only users with role === 'admin' may access admin routes
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
