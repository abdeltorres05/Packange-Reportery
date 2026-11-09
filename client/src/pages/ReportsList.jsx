import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import StatusBadge from "../components/StatusBadge";
import { STATUSES, STATUS_LABELS, formatDate } from "../constants";
import { notify } from "../notifications";

export default function ReportsList() {
  const { user } = useAuth();
  const location = useLocation();

  const initialStatus =
    new URLSearchParams(location.search).get("status") || "";

  const [filters, setFilters] = useState({
    status: initialStatus,
    q: "",
    from: "",
    to: "",
    agencyId: "",
    page: 1,
  });
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 0 });
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role !== "super_admin") return;
    api
      .get("/agencies")
      .then((result) => setAgencies(result.items))
      .catch(() => setAgencies([]));
  }, [user.role]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();

    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.agencyId) params.set("agencyId", filters.agencyId);
    params.set("page", String(filters.page));
    params.set("limit", "10");

    setLoading(true);
    api
      .get(`/reports?${params.toString()}`)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((err) => {
        if (active) notify(err.message, "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  const update = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    update("q", search.trim());
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({
      status: "",
      q: "",
      from: "",
      to: "",
      agencyId: "",
      page: 1,
    });
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Reportes de bultos</h1>
          <p className="muted">
            {user.role === "super_admin"
              ? "Consulta los reportes de todas las agencias."
              : `Reportes registrados por ${user.agencyName}.`}
          </p>
        </div>
        <Link to="/reportes/nuevo" className="btn btn-primary">
          Nuevo reporte
        </Link>
      </header>

      <section className="card filters">
        <form className="filters-row" onSubmit={handleSearch}>
          <label className="field">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Guía, remitente o destinatario"
            />
          </label>

          <label className="field">
            <span>Estado</span>
            <select
              value={filters.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="">Todos</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          {user.role === "super_admin" && (
            <label className="field">
              <span>Agencia</span>
              <select
                value={filters.agencyId}
                onChange={(event) => update("agencyId", event.target.value)}
              >
                <option value="">Todas</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Desde</span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => update("from", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Hasta</span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => update("to", event.target.value)}
            />
          </label>

          <div className="filters-actions">
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>
            {data.total} {data.total === 1 ? "reporte" : "reportes"}
          </h2>
        </div>

        {loading ? (
          <p className="empty">Cargando reportes…</p>
        ) : data.items.length === 0 ? (
          <p className="empty">No se encontraron reportes con esos filtros.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Guía</th>
                  <th>Remitente</th>
                  <th>Destinatario</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  {user.role === "super_admin" && <th>Agencia</th>}
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((report) => (
                  <tr key={report.id}>
                    <td className="mono">{report.trackingNumber}</td>
                    <td>{report.senderName}</td>
                    <td>{report.recipientName}</td>
                    <td>{formatDate(report.reportDate)}</td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    {user.role === "super_admin" && <td>{report.agencyName}</td>}
                    <td className="actions-cell">
                      <Link className="btn btn-small" to={`/reportes/${report.id}`}>
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.pages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="btn btn-small"
              disabled={data.page <= 1}
              onClick={() =>
                setFilters((current) => ({ ...current, page: current.page - 1 }))
              }
            >
              Anterior
            </button>
            <span>
              Página {data.page} de {data.pages}
            </span>
            <button
              type="button"
              className="btn btn-small"
              disabled={data.page >= data.pages}
              onClick={() =>
                setFilters((current) => ({ ...current, page: current.page + 1 }))
              }
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
