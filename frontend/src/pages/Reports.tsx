import { useApi } from "../hooks/useApi.ts";
import { Button } from "../components/ui/Button.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { formatMoney } from "../lib/format.ts";
import type { TrialBalance } from "../types/index.ts";

export default function Reports() {
  const { data, loading, error, reload } =
    useApi<TrialBalance>("/api/reports/trial-balance");

  const rows = data?.rows ?? [];
  const totals = data?.totals;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trial balance</h1>
          <p className="page-subtitle">
            Debit and credit balances from posted journal entries only.
          </p>
        </div>
      </div>

      <div className="data-panel">
        {loading ? (
          <div className="state-block">Loading trial balance…</div>
        ) : error ? (
          <div className="state-block">
            <span>Could not load the trial balance. {error}</span>
            <Button variant="ghost" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="state-block">
            No posted entries yet. The trial balance will appear once journal
            entries are posted.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Credit</th>
                <th style={{ textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="code">{row.code}</span>
                  </td>
                  <td>{row.name}</td>
                  <td>
                    <Badge>{row.type}</Badge>
                  </td>
                  <td className="amount">{formatMoney(row.debit)}</td>
                  <td className="amount">{formatMoney(row.credit)}</td>
                  <td className="amount">{formatMoney(row.balance)}</td>
                </tr>
              ))}
            </tbody>
            {totals && (
              <tfoot>
                <tr>
                  <td colSpan={3}>Totals</td>
                  <td className="amount">{formatMoney(totals.debit)}</td>
                  <td className="amount">{formatMoney(totals.credit)}</td>
                  <td className="amount">
                    {formatMoney(totals.debit - totals.credit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}
