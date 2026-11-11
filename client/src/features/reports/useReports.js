import { useCallback, useEffect, useState } from "react";

import { api } from "../../api";
import { todayISO } from "../../constants";
import { notify } from "../../notifications";

function emptyList() {
  return { items: [], total: 0, page: 1, pages: 0 };
}

export function useReports(user, initialStatus = "") {
  const [filters, setFilters] = useState({
    status: initialStatus,
    q: "",
    agencyId: "",
    page: 1,
  });
  const [search, setSearch] = useState("");
  const [data, setData] = useState(emptyList);
  const [agencies, setAgencies] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: "view", report: null });
  const [formBulto, setFormBulto] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [responsePhotoFile, setResponsePhotoFile] = useState(null);
  const [createAgencyId, setCreateAgencyId] = useState("");
  const [note, setNote] = useState("");
  const [statusToSet, setStatusToSet] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canChangeStatus = user.role === "agency_admin" || user.role === "super_admin";
  const canDelete = user.role === "super_admin";
  const canCreate = ["agency_admin", "agency_user", "super_admin"].includes(user.role);

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
      .then(setData)
      .catch((error) => notify(error.message, "error"))
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

  const openCreate = () => {
    setModal({ open: true, mode: "create", report: null });
    setFormBulto("");
    setFormDescription("");
    setPhotoFile(null);
    setResponsePhotoFile(null);
    setCreateAgencyId("");
    setNote("");
    setStatusToSet("pendiente");
  };

  const openView = async (report) => {
    setResponsePhotoFile(null);
    try {
      const detail = await api.get(`/reports/${report.id}`);
      setModal({ open: true, mode: "view", report: { ...report, ...detail } });
    } catch (error) {
      notify(error.message, "error");
      setModal({ open: true, mode: "view", report: { ...report, history: [], photos: [] } });
    }
    setNote("");
  };

  const openEdit = async (report) => {
    setResponsePhotoFile(null);
    try {
      const detail = await api.get(`/reports/${report.id}`);
      setModal({ open: true, mode: "edit", report: { ...report, ...detail } });
      const currentReport = detail.report || report;
      setEditTrackingNumber(currentReport.trackingNumber || "");
      setEditDescription(currentReport.description || "");
      setStatusToSet(currentReport.status);
    } catch (error) {
      notify(error.message, "error");
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
    setPhotoFile(null);
    setResponsePhotoFile(null);
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
        formData.append("historyId", String(created.historyId));
        try {
          await api.post(`/reports/${created.report.id}/photos`, formData);
        } catch (photoError) {
          notify(
            `El reporte se creó, pero no se pudo subir la foto: ${photoError.message}`,
            "warning"
          );
        }
      }

      notify("Reporte creado correctamente.", "success");
      closeModal();
      fetchList();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!modal.report) return;

    const trackingNumber = editTrackingNumber.trim();
    const description = editDescription.trim();
    const response = note.trim();
    if (!trackingNumber || !description) {
      notify("El HBL y la descripción son obligatorios.", "warning");
      return;
    }
    if (responsePhotoFile && !response) {
      notify("Escribe una respuesta para publicar la foto en el historial.", "warning");
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
      if (response) payload.notes = response;
      if (Object.keys(payload).length === 0) {
        notify("Modifica un dato, cambia el estado o agrega una respuesta.", "warning");
        return;
      }
      const result = await api.patch(`/reports/${modal.report.id}`, payload);
      if (responsePhotoFile) {
        const formData = new FormData();
        formData.append("photos", responsePhotoFile);
        formData.append("historyId", String(result.historyId));
        try {
          await api.post(`/reports/${modal.report.id}/photos`, formData);
        } catch (photoError) {
          notify(
            `La respuesta se guardó, pero no se pudo adjuntar la foto: ${photoError.message}`,
            "warning"
          );
          closeModal();
          fetchList();
          return;
        }
      }
      notify("Reporte actualizado correctamente.", "warning");
      closeModal();
      fetchList();
    } catch (error) {
      notify(error.message, "error");
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
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return {
    agencies,
    canChangeStatus,
    canCreate,
    canDelete,
    closeModal,
    confirmDelete,
    createAgencyId,
    data,
    deleting,
    editDescription,
    editTrackingNumber,
    fetchList,
    filters,
    formBulto,
    formDescription,
    handleCreate,
    handleSearch,
    handleUpdate,
    history: modal.report?.history || [],
    loading,
    modal,
    note,
    openCreate,
    openEdit,
    openView,
    pendingDelete,
    photoFile,
    responsePhotoFile,
    saving,
    search,
    setCreateAgencyId,
    setEditDescription,
    setEditTrackingNumber,
    setFormBulto,
    setFormDescription,
    setNote,
    setPendingDelete,
    setPhotoFile,
    setResponsePhotoFile,
    setSearch,
    setStatusToSet,
    setFilters,
    statusToSet,
    updateFilter,
    detail: modal.report?.report || modal.report,
  };
}
