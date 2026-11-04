import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export function RequireRole({ roles, children }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
