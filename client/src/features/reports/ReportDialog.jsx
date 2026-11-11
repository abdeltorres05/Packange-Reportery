import AuthImage from "../../components/AuthImage";
import StatusBadge from "../../components/StatusBadge";
import { STATUSES, STATUS_LABELS, formatDateTime } from "../../constants";
import PhotoUploadButton from "./PhotoUploadButton";

function ReportHistory({ entries }) {
  return (
    <ol className="timeline">
      {entries.map((entry) => (
        <li key={entry.id}>
          <div className="timeline-dot" />
          <div>
            <strong>{STATUS_LABELS[entry.status] || entry.status}</strong>
            <span className="muted">
              {formatDateTime(entry.changedAt)} · {entry.changedByName}
            </span>
            {entry.notes && <p>{entry.notes}</p>}
            {entry.photos?.length > 0 && (
              <div className="history-photos">
                {entry.photos.map((photo) => (
                  <AuthImage
                    key={photo.id}
                    path={`/reports/${entry.reportId}/photos/${photo.id}/file`}
                    alt={photo.originalName}
                  />
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ReportMetadata({ report, canViewAgency, title, statusLabel }) {
  return (
    <dl className="detail-list">
      <div>
        <dt>{title}</dt>
        <dd className="mono">{report.trackingNumber}</dd>
      </div>
      <div>
        <dt>{statusLabel}</dt>
        <dd>
          <StatusBadge status={report.status} />
        </dd>
      </div>
      {canViewAgency && (
        <div>
          <dt>Agencia</dt>
          <dd>{report.agencyName}</dd>
        </div>
      )}
    </dl>
  );
}

export default function ReportDialog({
  user,
  agencies,
  modal,
  detail,
  history,
  formBulto,
  formDescription,
  editTrackingNumber,
  editDescription,
  photoFile,
  responsePhotoFile,
  createAgencyId,
  note,
  statusToSet,
  canChangeStatus,
  canChooseAgency,
  saving,
  onClose,
  onCreate,
  onUpdate,
  onFormBultoChange,
  onFormDescriptionChange,
  onEditTrackingNumberChange,
  onEditDescriptionChange,
  onPhotoFileChange,
  onResponsePhotoChange,
  onCreateAgencyChange,
  onNoteChange,
  onStatusChange,
}) {
  if (!modal.open) return null;

  const canViewAgency = user.role === "super_admin" || user.role === "agency_admin";

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <header className="modal-header">
          <div>
            <h2>
              {modal.mode === "create"
                ? "Nuevo reporte"
                : modal.mode === "edit"
                  ? "Modificar reporte"
                  : "Visualizar reporte"}
            </h2>
            {detail && (
              <p className="muted">
                {detail.trackingNumber}
                {canViewAgency && detail.agencyName ? ` · ${detail.agencyName}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            className="icon-button"
            title="Cerrar"
            aria-label="Cerrar formulario"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {modal.mode === "create" && (
          <form className="form" onSubmit={onCreate}>
            <label className="field">
              <span>Número del bulto (HBL) *</span>
              <input
                value={formBulto}
                onChange={(event) => onFormBultoChange(event.target.value)}
                placeholder="Ej. HBL-123456"
                required
              />
            </label>
            <label className="field">
              <span>Descripción del reporte *</span>
              <textarea
                value={formDescription}
                onChange={(event) => onFormDescriptionChange(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Describe el problema del bulto"
                required
              />
            </label>
            {canChooseAgency && (
              <label className="field">
                <span>Agencia *</span>
                <select
                  value={createAgencyId}
                  onChange={(event) => onCreateAgencyChange(event.target.value)}
                  required
                >
                  <option value="">Seleccionar agencia</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <PhotoUploadButton file={photoFile} onChange={onPhotoFileChange} />
            <div className="form-actions">
              <button type="submit" className="btn report-modal-action" disabled={saving}>
                {saving ? "Creando…" : "Crear reporte"}
              </button>
              <button
                type="button"
                className="btn report-modal-action"
                onClick={onClose}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {modal.mode === "view" && detail && (
          <div className="modal-body">
            <ReportMetadata
              report={detail}
              canViewAgency={canViewAgency}
              title="Número de bulto"
              statusLabel="Estado"
            />
            <dl className="detail-list">
              <div>
                <dt>Creado por</dt>
                <dd>{detail.createdByName}</dd>
              </div>
              <div>
                <dt>Fecha creación</dt>
                <dd>{formatDateTime(detail.createdAt)}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{formatDateTime(detail.updatedAt)}</dd>
              </div>
            </dl>
            <div>
              <h3>Descripción</h3>
              <p className="pre-line">{detail.description || "Sin descripción"}</p>
            </div>
            <div>
              <h3>Historial</h3>
              <ReportHistory entries={history} />
            </div>
          </div>
        )}

        {modal.mode === "edit" && detail && (
          <form className="form" onSubmit={onUpdate}>
            <ReportMetadata
              report={detail}
              canViewAgency={canViewAgency}
              title="Número de bulto"
              statusLabel="Estado actual"
            />
            <label className="field">
              <span>Número del bulto (HBL) *</span>
              <input
                value={editTrackingNumber}
                onChange={(event) => onEditTrackingNumberChange(event.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label className="field">
              <span>Descripción del reporte *</span>
              <textarea
                value={editDescription}
                onChange={(event) => onEditDescriptionChange(event.target.value)}
                rows={3}
                maxLength={2000}
                required
              />
            </label>
            {canChangeStatus && (
              <label className="field">
                <span>Cambiar estado</span>
                <select
                  value={statusToSet}
                  onChange={(event) => onStatusChange(event.target.value)}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              <span>Respuesta / nota</span>
              <textarea
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                rows={3}
                placeholder="Agregar respuesta del reporte"
              />
            </label>
            <div className="field">
              <span>Foto para la respuesta (opcional)</span>
              <PhotoUploadButton file={responsePhotoFile} onChange={onResponsePhotoChange} />
              {responsePhotoFile && (
                <small className="muted">
                  Escribe una respuesta para publicar la foto en el historial.
                </small>
              )}
            </div>
            <div>
              <h3>Historial</h3>
              <ReportHistory entries={history} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
