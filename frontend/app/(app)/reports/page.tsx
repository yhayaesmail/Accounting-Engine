"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { accountTypeLabels, formatDate, formatMoney, sum } from "@/lib/format";
import type { AccountType, TrialBalanceData, TrialBalanceRow } from "@/lib/types";
import { useSession } from "@/lib/session";
import { Icon } from "@/components/icons";
import {
  Button,
  EmptyState,
  ErrorState,
  FilterSelect,
  LoadingState,
  PageHeader,
  SearchField,
  TableScroll,
  Toolbar,
  ToolbarMeta,
} from "@/components/ui";

function TrialRows({
  rows,
  totalDebit,
  totalCredit,
  totalLabel,
}: {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  totalLabel: string;
}) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Code</th>
          <th scope="col">Account</th>
          <th scope="col">Type</th>
          <th scope="col" className="num">
            Debit
          </th>
          <th scope="col" className="num">
            Credit
          </th>
          <th scope="col" className="num">
            Balance
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="cell-code">{row.code}</td>
            <td className="cell-primary">{row.name}</td>
            <td className="type-tag">{accountTypeLabels[row.type] ?? row.type}</td>
            <td className="num">{row.debit ? formatMoney(row.debit) : "—"}</td>
            <td className="num">{row.credit ? formatMoney(row.credit) : "—"}</td>
            <td className="num">{formatMoney(row.balance)}</td>
          </tr>
        ))}
        <tr className="totals-row">
          <td colSpan={3}>{totalLabel}</td>
          <td className="num">{formatMoney(totalDebit)}</td>
          <td className="num">{formatMoney(totalCredit)}</td>
          <td className="num">{formatMoney(totalDebit - totalCredit)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default function TrialBalancePage() {
  const { session } = useSession();
  const { data, loading, error, reload } = useResource<TrialBalanceData>(
    (signal) => api<TrialBalanceData>("/reports/trial-balance", { signal }),
    [],
  );
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [preparedOn, setPreparedOn] = useState("");

  useEffect(() => {
    setPreparedOn(formatDate(new Date()));
  }, []);

  const rows = data?.rows ?? [];
  const totals = data?.totals ?? { debit: 0, credit: 0 };
  const difference = Math.abs(totals.debit - totals.credit);
  const balanced = difference < 0.005;
  const hasActivity = rows.some((row) => row.debit !== 0 || row.credit !== 0);
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const needle = search.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          row.name.toLowerCase().includes(needle) ||
          row.code.toLowerCase().includes(needle);
        const matchesType = typeFilter === "ALL" || row.type === typeFilter;
        return matchesSearch && matchesType;
      }),
    [rows, search, typeFilter],
  );
  const filteredDebit = sum(filtered.map((row) => row.debit));
  const filteredCredit = sum(filtered.map((row) => row.credit));
  const filtersActive = search.length > 0 || typeFilter !== "ALL";
  const companyName = session?.company?.name ?? "Accounting Engine";

  return (
    <div className="page-stack">
      <PageHeader
        title="Trial balance"
        description="Debit and credit totals for every account, calculated from posted journal entries. Draft entries are excluded."
        actions={
          <Button
            variant="secondary"
            icon={<Icon name="print" size={15} />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        }
      />

      <section className="panel" aria-label="Trial balance report">
        <div className="print-only print-report-head">
          <p className="print-company">{companyName}</p>
          <p className="print-meta">Trial balance · Posted entries only</p>
          <p className="print-title">{preparedOn ? `Prepared ${preparedOn}` : "Trial balance"}</p>
        </div>

        {loading && <LoadingState label="Calculating the trial balance…" />}

        {error && !loading && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title="No accounts to report"
            description="The trial balance lists every account in the chart. Add accounts and post a journal entry to see balances."
            action={
              <Link href="/accounts" className="btn btn-primary btn-md">
                Go to accounts
              </Link>
            }
          />
        )}

        {!loading && !error && rows.length > 0 && (
          <>
            <div className="report-panel-head">
              <div>
                <h2>Posted balances</h2>
                <p>
                  {hasActivity
                    ? "Every account in the chart, including those with no posted activity."
                    : "No posted journal entries yet — every account currently shows a zero balance."}
                </p>
              </div>
              <div className="report-totals" aria-label="Report totals">
                <div>
                  <dt>Total debits</dt>
                  <dd>{formatMoney(totals.debit)}</dd>
                </div>
                <div>
                  <dt>Total credits</dt>
                  <dd>{formatMoney(totals.credit)}</dd>
                </div>
                <div>
                  <dt>Difference</dt>
                  <dd>{formatMoney(difference)}</dd>
                </div>
                <div>
                  <dt>Check</dt>
                  <dd>
                    <span
                      className={`report-status ${balanced ? "report-status-ok" : "report-status-off"}`}
                    >
                      {balanced ? "Debits equal credits" : "Out of balance"}
                    </span>
                  </dd>
                </div>
              </div>
            </div>

            <Toolbar>
              <SearchField
                label="Search accounts"
                placeholder="Search by account or code"
                value={search}
                onChange={setSearch}
              />
              <FilterSelect
                label="Filter by account type"
                value={typeFilter}
                onChange={setTypeFilter}
              >
                <option value="ALL">All types</option>
                {(Object.keys(accountTypeLabels) as AccountType[]).map((type) => (
                  <option key={type} value={type}>
                    {accountTypeLabels[type]}
                  </option>
                ))}
              </FilterSelect>
              <ToolbarMeta>
                {filtered.length} of {rows.length} accounts shown
                {filtersActive ? " · totals cover all accounts" : ""}
              </ToolbarMeta>
            </Toolbar>

            {filtered.length === 0 ? (
              <EmptyState
                title="No matching accounts"
                description="No account matches the current search and type filter."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("ALL");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="report-screen-table">
                <TableScroll label="Trial balance table">
                  <TrialRows
                    rows={filtered}
                    totalDebit={filteredDebit}
                    totalCredit={filteredCredit}
                    totalLabel={filtersActive ? "Total shown" : "Total"}
                  />
                </TableScroll>
              </div>
            )}

            <div className="print-report-table">
              <TrialRows
                rows={rows}
                totalDebit={totals.debit}
                totalCredit={totals.credit}
                totalLabel="Total"
              />
            </div>

            <p className="print-footer print-only">
              Generated by Accounting Engine · {preparedOn} · Amounts in USD
            </p>
          </>
        )}
      </section>
    </div>
  );
}
