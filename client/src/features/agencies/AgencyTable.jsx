import DataTable from "../../components/DataTable";
import { ActiveIcon, CreateIcon, EditIcon } from "../../components/ActionIcons";
import { formatDateTime } from "../../constants";

export default function AgencyTable({
  agencies,
  loading,
  onCreate,
  onEdit,
  onToggleActive,
}) {
  const columns = [
    { key: "name", label: "Nombre" },
    { key: "code", label: "Código", className: "mono" },
    {
      key: "active",
      label: "Estado",
      render: (agency) => (
        <span className={agency.active ? "pill pill-on" : "pill pill-off"}>
          {agency.active ? "Activa" : "Inactiva"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Creada",
      render: (agency) => formatDateTime(agency.createdAt),
    },
    {
      key: "actions",
      label: "Acciones",
      headerClassName: "actions-head",
      cellClassName: "actions-cell",
      render: (agency) => (
        <div className="action-group">
          <button
            type="button"
            className="icon-button"
            onClick={() => onEdit(agency)}
            title="Editar agencia"
            aria-label={`Editar agencia ${agency.name}`}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => onToggleActive(agency)}
            title={agency.active ? "Desactivar agencia" : "Activar agencia"}
            aria-label={agency.active
              ? `Desactivar agencia ${agency.name}`
              : `Activar agencia ${agency.name}`}
          >
            <ActiveIcon active={agency.active} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="card">
      <div className="card-header">
        <div className="table-title">
          <h2>Agencias registradas</h2>
          <span className="list-count" aria-label={`${agencies.length} agencias`}>
            {agencies.length}
          </span>
        </div>
        <button
          type="button"
          className="icon-button report-create-button"
          onClick={onCreate}
          title="Crear agencia"
          aria-label="Crear agencia"
        >
          <CreateIcon />
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={agencies}
        loading={loading}
        loadingMessage="Cargando agencias..."
        emptyMessage="Aún no hay agencias registradas."
      />
    </section>
  );
}
