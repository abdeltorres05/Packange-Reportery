import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS } from "../constants";

const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell app-shell-sidenav">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">R</span>
          <div>
            <strong>Reportería</strong>
            <span>Paquetería</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/reportes" className={navClass}>
            Reportes
          </NavLink>
          {(user.role === "super_admin" || user.role === "agency_admin") && (
            <NavLink to="/usuarios" className={navClass}>
              Usuarios
            </NavLink>
          )}
          {user.role === "super_admin" && (
            <NavLink to="/agencias" className={navClass}>
              Agencias
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <strong>{user.name}</strong>
            <span>
              {user.role === "super_admin"
                ? ROLE_LABELS[user.role]
                : user.agencyName}
            </span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </aside>

      <div className="main-area">
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
