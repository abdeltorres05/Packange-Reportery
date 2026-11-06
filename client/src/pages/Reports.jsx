import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import CrudTabs from "../components/CrudTabs";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { STATUSES, STATUS_LABELS, formatDateTime, todayISO } from "../constants";
import { notify } from "../notifications";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function Reports() {
  const { user } = useAuth();
  const [activeOperation, setActiveOperation] = useState("read");
  const navigate = useNavigate();
  const location = useLocation();
  const initialStatus =
    new URLSearchParams(location.search).get("status") || "";

  const [filters, setFilters] = useState({
    status: initialStatus,
    q: "",
    agencyId: "",
    page: 1,
  });
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 0 });
  const [agencies, setAgencies] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "view", report: null });
  const [formBulto, setFormBulto] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [attachPhoto, setAttachPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [createAgencyId, setCreateAgencyId] = useState("");
  const [note, setNote] = useState("");
  const [statusToSet, setStatusToSet] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canView = Boolean(user);
  const canModify = user.role === "agency_admin" || user.role === "super_admin";
  const canChangeStatus = user.role === "super_admin";
  const canDelete = user.role === "super_admin";
  const canCreate = user.role === "agency_admin" || user.role === "agency_user" || user.role === "super_admin";

  useEffect(() => {
    if (user.role !== "super_admin") return;
    api
      .get("/agencies")
      .then((result) => setAgencies(result.items))
      .catch(() => setAgencies([]));
  }, [user.role]);

  const fetchList = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    if (filters.agencyId) params.set("agencyId", filters.agencyId);
    params.set("page", String(filters.page));
    params.set("limit", "20");

    setLoading(true);
    api
      .get(`/reports?${params.toString()}`)
      .then((result) => {
        setData(result);
      })
      .catch((err) => notify(err.message, "error"))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(fetchList, [fetchList]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateFilter("q", search.trim());
  };

  const openView = async (report) => {
    try {
      const detail = await api.get(`/reports/${report.id}`);
      setModal({ open: true, mode: "view", report: { ...report, ...detail } });
    } catch (err) {
      notify(err.message, "error");
      setModal({ open: true, mode: "view", report: { ...report, history: [], photos: [] } });
    }
    setNote("");
  };

  const openEdit = async (report) => {
    try {
      const detail = await api.get(`/reports/${report.id}`);
      setModal({ open: true, mode: "edit", report: { ...report, ...detail } });
      const currentReport = detail.report || report;
      setEditTrackingNumber(currentReport.trackingNumber || "");
      setEditDescription(currentReport.description || "");
      setStatusToSet(currentReport.status);
    } catch (err) {
      notify(err.message, "error");
      setModal({ open: true, mode: "edit", report: { ...report, history: [] } });
      setEditTrackingNumber(report.trackingNumber || "");
      setEditDescription(report.description || "");
      setStatusToSet(report.status);
    }
    setNote("");
  };

  const closeModal = () => {
    setModal({ open: false, mode: "view", report: null });
    setFormBulto("");
    setFormDescription("");
    setEditTrackingNumber("");
    setEditDescription("");
    setAttachPhoto(false);
    setPhotoFile(null);
    setCreateAgencyId("");
    setNote("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        trackingNumber: formBulto.trim(),
        description: formDescription.trim(),
        reportDate: todayISO(),
        ...(user.role === "super_admin" ? { agencyId: Number(createAgencyId) } : {}),
      };
      const created = await api.post("/reports", payload);

      if (photoFile) {
        const formData = new FormData();
        formData.append("photos", photoFile);
        try {
          await api.post(`/reports/${created.report.id}/photos`, formData);
        } catch (photoError) {
          notify(`El reporte se creó, pero no se pudo subir la foto: ${photoError.message}`, "warning");
        }
      }

      notify("Reporte creado correctamente.", "success");
      closeModal();
      setActiveOperation("read");
      fetchList();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!modal.report) return;

    const trackingNumber = editTrackingNumber.trim();
    const description = editDescription.trim();
    if (!trackingNumber || !description) {
      notify("El HBL y la descripción son obligatorios.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (trackingNumber !== modal.report.trackingNumber) {
        payload.trackingNumber = trackingNumber;
      }
      if (description !== modal.report.description) {
        payload.description = description;
      }
      if (canChangeStatus && statusToSet && statusToSet !== modal.report.status) {
        payload.status = statusToSet;
      }
      if (note.trim()) payload.notes = note.trim();
      if (Object.keys(payload).length === 0) {
        notify("Modifica un dato, cambia el estado o agrega una respuesta.", "warning");
        return;
      }
      await api.patch(`/reports/${modal.report.id}`, payload);
      notify("Reporte actualizado correctamente.", "warning");
      closeModal();
      fetchList();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.del(`/reports/${pendingDelete.id}`);
      if (modal.report?.id === pendingDelete.id) closeModal();
      notify("Reporte eliminado.", "danger");
      setPendingDelete(null);
      fetchList();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const items = useMemo(() => data.items, [data.items]);
  const detail = modal.report?.report || modal.report;
  const history = modal.report?.history || [];
  const operations = [
    { value: "read", label: "Consultar" },
    ...(canCreate ? [{ value: "create", label: "Crear" }] : []),
    ...(canModify ? [{ value: "update", label: "Actualizar" }] : []),
    ...(canDelete ? [{ value: "delete", label: "Eliminar" }] : []),
  ];
  const columns = [
    { key: "trackingNumber", label: "Número de bulto", className: "mono" },
    {
      key: "status",
      label: "Estado",
      render: (item) => <StatusBadge status={item.status} />,
    },
    ...(user.role === "super_admin"
      ? [{ key: "agencyName", label: "Agencia" }]
      : []),
    { key: "createdByName", label: "Creado por" },
    { key: "createdAt", label: "Fecha creación", render: (item) => formatDateTime(item.createdAt) },
    { key: "lastNote", label: "Última respuesta", render: (item) => item.lastNote || "—" },
    ...(activeOperation === "read"
      ? [{
        key: "actions",
        label: "Acciones",
        headerClassName: "actions-head",
        cellClassName: "actions-cell",
        render: (item) => (
          <button
            type="button"
            className="icon-button"
            title="Visualizar"
            aria-label={`Visualizar reporte ${item.trackingNumber}`}
            onClick={() => openView(item)}
          >
            <EyeIcon />
          </button>
        ),
      }]
      : []),
    ...(activeOperation === "update"
      ? [{
        key: "actions",
        label: "Acciones",
        headerClassName: "actions-head",
        cellClassName: "actions-cell",
        render: (item) => (
          <button
            type="button"
            className="icon-button"
            title="Modificar"
            aria-label={`Modificar reporte ${item.trackingNumber}`}
            onClick={() => openEdit(item)}
          >
            <EditIcon />
          </button>
        ),
      }]
      : []),
    ...(activeOperation === "delete"
      ? [{
        key: "actions",
        label: "Acciones",
        headerClassName: "actions-head",
        cellClassName: "actions-cell",
        render: (item) => (
          <button
            type="button"
            className="icon-button icon-button-danger"
            title="Eliminar"
            aria-label={`Eliminar reporte ${item.trackingNumber}`}
            onClick={() => setPendingDelete(item)}
          >
            <TrashIcon />
          </button>
        ),
      }]
      : []),
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Reportes</h1>
          <p className="muted">
            {user.role === "super_admin"
              ? "Listado de reportes de todas las agencias"
              : "Listado de reportes de tu agencia"}
          </p>
        </div>
      </header>

      <CrudTabs
        moduleId="reports"
        moduleName="reportes"
        operations={operations}
        value={activeOperation}
        onChange={setActiveOperation}
      />

      <section
        className="card crud-panel"
        role="tabpanel"
        id="reports-panel"
        aria-labelledby={`reports-tab-${activeOperation}`}
      >
        {activeOperation === "create" ? (
          <div className="operation-view">
            <div className="card-header">
              <h2>Crear reporte</h2>
            </div>
            <form className="form" onSubmit={handleCreate}>
              <label className="field">
                <span>Número del bulto (HBL) *</span>
                <input
                  value={formBulto}
                  onChange={(event) => setFormBulto(event.target.value)}
                  placeholder="Ej. HBL-123456"
                  required
                />
              </label>
              <label className="field">
                <span>Descripción del reporte *</span>
                <textarea
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Describe el problema del bulto"
                  required
                />
              </label>
              {user.role === "super_admin" && (
                <label className="field">
                  <span>Agencia *</span>
                  <select
                    value={createAgencyId}
                    onChange={(event) => setCreateAgencyId(event.target.value)}
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
              <label className="photo-option">
                <input
                  type="checkbox"
                  checked={attachPhoto}
                  onChange={(event) => {
                    setAttachPhoto(event.target.checked);
                    setPhotoFile(null);
                  }}
                />
                <span>Adjuntar una foto</span>
              </label>
              {attachPhoto && (
                <label className="field">
                  <span>Foto (JPEG, PNG o WebP) *</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                  />
                  {photoFile && <small className="muted">{photoFile.name}</small>}
                </label>
              )}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Creando…" : "Crear reporte"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Limpiar formulario
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="card-header">
              <div className="table-title">
                <h2>
                  {activeOperation === "read"
                    ? "Consultar reportes"
                    : activeOperation === "update"
                      ? "Actualizar reportes"
                      : "Eliminar reportes"}
                </h2>
                <span className="list-count" aria-label={`${data.total} reportes`}>
                  {data.total}
                </span>
              </div>
            </div>

            <div className="filters-inline">
              <form onSubmit={handleSearch}>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por número de bulto"
                />
              </form>
              <select
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                <option value="">Todos los estados</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              {user.role === "super_admin" && (
                <select
                  value={filters.agencyId}
                  onChange={(event) => updateFilter("agencyId", event.target.value)}
                >
                  <option value="">Todas las agencias</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <DataTable
              columns={columns}
              rows={items}
              loading={loading}
              loadingMessage="Cargando reportes..."
              emptyMessage="No hay reportes registrados."
            />

            {data.pages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-small"
                  disabled={data.page <= 1}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: current.page - 1 }))
                  }
                >
                  Anterior
                </button>
                <span>
                  Página {data.page} de {data.pages}
                </span>
                <button
                  type="button"
                  className="btn btn-small"
                  disabled={data.page >= data.pages}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: current.page + 1 }))
                  }
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {modal.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <header className="modal-header">
              <div>
                <h2>{modal.mode === "edit" ? "Modificar reporte" : "Visualizar reporte"}</h2>
                {detail && (
                  <p className="muted">
                    {detail.trackingNumber}
                    {user.role === "super_admin" && detail.agencyName
                      ? ` · ${detail.agencyName}`
                      : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="icon-button"
                title="Cerrar"
                aria-label="Cerrar formulario"
                onClick={closeModal}
              >
                ×
              </button>
            </header>

            {modal.mode === "view" && detail && (
              <div className="modal-body">
                <dl className="detail-list">
                  <div>
                    <dt>Número de bulto</dt>
                    <dd className="mono">{detail.trackingNumber}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>
                      <StatusBadge status={detail.status} />
                    </dd>
                  </div>
                  {user.role === "super_admin" && (
                    <div>
                      <dt>Agencia</dt>
                      <dd>{detail.agencyName}</dd>
                    </div>
                  )}
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
                </div>
              </div>
            )}

            {modal.mode === "edit" && detail && (
              <form className="form" onSubmit={handleUpdate}>
                <dl className="detail-list">
                  <div>
                    <dt>Número de bulto</dt>
                    <dd className="mono">{detail.trackingNumber}</dd>
                  </div>
                  <div>
                    <dt>Estado actual</dt>
                    <dd>
                      <StatusBadge status={detail.status} />
                    </dd>
                  </div>
                  {user.role === "super_admin" && (
                    <div>
                      <dt>Agencia</dt>
                      <dd>{detail.agencyName}</dd>
                    </div>
                  )}
                </dl>

                <label className="field">
                  <span>Número del bulto (HBL) *</span>
                  <input
                    value={editTrackingNumber}
                    onChange={(event) => setEditTrackingNumber(event.target.value)}
                    maxLength={60}
                    required
                  />
                </label>

                <label className="field">
                  <span>Descripción del reporte *</span>
                  <textarea
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
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
                      onChange={(event) => setStatusToSet(event.target.value)}
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
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    placeholder="Agregar respuesta del reporte"
                  />
                </label>

                <div>
                  <h3>Historial</h3>
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
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar reporte"
        message={`¿Eliminar el reporte ${pendingDelete?.trackingNumber || "seleccionado"}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
