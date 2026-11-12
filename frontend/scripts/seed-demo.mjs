/**
 * Seeds a realistic demo company through the existing backend REST API.
 * No backend code or configuration is modified.
 *
 * Usage:  npm run seed:demo
 *         API_URL=http://localhost:4300 npm run seed:demo
 */

const API = (process.env.API_URL ?? "http://localhost:4300").replace(/\/$/, "");

const DEMO = {
  companyName: "meridian & co.",
  email: "demo@meridianco.com",
  password: "Meridian2026!",
};

const ACCOUNTS = [
  { code: "1000", name: "Cash on Hand", type: "ASSET", currency: "USD" },
  { code: "1010", name: "Business Checking", type: "ASSET", currency: "USD" },
  { code: "1100", name: "Accounts Receivable", type: "ASSET", currency: "USD" },
  { code: "1200", name: "Inventory", type: "ASSET", currency: "USD" },
  { code: "1300", name: "Prepaid Expenses", type: "ASSET", currency: "USD" },
  { code: "1500", name: "Computer Equipment", type: "ASSET", currency: "USD" },
  { code: "2000", name: "Accounts Payable", type: "LIABILITY", currency: "USD" },
  { code: "2100", name: "Sales Tax Payable", type: "LIABILITY", currency: "USD" },
  { code: "3000", name: "Owner's Equity", type: "EQUITY", currency: "USD" },
  { code: "3100", name: "Retained Earnings", type: "EQUITY", currency: "USD" },
  { code: "4000", name: "Product Sales", type: "REVENUE", currency: "USD" },
  { code: "4100", name: "Service Revenue", type: "REVENUE", currency: "USD" },
  { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE", currency: "USD" },
  { code: "5100", name: "Rent Expense", type: "EXPENSE", currency: "USD" },
  { code: "5200", name: "Salaries & Wages", type: "EXPENSE", currency: "USD" },
  { code: "5300", name: "Utilities", type: "EXPENSE", currency: "USD" },
  { code: "5400", name: "Software Subscriptions", type: "EXPENSE", currency: "USD" },
  { code: "5500", name: "Office Supplies", type: "EXPENSE", currency: "USD" },
  { code: "5600", name: "Marketing & Advertising", type: "EXPENSE", currency: "USD" },
];

const CUSTOMERS = [
  { key: "alder", name: "Alder Creek Outfitters", email: "accounts@aldercreek.co" },
  { key: "blue", name: "Blue Harbor Design", email: "billing@blueharbordesign.com" },
  { key: "cedar", name: "Cedar & Pine Interiors", email: "hello@cedarandpine.com" },
  { key: "harbor", name: "Harborview Dental", email: "office@harborviewdental.com" },
  { key: "juniper", name: "Juniper Lane Café", email: "books@juniperlane.com" },
  { key: "keystone", name: "Keystone Legal Group", email: "accounts@keystonelegal.com" },
  { key: "northstar", name: "Northstar Yoga Studio", email: "admin@northstaryoga.com" },
];

const VENDORS = [
  { key: "pacific", name: "Pacific Paper Supply", contact: "orders@pacificpaper.com" },
  { key: "metro", name: "Metro Office Systems", contact: "support@metrooffice.com" },
  { key: "greenline", name: "Greenline Couriers", contact: "dispatch@greenlinecouriers.com" },
  { key: "cloudline", name: "Cloudline Hosting", contact: "billing@cloudline.io" },
  { key: "alvarez", name: "R. Alvarez Consulting", contact: "ralvarez@alvarezconsulting.com" },
  { key: "brightway", name: "Brightway Utilities", contact: "accounts@brightwayutilities.com" },
];

// createdAt on payments is set by the server (the API does not accept a date),
// but every other record carries a realistic historical date.
const INVOICES = [
  { key: "alder-sep", customer: "alder", total: 1620, status: "SENT", issuedAt: "2026-09-15T10:00:00.000Z" },
  { key: "northstar-sep", customer: "northstar", total: 3150, status: "SENT", issuedAt: "2026-09-22T10:00:00.000Z" },
  { key: "keystone-sep", customer: "keystone", total: 12400, status: "SENT", issuedAt: "2026-09-30T10:00:00.000Z" },
  { key: "harbor-oct", customer: "harbor", total: 1875, status: "SENT", issuedAt: "2026-10-05T10:00:00.000Z" },
  { key: "cedar-oct", customer: "cedar", total: 7200, status: "SENT", issuedAt: "2026-10-12T10:00:00.000Z" },
  { key: "alder-oct", customer: "alder", total: 2340, status: "SENT", issuedAt: "2026-10-20T10:00:00.000Z" },
  { key: "blue-oct", customer: "blue", total: 4850, status: "SENT", issuedAt: "2026-10-28T10:00:00.000Z" },
  { key: "juniper-nov", customer: "juniper", total: 980, status: "DRAFT", issuedAt: "2026-11-02T10:00:00.000Z" },
  { key: "blue-nov", customer: "blue", total: 5600, status: "SENT", issuedAt: "2026-11-05T10:00:00.000Z" },
];

const PAYMENTS = [
  { invoice: "alder-sep", amount: 1620, method: "Check" },
  { invoice: "keystone-sep", amount: 12400, method: "Bank transfer" },
  { invoice: "harbor-oct", amount: 1875, method: "Credit card" },
  { invoice: "cedar-oct", amount: 2000, method: "Bank transfer" },
  { invoice: "alder-oct", amount: 2340, method: "Bank transfer" },
  { invoice: null, amount: 450, method: "Cash" },
];

const JOURNAL = [
  {
    description: "Opening balances — business formation",
    date: "2026-08-01T12:00:00.000Z",
    post: true,
    lines: [
      ["1010", 25000, 0],
      ["3000", 0, 25000],
    ],
  },
  {
    description: "Opening inventory — autumn stock",
    date: "2026-08-01T12:05:00.000Z",
    post: true,
    lines: [
      ["1200", 8500, 0],
      ["3000", 0, 8500],
    ],
  },
  {
    description: "Two design workstations — Apple",
    date: "2026-09-05T12:00:00.000Z",
    post: true,
    lines: [
      ["1500", 4800, 0],
      ["1010", 0, 4800],
    ],
  },
  {
    description: "Autumn collection campaign — print and social",
    date: "2026-09-18T12:00:00.000Z",
    post: true,
    lines: [
      ["5600", 1250, 0],
      ["1010", 0, 1250],
    ],
  },
  {
    description: "September cost of goods sold",
    date: "2026-09-30T12:00:00.000Z",
    post: true,
    lines: [
      ["5000", 4100, 0],
      ["1200", 0, 4100],
    ],
  },
  {
    description: "October rent — 14 Harbor Street",
    date: "2026-10-01T12:00:00.000Z",
    post: true,
    lines: [
      ["5100", 3200, 0],
      ["1010", 0, 3200],
    ],
  },
  {
    description: "Cloudline hosting — October",
    date: "2026-10-05T12:00:00.000Z",
    post: true,
    lines: [
      ["5400", 240, 0],
      ["1010", 0, 240],
    ],
  },
  {
    description: "Office supplies — Pacific Paper",
    date: "2026-10-09T12:00:00.000Z",
    post: true,
    lines: [
      ["5500", 386.4, 0],
      ["2000", 0, 386.4],
    ],
  },
  {
    description: "Payment received — Keystone Legal Group",
    date: "2026-10-14T12:00:00.000Z",
    post: true,
    lines: [
      ["1010", 12400, 0],
      ["1100", 0, 12400],
    ],
  },
  {
    description: "Q3 sales tax remittance",
    date: "2026-10-15T12:00:00.000Z",
    post: true,
    lines: [
      ["2100", 1860, 0],
      ["1010", 0, 1860],
    ],
  },
  {
    description: "Consulting revenue — Blue Harbor Design",
    date: "2026-10-28T12:00:00.000Z",
    post: true,
    lines: [
      ["1100", 4850, 0],
      ["4100", 0, 4850],
    ],
  },
  {
    description: "October payroll",
    date: "2026-10-31T12:00:00.000Z",
    post: true,
    lines: [
      ["5200", 14800, 0],
      ["1010", 0, 14800],
    ],
  },
  {
    description: "November rent — 14 Harbor Street",
    date: "2026-11-01T12:00:00.000Z",
    post: true,
    lines: [
      ["5100", 3200, 0],
      ["1010", 0, 3200],
    ],
  },
  {
    description: "Utilities — Brightway, October",
    date: "2026-11-03T12:00:00.000Z",
    post: true,
    lines: [
      ["5300", 412.75, 0],
      ["1010", 0, 412.75],
    ],
  },
  {
    description: "October payroll accrual",
    date: "2026-11-10T12:00:00.000Z",
    post: false,
    lines: [
      ["5200", 7400, 0],
      ["2000", 0, 7400],
    ],
  },
  {
    description: "Prepaid insurance — Q4 policy",
    date: "2026-11-11T12:00:00.000Z",
    post: false,
    lines: [
      ["1300", 1260, 0],
      ["1010", 0, 1260],
    ],
  },
];

async function request(method, path, { body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    // Some endpoints may return no body; status decides.
  }

  if (!res.ok) {
    const message = json?.message ?? `${res.status} ${res.statusText}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return json?.success === true && json && "data" in json ? json.data : json;
}

function money(value) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function main() {
  console.log(`Seeding demo data through ${API}\n`);

  // 1. Company + admin user -------------------------------------------------
  let session;
  try {
    session = await request("POST", "/api/auth/register-company", {
      body: DEMO,
    });
    console.log("Created company and admin user.");
  } catch (error) {
    if (error.status !== 409) throw error;
    try {
      session = await request("POST", "/api/auth/login", {
        body: { email: DEMO.email, password: DEMO.password },
      });
      console.log("Demo account already exists — signed in.");
    } catch {
      throw new Error(
        `The email ${DEMO.email} already exists but the demo password does not match it. ` +
          "Use a different demo email in scripts/seed-demo.mjs."
      );
    }
  }

  const token = session.tokens.accessToken;

  // 2. Chart of accounts ----------------------------------------------------
  const existingAccounts = await request("GET", "/api/accounts", { token });
  const accountByCode = new Map(existingAccounts.map((a) => [a.code, a]));
  let accountsCreated = 0;
  for (const account of ACCOUNTS) {
    if (accountByCode.has(account.code)) continue;
    const created = await request("POST", "/api/accounts", {
      token,
      body: account,
    });
    accountByCode.set(created.code, created);
    accountsCreated += 1;
  }
  console.log(
    `Accounts: ${accountsCreated} created, ${accountByCode.size} available.`
  );

  // 3. Customers and vendors ------------------------------------------------
  const existingCustomers = await request("GET", "/api/customers", { token });
  const customerByName = new Map(existingCustomers.map((c) => [c.name, c]));
  let customersCreated = 0;
  for (const customer of CUSTOMERS) {
    if (customerByName.has(customer.name)) continue;
    const created = await request("POST", "/api/customers", {
      token,
      body: { name: customer.name, email: customer.email },
    });
    customerByName.set(created.name, created);
    customersCreated += 1;
  }
  console.log(
    `Customers: ${customersCreated} created, ${customerByName.size} available.`
  );

  const existingVendors = await request("GET", "/api/vendors", { token });
  const vendorByName = new Map(existingVendors.map((v) => [v.name, v]));
  let vendorsCreated = 0;
  for (const vendor of VENDORS) {
    if (vendorByName.has(vendor.name)) continue;
    const created = await request("POST", "/api/vendors", {
      token,
      body: { name: vendor.name, contact: vendor.contact },
    });
    vendorByName.set(created.name, created);
    vendorsCreated += 1;
  }
  console.log(
    `Vendors: ${vendorsCreated} created, ${vendorByName.size} available.`
  );

  // 4. Invoices and payments ------------------------------------------------
  const existingInvoices = await request("GET", "/api/invoices", { token });
  let invoicesCreated = 0;
  let paymentsCreated = 0;

  if (existingInvoices.length > 0) {
    console.log("Invoices already present — skipping invoice and payment seed.");
  } else {
    const invoiceByKey = new Map();
    for (const invoice of INVOICES) {
      const customer = customerByName.get(
        CUSTOMERS.find((c) => c.key === invoice.customer).name
      );
      const created = await request("POST", "/api/invoices", {
        token,
        body: {
          customerId: customer.id,
          total: invoice.total,
          status: invoice.status,
          issuedAt: invoice.issuedAt,
        },
      });
      invoiceByKey.set(invoice.key, created);
      invoicesCreated += 1;
    }

    for (const payment of PAYMENTS) {
      const linked = payment.invoice
        ? invoiceByKey.get(payment.invoice)
        : null;
      await request("POST", "/api/payments", {
        token,
        body: {
          amount: payment.amount,
          method: payment.method,
          invoiceId: linked ? linked.id : null,
        },
      });
      paymentsCreated += 1;
    }

    console.log(`Invoices: ${invoicesCreated} created.`);
    console.log(`Payments: ${paymentsCreated} created.`);
  }

  // 5. Journal entries ------------------------------------------------------
  const journal = await request("GET", "/api/journal?page=1&limit=100", {
    token,
  });
  const existingEntries = new Map(
    journal.data.map((entry) => [entry.description, entry])
  );
  let entriesCreated = 0;
  let entriesPosted = 0;

  for (const entry of JOURNAL) {
    let record = existingEntries.get(entry.description);

    if (!record) {
      record = await request("POST", "/api/journal", {
        token,
        body: {
          description: entry.description,
          date: entry.date,
          transactions: entry.lines.map(([code, debit, credit]) => ({
            accountId: accountByCode.get(code).id,
            ...(debit ? { debit } : {}),
            ...(credit ? { credit } : {}),
          })),
        },
      });
      entriesCreated += 1;
    }

    if (entry.post && record.status !== "POSTED") {
      await request("PATCH", `/api/journal/${record.id}/post`, { token });
      entriesPosted += 1;
    }
  }

  console.log(
    `Journal entries: ${entriesCreated} created, ${entriesPosted} posted.`
  );

  // 6. Verify and report ----------------------------------------------------
  const [accounts, customers, vendors, invoices, payments, entries, dashboard, trial] =
    await Promise.all([
      request("GET", "/api/accounts", { token }),
      request("GET", "/api/customers", { token }),
      request("GET", "/api/vendors", { token }),
      request("GET", "/api/invoices", { token }),
      request("GET", "/api/payments", { token }),
      request("GET", "/api/journal?page=1&limit=100", { token }),
      request("GET", "/api/reports/dashboard", { token }),
      request("GET", "/api/reports/trial-balance", { token }),
    ]);

  const paidInvoices = invoices.filter((i) => i.status === "PAID").length;
  const draftInvoices = invoices.filter((i) => i.status === "DRAFT").length;

  console.log("\nDemo workspace is ready.\n");
  console.log("  Company      meridian & co.");
  console.log(`  Email        ${DEMO.email}`);
  console.log(`  Password     ${DEMO.password}`);
  console.log("");
  console.log(`  Accounts     ${accounts.length}`);
  console.log(`  Customers    ${customers.length}`);
  console.log(`  Vendors      ${vendors.length}`);
  console.log(`  Invoices     ${invoices.length} (${paidInvoices} paid, ${draftInvoices} draft)`);
  console.log(`  Payments     ${payments.length}`);
  console.log(
    `  Journal      ${entries.pagination.totalEntries} entries (${entries.data.filter((e) => e.status === "POSTED").length} shown as posted)`
  );
  console.log("");
  console.log(`  Invoiced     ${money(dashboard.invoiceTotal)}`);
  console.log(`  Paid         ${money(dashboard.paidTotal)}`);
  console.log(`  Open balance ${money(dashboard.openBalance)}`);
  console.log(
    `  Trial balance debit/credit  ${money(trial.totals.debit)} / ${money(trial.totals.credit)}`
  );
}

main().catch((error) => {
  console.error("\nSeed failed:", error.message);
  process.exitCode = 1;
});
