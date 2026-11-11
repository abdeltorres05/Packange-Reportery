import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { STATUSES, STATUS_LABELS } from "../constants";
import { notify } from "../notifications";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;

    api
      .get("/reports/stats")
      .then((statsData) => {
        if (!active) return;
        setStats(statsData);
      })
      .catch((err) => {
        if (active) notify(err.message, "error");
      });

    return () => {
      active = false;
    };
  }, []);

  const scopeLabel =
    ["super_admin", "agency_admin"].includes(user.role)
      ? "Todas las agencias"
      : user.agencyName;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Resumen de reportes por estado · {scopeLabel}</p>
        </div>
        <Link to="/reportes" className="btn btn-primary">
          Ir a reportes
        </Link>
      </header>

      <section className="stats-grid">
        <article className="stat-card stat-total">
          <span>Total de reportes</span>
          <strong>{stats ? stats.total : "—"}</strong>
        </article>
        {STATUSES.map((status) => (
          <Link
            key={status}
            to={`/reportes?status=${status}`}
            className={`stat-card stat-${status}`}
          >
            <span>{STATUS_LABELS[status]}</span>
            <strong>{stats ? stats.byStatus[status] ?? 0 : "—"}</strong>
          </Link>
        ))}
      </section>
    </div>
  );
}
