export default function DataTable({
  columns,
  rows,
  loading,
  loadingMessage = "Cargando datos...",
  emptyMessage = "No hay datos para mostrar.",
  getRowKey = (row) => row.id,
}) {
  if (loading) {
    return (
      <p className="data-state" role="status" aria-live="polite">
        {loadingMessage}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="data-state" role="status">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.headerClassName || column.className}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.cellClassName || column.className}>
                  {column.render ? column.render(row) : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}