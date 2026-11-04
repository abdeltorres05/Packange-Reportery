export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <header className="modal-header">
          <h2 id="confirm-dialog-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            title="Cerrar"
            aria-label="Cerrar confirmación"
            onClick={onCancel}
          >
            ×
          </button>
        </header>
        <p id="confirm-dialog-message">{message}</p>
        <div className="form-actions confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${destructive ? "btn-danger confirm-destructive" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}