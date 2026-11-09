import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import AuthImage from "../components/AuthImage";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBadge from "../components/StatusBadge";
import { STATUS_LABELS, formatDate, formatDateTime } from "../constants";
import { notify } from "../notifications";

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInput = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canWrite = ["agency_admin", "agency_user", "super_admin"].includes(user.role);
  const canDelete = user.role === "super_admin";

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/reports/${id}`)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          notify(err.message, "error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => load(), [load]);

  const handleUpload = async (event) => {
    event.preventDefault();
    const files = fileInput.current?.files;
    if (!files || files.length === 0) {
      notify("Selecciona al menos una imagen.", "warning");
      return;
    }

    setUploading(true);
    const payload = new FormData();
    Array.from(files).forEach((file) => payload.append("photos", file));

    try {
      await api.post(`/reports/${id}/photos`, payload);
      if (fileInput.current) fileInput.current.value = "";
      notify("Fotos subidas correctamente.", "success");
      load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const requestDeletePhoto = (photoId) => {
    setPendingConfirmation({ type: "photo", photoId });
  };

  const requestDeleteReport = () => {
    setPendingConfirmation({ type: "report" });
  };

  const confirmDelete = async () => {
    if (!pendingConfirmation) return;
    setDeleting(true);
    try {
      if (pendingConfirmation.type === "photo") {
        await api.del(`/reports/${id}/photos/${pendingConfirmation.photoId}`);
        notify("Foto eliminada.", "danger");
        setPendingConfirmation(null);
        load();
      } else {
        await api.del(`/reports/${id}`);
        notify("Reporte eliminado.", "danger");
        navigate("/reportes", { replace: true });
      }
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="page-loading">Cargando reporte…</div>;

  if (error) {
    return (
      <div className="page">
        <Link to="/reportes" className="btn btn-ghost">
          Volver a reportes
        </Link>
      </div>
    );
  }

  const { report, photos, history } = data;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="title-row">
            <h1>{report.trackingNumber}</h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="muted">
            {report.agencyName} · Registrado por {report.createdByName}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/reportes" className="btn btn-ghost">
            Volver
          </Link>
          {canWrite && (
            <Link to={`/reportes/${report.id}/editar`} className="btn btn-primary">
              Editar
            </Link>
          )}
          {canDelete && (
            <button type="button" className="btn btn-danger" onClick={requestDeleteReport}>
              Eliminar
            </button>
          )}
        </div>
      </header>

      <section className="detail-grid">
        <article className="card">
          <h2>Datos del bulto</h2>
          <dl className="detail-list">
            <div>
              <dt>Remitente</dt>
              <dd>{report.senderName}</dd>
            </div>
            <div>
              <dt>Teléfono remitente</dt>
              <dd>{report.senderPhone || "—"}</dd>
            </div>
            <div>
              <dt>Destinatario</dt>
              <dd>{report.recipientName}</dd>
            </div>
            <div>
              <dt>Teléfono destinatario</dt>
              <dd>{report.recipientPhone || "—"}</dd>
            </div>
            <div>
              <dt>Fecha del reporte</dt>
              <dd>{formatDate(report.reportDate)}</dd>
            </div>
            <div>
              <dt>Estado actual</dt>
              <dd>{STATUS_LABELS[report.status]}</dd>
            </div>
            <div>
              <dt>Creado</dt>
              <dd>{formatDateTime(report.createdAt)}</dd>
            </div>
            <div>
              <dt>Última actualización</dt>
              <dd>{formatDateTime(report.updatedAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="card">
          <h2>Descripción</h2>
          <p className="pre-line">{report.description}</p>
          <h3>Observaciones</h3>
          <p className="pre-line muted">
            {report.observations || "Sin observaciones."}
          </p>
        </article>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Fotos de evidencia</h2>
          <span className="muted">{photos.length} de 5</span>
        </div>

        {photos.length === 0 ? (
          <p className="empty">Este reporte aún no tiene fotos.</p>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <figure key={photo.id} className="photo-item">
                <AuthImage
                  path={`/reports/${report.id}/photos/${photo.id}/file`}
                  alt={photo.originalName}
                />
                <figcaption>
                  <span>{photo.originalName}</span>
                  {canWrite && (
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => requestDeletePhoto(photo.id)}
                    >
                      Quitar
                    </button>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {canWrite && photos.length < 5 && (
          <form className="upload-form" onSubmit={handleUpload}>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
            />
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? "Subiendo…" : "Subir fotos"}
            </button>
          </form>
        )}
      </section>

      <section className="card">
        <h2>Historial de estados</h2>
        <ol className="timeline">
          {history.map((entry) => (
            <li key={entry.id}>
              <div className="timeline-dot" />
              <div>
                <strong>{STATUS_LABELS[entry.status] || entry.status}</strong>
                <span className="muted">
                  {formatDateTime(entry.changedAt)} · {entry.changedByName}
                </span>
                {entry.notes && <p>{entry.notes}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ConfirmDialog
        open={Boolean(pendingConfirmation)}
        title={pendingConfirmation?.type === "photo" ? "Eliminar foto" : "Eliminar reporte"}
        message={
          pendingConfirmation?.type === "photo"
            ? "¿Eliminar esta foto? Esta acción no se puede deshacer."
            : "¿Eliminar este reporte y todas sus fotos? Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingConfirmation(null)}
      />
    </div>
  );
}
