import { useLocation } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import ReportDialog from "../features/reports/ReportDialog";
import ReportTable from "../features/reports/ReportTable";
import { useReports } from "../features/reports/useReports";

export default function Reports() {
  const { user } = useAuth();
  const location = useLocation();
  const initialStatus = new URLSearchParams(location.search).get("status") || "";
  const reports = useReports(user, initialStatus);

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

      <ReportTable
        user={user}
        agencies={reports.agencies}
        data={reports.data}
        filters={reports.filters}
        search={reports.search}
        loading={reports.loading}
        canCreate={reports.canCreate}
        canDelete={reports.canDelete}
        onCreate={reports.openCreate}
        onSearchChange={reports.setSearch}
        onSearch={reports.handleSearch}
        onFilterChange={reports.updateFilter}
        onView={reports.openView}
        onEdit={reports.openEdit}
        onDelete={reports.setPendingDelete}
        onPageChange={(page) =>
          reports.setFilters((current) => ({ ...current, page }))
        }
      />

      <ReportDialog
        user={user}
        agencies={reports.agencies}
        modal={reports.modal}
        detail={reports.detail}
        history={reports.history}
        formBulto={reports.formBulto}
        formDescription={reports.formDescription}
        editTrackingNumber={reports.editTrackingNumber}
        editDescription={reports.editDescription}
        attachPhoto={reports.attachPhoto}
        photoFile={reports.photoFile}
        createAgencyId={reports.createAgencyId}
        note={reports.note}
        statusToSet={reports.statusToSet}
        canChangeStatus={reports.canChangeStatus}
        saving={reports.saving}
        onClose={reports.closeModal}
        onCreate={reports.handleCreate}
        onUpdate={reports.handleUpdate}
        onFormBultoChange={reports.setFormBulto}
        onFormDescriptionChange={reports.setFormDescription}
        onEditTrackingNumberChange={reports.setEditTrackingNumber}
        onEditDescriptionChange={reports.setEditDescription}
        onAttachPhotoChange={(value) => {
          reports.setAttachPhoto(value);
          reports.setPhotoFile(null);
        }}
        onPhotoFileChange={reports.setPhotoFile}
        onCreateAgencyChange={reports.setCreateAgencyId}
        onNoteChange={reports.setNote}
        onStatusChange={reports.setStatusToSet}
      />

      <ConfirmDialog
        open={Boolean(reports.pendingDelete)}
        title="Eliminar reporte"
        message={`¿Eliminar el reporte ${reports.pendingDelete?.trackingNumber || "seleccionado"}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        busy={reports.deleting}
        onConfirm={reports.confirmDelete}
        onCancel={() => reports.setPendingDelete(null)}
      />
    </div>
  );
}
