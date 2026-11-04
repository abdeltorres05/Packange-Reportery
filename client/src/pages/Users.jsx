import { useCallback, useEffect, useState } from "react";

import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
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
      await api.post("/users", payload);
      setForm(emptyForm());
      notify("Usuario creado correctamente.", "success");
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

      <div className="split-layout">
        <section className="card">
          <div className="card-header">
            <h2>Usuarios registrados</h2>
            <span className="muted">{users.length}</span>
          </div>

          {loading ? (
            <p className="empty">Cargando usuarios…</p>
          ) : users.length === 0 ? (
            <p className="empty">No hay usuarios registrados.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Agencia</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.name}
                        {item.id === user.id && (
                          <span className="tag">Tú</span>
                        )}
                      </td>
                      <td>{item.email}</td>
                      <td>{ROLE_LABELS[item.role] || item.role}</td>
                      <td>{item.agencyName || "—"}</td>
                      <td>
                        <span
                          className={
                            item.active ? "pill pill-on" : "pill pill-off"
                          }
                        >
                          {item.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="btn btn-small"
                          disabled={item.id === user.id}
                          onClick={() => toggleActive(item)}
                        >
                          {item.active ? "Desactivar" : "Activar"}
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
          <h2>Nuevo usuario</h2>
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
              <span>Contraseña temporal *</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                minLength={8}
                required
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

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creando…" : "Crear usuario"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
