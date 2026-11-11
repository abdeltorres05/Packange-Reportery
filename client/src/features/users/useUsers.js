import { useCallback, useEffect, useState } from "react";

import { api } from "../../api";
import { notify } from "../../notifications";

function emptyForm() {
  return {
    name: "",
    email: "",
    password: "",
    role: "agency_user",
    agencyId: "",
  };
}

export function useUsers(user) {
  const isSuper = user.role === "super_admin";
  const canAssignAgency = isSuper || user.role === "agency_admin";
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const requests = [api.get("/users")];
    if (canAssignAgency) requests.push(api.get("/agencies"));

    Promise.all(requests)
      .then(([usersData, agenciesData]) => {
        setUsers(usersData.items);
        if (agenciesData) setAgencies(agenciesData.items);
      })
      .catch((error) => notify(error.message, "error"))
      .finally(() => setLoading(false));
  }, [canAssignAgency]);

  useEffect(load, [load]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm());
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEdit = (target) => {
    setForm({
      name: target.name,
      email: target.email,
      password: "",
      role: target.role,
      agencyId: target.agencyId ? String(target.agencyId) : "",
    });
    setEditingUser(target);
    setFormOpen(true);
  };

  const closeForm = () => {
    setForm(emptyForm());
    setEditingUser(null);
    setFormOpen(false);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    if (
      canAssignAgency &&
      (!editingUser || isSuper) &&
      form.role === "agency_user"
    ) {
      payload.agencyId = Number(form.agencyId);
      if (!payload.agencyId) {
        notify("Selecciona la agencia del usuario.", "warning");
        setSubmitting(false);
        return;
      }
    }

    try {
      if (editingUser) {
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${editingUser.id}`, payload);
        notify("Usuario actualizado correctamente.", "success");
      } else {
        await api.post("/users", payload);
        notify("Usuario creado correctamente.", "success");
      }
      closeForm();
      load();
    } catch (error) {
      const details = (error.details || [])
        .map((detail) => `${detail.path ? `${detail.path}: ` : ""}${detail.message}`)
        .join("; ");
      notify(details ? `${error.message}: ${details}` : error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (target) => {
    try {
      await api.patch(`/users/${target.id}`, { active: !target.active });
      notify(target.active ? "Usuario desactivado." : "Usuario activado.", "warning");
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return {
    users,
    agencies,
    form,
    editingUser,
    formOpen,
    loading,
    submitting,
    isSuper,
    canAssignAgency,
    availableRoles: isSuper
      ? ["super_admin", "agency_admin", "agency_user"]
      : ["agency_admin", "agency_user"],
    openCreate,
    openEdit,
    closeForm,
    updateForm,
    submitForm,
    toggleActive,
  };
}
