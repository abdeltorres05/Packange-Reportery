import { ROLE_LABELS } from "../../constants";

export default function UserFormDialog({
  open,
  user,
  isSuper,
  canAssignAgency,
  agencies,
  availableRoles,
  form,
  submitting,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
      >
        <header className="modal-header">
          <h2 id="user-form-title">{user ? "Editar usuario" : "Nuevo usuario"}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </header>
        <form className="form compact" onSubmit={onSubmit}>
          <label className="field">
            <span>Nombre *</span>
            <input
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Correo *</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>{user ? "Nueva contraseña" : "Contraseña temporal *"}</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              minLength={8}
              required={!user}
              autoComplete="new-password"
            />
          </label>

          <label className="field">
            <span>Rol *</span>
            <select
              value={form.role}
              onChange={(event) => onChange("role", event.target.value)}
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          {canAssignAgency && form.role === "agency_user" && (!user || isSuper) && (
            <label className="field">
              <span>Agencia *</span>
              <select
                value={form.agencyId}
                onChange={(event) => onChange("agencyId", event.target.value)}
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Guardando…" : user ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
