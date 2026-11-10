import { useCallback, useEffect, useState } from "react";

import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import DataTable from "../components/DataTable";
import { ROLE_LABELS } from "../constants";
import { notify } from "../notifications";

function emptyForm() {
  return {
    name: "",
    email: "",
    password: "",
    role: "agency_user",
    agencyId: "",
  };
}

export default function Users() {
  const { user } = useAuth();
  const isSuper = user.role === "super_admin";

  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const requests = [api.get("/users")];
    if (isSuper) requests.push(api.get("/agencies"));

    Promise.all(requests)
      .then(([usersData, agenciesData]) => {
        setUsers(usersData.items);
        if (agenciesData) setAgencies(agenciesData.items);
      })
      .catch((err) => notify(err.message, "error"))
      .finally(() => setLoading(false));
  }, [isSuper]);

  useEffect(load, [load]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    if (isSuper && form.role !== "super_admin") {
      payload.agencyId = Number(form.agencyId);
      if (!payload.agencyId) {
        notify("Selecciona la agencia del usuario.", "warning");
        setSubmitting(false);
        return;
      }
    }

    try {
      if (editingUser) {
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${editingUser.id}`, payload);
        notify("Usuario actualizado correctamente.", "success");
      } else {
        await api.post("/users", payload);
        notify("Usuario creado correctamente.", "success");
      }
      setForm(emptyForm());
      setEditingUser(null);
      setFormOpen(false);
      load();
    } catch (err) {
      const details = (err.details || [])
        .map((detail) => `${detail.path ? `${detail.path}: ` : ""}${detail.message}`)
        .join("; ");
      notify(details ? `${err.message}: ${details}` : err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm());
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (target) => {
    setForm({
      name: target.name,
      email: target.email,
      password: "",
      role: target.role,
      agencyId: target.agencyId ? String(target.agencyId) : "",
    });
    setEditingUser(target);
    setFormOpen(true);
  };

  const closeForm = () => {
    setForm(emptyForm());
    setEditingUser(null);
    setFormOpen(false);
  };

  const toggleActive = async (target) => {
    try {
      await api.patch(`/users/${target.id}`, { active: !target.active });
      notify(target.active ? "Usuario desactivado." : "Usuario activado.", "warning");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const availableRoles = isSuper
    ? ["super_admin", "agency_admin", "agency_user"]
    : ["agency_admin", "agency_user"];
  const columns = [
    {
      key: "name",
      label: "Nombre",
      render: (item) => (
        <>
          {item.name}
          {item.id === user.id && <span className="tag">Tú</span>}
        </>
      ),
    },
    { key: "email", label: "Correo" },
    { key: "role", label: "Rol", render: (item) => ROLE_LABELS[item.role] || item.role },
    { key: "agencyName", label: "Agencia", render: (item) => item.agencyName || "—" },
    {
      key: "active",
      label: "Estado",
      render: (item) => (
        <span className={item.active ? "pill pill-on" : "pill pill-off"}>
          {item.active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      headerClassName: "actions-head",
      cellClassName: "actions-cell",
      render: (item) => (
        <div className="action-group">
          <button
            type="button"
            className="btn btn-small"
            onClick={() => openEdit(item)}
          >
            Editar
          </button>
          <button
            type="button"
            className="btn btn-small"
            disabled={item.id === user.id}
            onClick={() => toggleActive(item)}
          >
            {item.active ? "Desactivar" : "Activar"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">
            {isSuper
              ? "Administra los responsables de todas las agencias."
              : `Administra los usuarios de ${user.agencyName}.`}
          </p>
        </div>
      </header>

      <section className="card">
        <div className="card-header">
          <div className="table-title">
            <h2>Usuarios registrados</h2>
            <span className="list-count" aria-label={`${users.length} usuarios`}>
              {users.length}
            </span>
          </div>
          <button
            type="button"
            className="icon-button report-create-button"
            onClick={openCreate}
            title="Crear usuario"
            aria-label="Crear usuario"
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
          rows={users}
          loading={loading}
          loadingMessage="Cargando usuarios..."
          emptyMessage="No hay usuarios registrados."
        />
      </section>

      {formOpen && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-title"
          >
            <header className="modal-header">
              <h2 id="user-form-title">
                {editingUser ? "Editar usuario" : "Nuevo usuario"}
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
                  onChange={(event) => update("name", event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Correo *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{editingUser ? "Nueva contraseña" : "Contraseña temporal *"}</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  minLength={8}
                  required={!editingUser}
                  autoComplete="new-password"
                />
              </label>

              <label className="field">
                <span>Rol *</span>
                <select
                  value={form.role}
                  onChange={(event) => update("role", event.target.value)}
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>

              {isSuper && form.role !== "super_admin" && (
                <label className="field">
                  <span>Agencia *</span>
                  <select
                    value={form.agencyId}
                    onChange={(event) => update("agencyId", event.target.value)}
                    required
                  >
                    <option value="">Selecciona una agencia</option>
                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting
                    ? "Guardando…"
                    : editingUser
                      ? "Guardar cambios"
                      : "Crear usuario"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
