import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-slate-300">Loading...</div>;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, intent: "admin" }}
      />
    );
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
