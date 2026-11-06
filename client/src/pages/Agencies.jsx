import { useCallback, useEffect, useState } from "react";

import { api } from "../api";
import DataTable from "../components/DataTable";
import { formatDateTime } from "../constants";
import { notify } from "../notifications";

function emptyForm() {
  return { name: "", code: "" };
}

export default function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/agencies?all=1")
      .then((data) => {
        setAgencies(data.items);
      })
      .catch((err) => notify(err.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/agencies", form);
      setForm(emptyForm());
      notify("Agencia creada correctamente.", "success");
      load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (agency) => {
    try {
      await api.patch(`/agencies/${agency.id}`, { active: !agency.active });
      notify(agency.active ? "Agencia desactivada." : "Agencia activada.", "warning");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "code", label: "Código", className: "mono" },
    {
      key: "active",
      label: "Estado",
      render: (agency) => (
        <span className={agency.active ? "pill pill-on" : "pill pill-off"}>
          {agency.active ? "Activa" : "Inactiva"}
        </span>
      ),
    },
    { key: "createdAt", label: "Creada", render: (agency) => formatDateTime(agency.createdAt) },
    {
      key: "actions",
      label: "Acciones",
      headerClassName: "actions-head",
      cellClassName: "actions-cell",
      render: (agency) => (
        <button
          type="button"
          className="btn btn-small"
          onClick={() => toggleActive(agency)}
        >
          {agency.active ? "Desactivar" : "Activar"}
        </button>
      ),
    },
  ];

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

      <div className="split-layout">
        <section className="card">
          <div className="card-header">
            <h2>Agencias registradas</h2>
            <span className="list-count" aria-label={`${agencies.length} agencias`}>
              {agencies.length}
            </span>
          </div>

          <DataTable
            columns={columns}
            rows={agencies}
            loading={loading}
            loadingMessage="Cargando agencias..."
            emptyMessage="Aún no hay agencias registradas."
          />
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
