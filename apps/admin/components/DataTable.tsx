import StatusBadge from "./StatusBadge";

type DataTableProps = {
  columns: string[];
  rows: string[][];
  statusColumns?: number[];
};

export default function DataTable({
  columns,
  rows,
  statusColumns = [],
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-800/50 text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column} className="p-4 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-slate-800">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="p-4">
                  {statusColumns.includes(cellIndex) ? (
                    <StatusBadge label={cell} />
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}