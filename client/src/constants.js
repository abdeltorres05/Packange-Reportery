export const STATUSES = ["pendiente", "procesado", "cerrado"];

export const STATUS_LABELS = {
  pendiente: "Pendiente",
  procesado: "Procesado",
  cerrado: "Cerrado",
};

export const ROLE_LABELS = {
  super_admin: "Super administrador",
  agency_admin: "Administrador del sistema",
  agency_user: "Representante de agencia",
};

export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
