import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS } from "../constants";

const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    </svg>
  );
}

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
            <div className="user-info-meta">
              <span className="user-role">{ROLE_LABELS[user.role]}</span>
              <button
                type="button"
                className="logout-icon-button"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogoutIcon />
              </button>
            </div>
            {user.agencyName && <span className="user-agency">{user.agencyName}</span>}
          </div>
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
