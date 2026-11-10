export default function AgencyFormDialog({
  open,
  agency,
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
        aria-labelledby="agency-form-title"
      >
        <header className="modal-header">
          <h2 id="agency-form-title">{agency ? "Editar agencia" : "Nueva agencia"}</h2>
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
              placeholder="Ej. Mary Autopart"
              required
            />
          </label>

          <label className="field">
            <span>Código *</span>
            <input
              value={form.code}
              onChange={(event) => onChange("code", event.target.value)}
              placeholder="Ej. MARY"
              maxLength={20}
              required
            />
          </label>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Guardando…" : agency ? "Guardar cambios" : "Crear agencia"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
