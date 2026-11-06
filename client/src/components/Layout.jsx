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

function ModuleIcon({ module }) {
  return (
    <svg
      className="nav-icon"
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
      {module === "dashboard" && (
        <>
          <path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3h8v4h-8zM3 17h8v4H3z" />
        </>
      )}
      {module === "reports" && (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h8" />
        </>
      )}
      {module === "users" && (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      )}
      {module === "agencies" && (
        <>
          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
          <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01M16 13v.01M16 16v.01M16 19v.01" />
        </>
      )}
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
            <span>Dashboard</span>
            <ModuleIcon module="dashboard" />
          </NavLink>
          <NavLink to="/reportes" className={navClass}>
            <span>Reportes</span>
            <ModuleIcon module="reports" />
          </NavLink>
          {(user.role === "super_admin" || user.role === "agency_admin") && (
            <NavLink to="/usuarios" className={navClass}>
              <span>Usuarios</span>
              <ModuleIcon module="users" />
            </NavLink>
          )}
          {user.role === "super_admin" && (
            <NavLink to="/agencias" className={navClass}>
              <span>Agencias</span>
              <ModuleIcon module="agencies" />
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
