import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { STATUSES, STATUS_LABELS, todayISO } from "../constants";
import { notify } from "../notifications";

function emptyForm() {
  return {
    trackingNumber: "",
    senderName: "",
    senderPhone: "",
    recipientName: "",
    recipientPhone: "",
    reportDate: todayISO(),
    status: "pendiente",
    description: "",
    observations: "",
    statusNotes: "",
  };
}

export default function ReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const canChangeStatus =
    user.role === "agency_admin" || user.role === "super_admin";

  const [form, setForm] = useState(emptyForm);
  const [originalStatus, setOriginalStatus] = useState("pendiente");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;

    api
      .get(`/reports/${id}`)
      .then(({ report }) => {
        if (!active) return;
        setForm({
          trackingNumber: report.trackingNumber,
          senderName: report.senderName,
          senderPhone: report.senderPhone || "",
          recipientName: report.recipientName,
          recipientPhone: report.recipientPhone || "",
          reportDate: report.reportDate,
          status: report.status,
          description: report.description,
          observations: report.observations || "",
          statusNotes: "",
        });
        setOriginalStatus(report.status);
      })
      .catch((err) => {
        if (active) notify(err.message, "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      trackingNumber: form.trackingNumber,
      senderName: form.senderName,
      senderPhone: form.senderPhone.trim() || null,
      recipientName: form.recipientName,
      recipientPhone: form.recipientPhone.trim() || null,
      reportDate: form.reportDate,
      ...(canChangeStatus ? { status: form.status } : {}),
      description: form.description,
      observations: form.observations.trim() || null,
    };

    try {
      if (isEdit) {
        if (form.status !== originalStatus) {
          payload.statusNotes = form.statusNotes.trim() || null;
        }
        await api.patch(`/reports/${id}`, payload);
        notify("Reporte actualizado correctamente.", "warning");
        navigate(`/reportes/${id}`);
        return;
      }

      const created = await api.post("/reports", payload);
      const reportId = created.report.id;

      if (files.length > 0) {
        const data = new FormData();
        Array.from(files).forEach((file) => data.append("photos", file));
        try {
          await api.post(`/reports/${reportId}/photos`, data);
        } catch (photoError) {
          notify(`El reporte se creó, pero no se pudieron subir las fotos: ${photoError.message}`, "warning");
        }
      }

      notify("Reporte creado correctamente.", "success");
      navigate(`/reportes/${reportId}`);
    } catch (err) {
      const details = (err.details || [])
        .map((detail) => `${detail.path ? `${detail.path}: ` : ""}${detail.message}`)
        .join("; ");
      notify(details ? `${err.message}: ${details}` : err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Cargando reporte…</div>;

  const statusChanged = isEdit && form.status !== originalStatus;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{isEdit ? "Editar reporte" : "Nuevo reporte de bulto"}</h1>
          <p className="muted">
            {isEdit
              ? canChangeStatus
                ? "Actualiza los datos del bulto y su estado."
                : "Actualiza los datos del bulto. El estado solo puede cambiarlo un administrador."
              : "Registra la información y adjunta evidencias si lo necesitas."}
          </p>
        </div>
        <Link
          to={isEdit ? `/reportes/${id}` : "/reportes"}
          className="icon-button form-close-button"
          title="Cerrar formulario"
          aria-label="Cerrar formulario"
        >
          ×
        </Link>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Guía / rastreo *</span>
            <input
              value={form.trackingNumber}
              onChange={(event) => update("trackingNumber", event.target.value)}
              placeholder="Ej. MARY-0003"
              required
            />
          </label>

          <label className="field">
            <span>Fecha del reporte *</span>
            <input
              type="date"
              value={form.reportDate}
              onChange={(event) => update("reportDate", event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Remitente *</span>
            <input
              value={form.senderName}
              onChange={(event) => update("senderName", event.target.value)}
              placeholder="Nombre o empresa"
              required
            />
          </label>

          <label className="field">
            <span>Teléfono del remitente</span>
            <input
              value={form.senderPhone}
              onChange={(event) => update("senderPhone", event.target.value)}
              placeholder="Opcional"
            />
          </label>

          <label className="field">
            <span>Destinatario *</span>
            <input
              value={form.recipientName}
              onChange={(event) => update("recipientName", event.target.value)}
              placeholder="Nombre de quien recibe"
              required
            />
          </label>

          <label className="field">
            <span>Teléfono del destinatario</span>
            <input
              value={form.recipientPhone}
              onChange={(event) => update("recipientPhone", event.target.value)}
              placeholder="Opcional"
            />
          </label>

          {(canChangeStatus || (!isEdit && user.role !== "agency_user")) && (
            <label className="field">
              <span>Estado *</span>
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {statusChanged && (
            <label className="field">
              <span>Nota del cambio de estado</span>
              <input
                value={form.statusNotes}
                onChange={(event) => update("statusNotes", event.target.value)}
                placeholder="Opcional"
              />
            </label>
          )}
        </div>

        <label className="field">
          <span>Descripción del bulto *</span>
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={3}
            placeholder="Contenido, cantidad de bultos, dimensiones relevantes…"
            required
          />
        </label>

        <label className="field">
          <span>Observaciones</span>
          <textarea
            value={form.observations}
            onChange={(event) => update("observations", event.target.value)}
            rows={3}
            placeholder="Indicaciones de entrega, incidencias, etc."
          />
        </label>

        {!isEdit && (
          <label className="field">
            <span>Fotos de evidencia (opcional, máximo 5)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => setFiles(event.target.files)}
            />
            {files.length > 0 && (
              <small className="muted">
                {files.length} archivo(s) seleccionado(s)
              </small>
            )}
          </label>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? "Guardando…"
              : isEdit
                ? "Guardar cambios"
                : "Crear reporte"}
          </button>
          <Link
            to={isEdit ? `/reportes/${id}` : "/reportes"}
            className="btn btn-ghost"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
