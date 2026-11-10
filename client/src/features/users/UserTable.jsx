import { useMemo } from "react";

import { ActiveIcon, CreateIcon, EditIcon } from "../../components/ActionIcons";
import DataTable from "../../components/DataTable";
import { ROLE_LABELS } from "../../constants";

export default function UserTable({
  users,
  currentUser,
  loading,
  onCreate,
  onEdit,
  onToggleActive,
}) {
  const columns = useMemo(() => [
    {
      key: "name",
      label: "Nombre",
      render: (item) => (
        <>
          {item.name}
          {item.id === currentUser.id && <span className="tag">Tú</span>}
        </>
      ),
    },
    { key: "email", label: "Correo" },
    { key: "role", label: "Rol", render: (item) => ROLE_LABELS[item.role] || item.role },
    { key: "agencyName", label: "Agencia", render: (item) => item.agencyName || "—" },
    {
      key: "active",
      label: "Estado",
      render: (item) => (
        <span className={item.active ? "pill pill-on" : "pill pill-off"}>
          {item.active ? "Activo" : "Inactivo"}
        </span>
      ),
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
            onClick={() => onEdit(item)}
            title="Editar usuario"
            aria-label={`Editar usuario ${item.name}`}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className="icon-button"
            disabled={item.id === currentUser.id}
            onClick={() => onToggleActive(item)}
            title={item.id === currentUser.id
              ? "No puedes cambiar el estado de tu propio usuario"
              : item.active ? "Desactivar usuario" : "Activar usuario"}
            aria-label={item.active
              ? `Desactivar usuario ${item.name}`
              : `Activar usuario ${item.name}`}
          >
            <ActiveIcon active={item.active} />
          </button>
        </div>
      ),
    },
  ], [currentUser.id, onEdit, onToggleActive]);

  return (
    <section className="card">
      <div className="card-header">
        <div className="table-title">
          <h2>Usuarios registrados</h2>
          <span className="list-count" aria-label={`${users.length} usuarios`}>
            {users.length}
          </span>
        </div>
        <button
          type="button"
          className="icon-button report-create-button"
          onClick={onCreate}
          title="Crear usuario"
          aria-label="Crear usuario"
        >
          <CreateIcon />
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        loadingMessage="Cargando usuarios..."
        emptyMessage="No hay usuarios registrados."
      />
    </section>
  );
}
