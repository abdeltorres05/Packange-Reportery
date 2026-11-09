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
  const [editingAgency, setEditingAgency] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
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
      if (editingAgency) {
        await api.patch(`/agencies/${editingAgency.id}`, form);
        notify("Agencia actualizada correctamente.", "success");
      } else {
        await api.post("/agencies", form);
        notify("Agencia creada correctamente.", "success");
      }
      setForm(emptyForm());
      setEditingAgency(null);
      setFormOpen(false);
      load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm());
    setEditingAgency(null);
    setFormOpen(true);
  };

  const openEdit = (agency) => {
    setForm({ name: agency.name, code: agency.code });
    setEditingAgency(agency);
    setFormOpen(true);
  };

  const closeForm = () => {
    setForm(emptyForm());
    setEditingAgency(null);
    setFormOpen(false);
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
        <div className="action-group">
          <button
            type="button"
            className="btn btn-small"
            onClick={() => openEdit(agency)}
          >
            Editar
          </button>
          <button
            type="button"
            className="btn btn-small"
            onClick={() => toggleActive(agency)}
          >
            {agency.active ? "Desactivar" : "Activar"}
          </button>
        </div>
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

      <section className="card">
        <div className="card-header">
          <div className="table-title">
            <h2>Agencias registradas</h2>
            <span className="list-count" aria-label={`${agencies.length} agencias`}>
              {agencies.length}
            </span>
          </div>
          <button
            type="button"
            className="icon-button icon-button-create"
            onClick={openCreate}
            title="Crear agencia"
            aria-label="Crear agencia"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <DataTable
          columns={columns}
          rows={agencies}
          loading={loading}
          loadingMessage="Cargando agencias..."
          emptyMessage="Aún no hay agencias registradas."
        />
      </section>

      {formOpen && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agency-form-title"
          >
            <header className="modal-header">
              <h2 id="agency-form-title">
                {editingAgency ? "Editar agencia" : "Nueva agencia"}
              </h2>
              <button
                type="button"
                className="icon-button"
                onClick={closeForm}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </header>
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

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting
                    ? "Guardando…"
                    : editingAgency
                      ? "Guardar cambios"
                      : "Crear agencia"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
