import { useCallback, useEffect, useState } from "react";

import { api } from "../../api";
import { notify } from "../../notifications";

function emptyForm() {
  return { name: "", code: "" };
}

export function useAgencies() {
  const [agencies, setAgencies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingAgency, setEditingAgency] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/agencies?all=1")
      .then(({ items }) => setAgencies(items))
      .catch((error) => notify(error.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditingAgency(null);
    setFormOpen(true);
  };

  const openEdit = (agency) => {
    setForm({ name: agency.name, code: agency.code });
    setEditingAgency(agency);
    setFormOpen(true);
  };

  const closeForm = () => {
    setForm(emptyForm());
    setEditingAgency(null);
    setFormOpen(false);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (editingAgency) {
        await api.patch(`/agencies/${editingAgency.id}`, form);
        notify("Agencia actualizada correctamente.", "success");
      } else {
        await api.post("/agencies", form);
        notify("Agencia creada correctamente.", "success");
      }
      closeForm();
      load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (agency) => {
    try {
      await api.patch(`/agencies/${agency.id}`, { active: !agency.active });
      notify(agency.active ? "Agencia desactivada." : "Agencia activada.", "warning");
      load();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return {
    agencies,
    editingAgency,
    form,
    formOpen,
    loading,
    submitting,
    openCreate,
    openEdit,
    closeForm,
    updateForm,
    submitForm,
    toggleActive,
  };
}
