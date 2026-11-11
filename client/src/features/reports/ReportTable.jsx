import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { STATUSES, STATUS_LABELS, formatDateTime } from "../../constants";

const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function ReportTable({
  user,
  agencies,
  data,
  filters,
  search,
  loading,
  canCreate,
  canDelete,
  onCreate,
  onSearchChange,
  onSearch,
  onFilterChange,
  onView,
  onEdit,
  onDelete,
  onPageChange,
}) {
  const columns = [
    { key: "trackingNumber", label: "Número de bulto", className: "mono" },
    {
      key: "status",
      label: "Estado",
      render: (item) => <StatusBadge status={item.status} />,
    },
    ...(user.role === "super_admin" || user.role === "agency_admin"
      ? [{ key: "agencyName", label: "Agencia" }]
      : []),
    { key: "createdByName", label: "Creado por" },
    {
      key: "createdAt",
      label: "Fecha creación",
      render: (item) => formatDateTime(item.createdAt),
    },
    {
      key: "lastNote",
      label: "Última respuesta",
      render: (item) => item.lastNote || "—",
    },
    {
      key: "actions",
      label: "Acciones",
      headerClassName: "actions-head",
      cellClassName: "actions-cell",
      render: (item) => (
        <div className="action-group">
          <button
            type="button"
            className="icon-button"
            title="Visualizar"
            aria-label={`Visualizar reporte ${item.trackingNumber}`}
            onClick={() => onView(item)}
          >
            <EyeIcon />
          </button>
          <button
            type="button"
            className="icon-button"
            title="Modificar"
            aria-label={`Modificar reporte ${item.trackingNumber}`}
            onClick={() => onEdit(item)}
          >
            <EditIcon />
          </button>
          {canDelete && (
            <button
              type="button"
              className="icon-button icon-button-danger"
              title="Eliminar"
              aria-label={`Eliminar reporte ${item.trackingNumber}`}
              onClick={() => onDelete(item)}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <section className="card">
        <div className="card-header">
          <div className="table-title">
            <h2>Listado de reportes</h2>
            <span className="list-count" aria-label={`${data.total} reportes`}>
              {data.total}
            </span>
          </div>
          {canCreate && (
            <button
              type="button"
              className="icon-button report-create-button"
              onClick={onCreate}
              title="Crear reporte"
              aria-label="Crear reporte"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>

        <div className="filters-inline">
          <form onSubmit={onSearch}>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por número de bulto"
            />
          </form>
          <select
            value={filters.status}
            onChange={(event) => onFilterChange("status", event.target.value)}
          >
            <option value="">Todos los estados</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {(user.role === "super_admin" || user.role === "agency_admin") && (
            <select
              value={filters.agencyId}
              onChange={(event) => onFilterChange("agencyId", event.target.value)}
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
          rows={data.items}
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
              onClick={() => onPageChange(data.page - 1)}
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
              onClick={() => onPageChange(data.page + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </>
  );
}
