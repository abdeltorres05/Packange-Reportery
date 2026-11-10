import { useAuth } from "../auth/AuthContext";
import UserFormDialog from "../features/users/UserFormDialog";
import UserTable from "../features/users/UserTable";
import { useUsers } from "../features/users/useUsers";

export default function Users() {
  const { user } = useAuth();
  const users = useUsers(user);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">
            {users.isSuper
              ? "Administra los responsables de todas las agencias."
              : `Administra los usuarios de ${user.agencyName}.`}
          </p>
        </div>
      </header>

      <UserTable
        users={users.users}
        currentUser={user}
        loading={users.loading}
        onCreate={users.openCreate}
        onEdit={users.openEdit}
        onToggleActive={users.toggleActive}
      />

      <UserFormDialog
        open={users.formOpen}
        user={users.editingUser}
        isSuper={users.isSuper}
        agencies={users.agencies}
        availableRoles={users.availableRoles}
        form={users.form}
        submitting={users.submitting}
        onChange={users.updateForm}
        onSubmit={users.submitForm}
        onClose={users.closeForm}
      />
    </div>
  );
}
