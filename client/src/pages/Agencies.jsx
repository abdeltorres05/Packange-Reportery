import AgencyFormDialog from "../features/agencies/AgencyFormDialog";
import AgencyTable from "../features/agencies/AgencyTable";
import { useAgencies } from "../features/agencies/useAgencies";

export default function Agencies() {
  const agencies = useAgencies();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Agencias</h1>
          <p className="muted">
            Cada agencia mantiene sus reportes y usuarios completamente separados.
          </p>
        </div>
      </header>

      <AgencyTable
        agencies={agencies.agencies}
        loading={agencies.loading}
        onCreate={agencies.openCreate}
        onEdit={agencies.openEdit}
        onToggleActive={agencies.toggleActive}
      />

      <AgencyFormDialog
        open={agencies.formOpen}
        agency={agencies.editingAgency}
        form={agencies.form}
        submitting={agencies.submitting}
        onChange={agencies.updateForm}
        onSubmit={agencies.submitForm}
        onClose={agencies.closeForm}
      />
    </div>
  );
}
