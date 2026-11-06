export default function CrudTabs({ moduleId, moduleName, operations, value, onChange }) {
  return (
    <div className="crud-tabs" role="tablist" aria-label={`Operaciones de ${moduleName}`}>
      {operations.map((operation) => (
        <button
          key={operation.value}
          id={`${moduleId}-tab-${operation.value}`}
          type="button"
          role="tab"
          aria-selected={value === operation.value}
          aria-controls={`${moduleId}-panel`}
          className={value === operation.value ? "crud-tab active" : "crud-tab"}
          onClick={() => onChange(operation.value)}
        >
          {operation.label}
        </button>
      ))}
    </div>
  );
}