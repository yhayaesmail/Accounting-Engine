import prisma from "../../config/prisma.js";

export const getDashboard = async (companyId: string) => {
  const [accounts, customers, vendors, invoices, payments, journalEntries] = await Promise.all([
    prisma.account.count({ where: { companyId, deletedAt: null } }),
    prisma.customer.count({ where: { companyId, deletedAt: null } }),
    prisma.vendor.count({ where: { companyId, deletedAt: null } }),
    prisma.invoice.findMany({ where: { companyId, deletedAt: null } }),
    prisma.payment.findMany({ where: { companyId, deletedAt: null } }),
    prisma.journalEntry.count({ where: { companyId, deletedAt: null } }),
  ]);
  const invoiceTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    accounts,
    customers,
    vendors,
    journalEntries,
    invoices: invoices.length,
    invoiceTotal,
    paidTotal,
    openBalance: invoiceTotal - paidTotal,
  };
};

export const getTrialBalance = async (companyId: string) => {
  const accounts = await prisma.account.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    include: {
      transactions: {
        where: {
          deletedAt: null,
          journal: {
            companyId,
            status: "POSTED",
            deletedAt: null,
          },
        },
      },
    },
    orderBy: {
      code: "asc",
    },
  });
  const rows = accounts.map((account) => {
    const debit = account.transactions.reduce((sum, transaction) => sum + transaction.debit, 0);
    const credit = account.transactions.reduce((sum, transaction) => sum + transaction.credit, 0);
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      debit,
      credit,
      balance: debit - credit,
    };
  });
  return {
    rows,
    totals: {
      debit: rows.reduce((sum, row) => sum + row.debit, 0),
      credit: rows.reduce((sum, row) => sum + row.credit, 0),
    },
  };
};
