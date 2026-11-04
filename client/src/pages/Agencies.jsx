import { useCallback, useEffect, useState } from "react";

import { api } from "../api";
import { formatDateTime } from "../constants";

function emptyForm() {
  return { name: "", code: "" };
}

export default function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/agencies?all=1")
      .then((data) => {
        setAgencies(data.items);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await api.post("/agencies", form);
      setForm(emptyForm());
      setMessage("Agencia creada correctamente.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (agency) => {
    setError("");
    setMessage("");
    try {
      await api.patch(`/agencies/${agency.id}`, { active: !agency.active });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Agencias</h1>
          <p className="muted">
            Cada agencia mantiene sus reportes y usuarios completamente separados.
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="split-layout">
        <section className="card">
          <div className="card-header">
            <h2>Agencias registradas</h2>
            <span className="muted">{agencies.length}</span>
          </div>

          {loading ? (
            <p className="empty">Cargando agencias…</p>
          ) : agencies.length === 0 ? (
            <p className="empty">Aún no hay agencias registradas.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Estado</th>
                    <th>Creada</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {agencies.map((agency) => (
                    <tr key={agency.id}>
                      <td>{agency.name}</td>
                      <td className="mono">{agency.code}</td>
                      <td>
                        <span
                          className={
                            agency.active ? "pill pill-on" : "pill pill-off"
                          }
                        >
                          {agency.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>{formatDateTime(agency.createdAt)}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => toggleActive(agency)}
                        >
                          {agency.active ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2>Nueva agencia</h2>
          <form className="form compact" onSubmit={handleSubmit}>
            <label className="field">
              <span>Nombre *</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ej. Mary Autopart"
                required
              />
            </label>

            <label className="field">
              <span>Código *</span>
              <input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="Ej. MARY"
                maxLength={20}
                required
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creando…" : "Crear agencia"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
