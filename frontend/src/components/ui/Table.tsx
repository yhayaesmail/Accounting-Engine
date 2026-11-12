import type { ReactNode } from "react";

export interface TableColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  render?: (value: unknown, row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  rowKey?: string;
}

export function Table<T>({
  columns,
  data,
  emptyMessage = "No records found.",
  rowKey = "id",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="table-wrap">
        <div className="empty-state">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: col.align ?? "left" }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String((row as Record<string, unknown>)[rowKey])}>
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[col.key];
                const isNumber = typeof value === "number";
                const cell =
                  col.render?.(value, row) ??
                  (isNumber
                    ? value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : String(value ?? ""));
                return (
                  <td
                    key={col.key}
                    style={{
                      textAlign: col.align ?? (isNumber ? "right" : "left"),
                    }}
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
