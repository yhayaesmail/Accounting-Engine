const state = {
  token: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  user: JSON.parse(localStorage.getItem("user") || "null"),
  company: JSON.parse(localStorage.getItem("company") || "null"),
  theme: localStorage.getItem("theme") || "light",
  accounts: [],
  customers: [],
  invoices: [],
  payments: [],
  journalEntries: [],
};

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => document.querySelectorAll(selector);
const exists = (selector) => Boolean(qs(selector));

const money = (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatName = (value) => {
  if (!value) return "Company";
  return value.split(" ").filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const initials = (value) => {
  const name = formatName(value);
  return name.split(" ").slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase() || "CO";
};

const showToast = (message) => {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2800);
};

const api = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data.data;
};

const saveSession = (result) => {
  state.token = result.tokens.accessToken;
  state.refreshToken = result.tokens.refreshToken;
  state.user = result.user;
  state.company = result.company || state.company;
  localStorage.setItem("accessToken", state.token);
  localStorage.setItem("refreshToken", state.refreshToken);
  localStorage.setItem("user", JSON.stringify(state.user));
  localStorage.setItem("company", JSON.stringify(state.company));
};

const clearSession = () => {
  state.token = null;
  state.refreshToken = null;
  state.user = null;
  state.company = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("company");
};

const formData = (form) => Object.fromEntries(new FormData(form).entries());

const setLoading = (form, isLoading) => {
  const button = form.querySelector("button[type='submit']");
  if (!button) return;
  button.disabled = isLoading;
  button.dataset.label = button.dataset.label || button.textContent;
  button.textContent = isLoading ? "Working..." : button.dataset.label;
};

const applyTheme = () => {
  document.body.dataset.theme = state.theme;
  qsa("[data-theme-icon]").forEach((item) => {
    item.textContent = state.theme === "dark" ? "Light" : "Dark";
  });
};

const toggleTheme = () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", state.theme);
  applyTheme();
};

const toggleView = () => {
  const loggedIn = Boolean(state.token);
  const companyName = formatName(state.company?.name);
  qs("#authSection").classList.toggle("hidden", loggedIn);
  qs("#appSection").classList.toggle("hidden", !loggedIn);
  qs("#logoutBtn").classList.toggle("hidden", !loggedIn);
  qs("#sessionText").textContent = loggedIn ? state.user?.email || "Logged in" : "Not logged in";
  qs("#companyNameSidebar").textContent = companyName;
  qs("#companyNameTitle").textContent = `${companyName} Overview`;
  qs("#companyInitials").textContent = initials(companyName);
};

const renderStats = (dashboard) => {
  const stats = [
    { label: "Accounts", value: dashboard.accounts, foot: "Active chart records", icon: "A" },
    { label: "Customers", value: dashboard.customers, foot: "Saved customer profiles", icon: "C" },
    { label: "Invoice Total", value: money(dashboard.invoiceTotal), foot: `${dashboard.invoices} invoices issued`, icon: "I" },
    { label: "Open Balance", value: money(dashboard.openBalance), foot: `${money(dashboard.paidTotal)} collected`, icon: "B" },
  ];
  qs("#overview").innerHTML = stats.map((item) => `
    <article class="stat-card">
      <div class="stat-top">
        <span>${item.label}</span>
        <span class="stat-icon">${item.icon}</span>
      </div>
      <div class="stat-value">${item.value}</div>
      <div class="stat-foot">${item.foot}</div>
    </article>
  `).join("");
  qs("#openBalanceText").textContent = money(dashboard.openBalance);
  qs("#workflowText").textContent = `${dashboard.accounts + dashboard.customers + dashboard.invoices} items`;
};

const fillSelect = (element, items, getLabel, emptyText) => {
  if (!element) return;
  element.innerHTML = `<option value="">${emptyText}</option>` + items.map((item) => `<option value="${item.id}">${getLabel(item)}</option>`).join("");
};

const emptyState = (text) => `<div class="empty-state">${text}</div>`;

const renderAccounts = () => {
  qs("#accountsList").innerHTML = state.accounts.length ? state.accounts.map((account) => `
    <div class="list-row">
      <div class="row-main">
        <strong>${account.code} - ${account.name}</strong>
        <span>${account.currency} account</span>
      </div>
      <span class="badge">${account.type}</span>
    </div>
  `).join("") : emptyState("Create your first account to start posting journal entries.");
  qs("#accountsCount").textContent = `${state.accounts.length} accounts`;
};

const renderInvoices = () => {
  qs("#invoicesList").innerHTML = state.invoices.length ? state.invoices.map((invoice) => {
    const paid = invoice.status === "PAID";
    return `
      <div class="list-row">
        <div class="row-main">
          <strong>${invoice.customer?.name || "Customer"} - ${money(invoice.total)}</strong>
          <span>${new Date(invoice.issuedAt).toLocaleDateString()}</span>
        </div>
        <span class="badge ${paid ? "success" : "warning"}">${invoice.status}</span>
      </div>
    `;
  }).join("") : emptyState("Invoices will appear here after you create a customer.");
  qs("#invoicesCount").textContent = `${state.invoices.length} invoices`;
};

const renderJournal = () => {
  qs("#journalList").innerHTML = state.journalEntries.length ? state.journalEntries.map((entry) => `
    <div class="list-row">
      <div class="row-main">
        <strong>${entry.description || "Journal entry"}</strong>
        <span>${new Date(entry.date).toLocaleDateString()} - ${entry.transactions.length} transactions</span>
      </div>
      <span class="badge ${entry.status === "POSTED" ? "success" : "warning"}">${entry.status}</span>
    </div>
  `).join("") : emptyState("Journal entries will appear here after you create one.");
  qs("#journalCount").textContent = `${state.journalEntries.length} entries`;
};

const renderTrialBalance = (trialBalance) => {
  qs("#trialBalance").innerHTML = trialBalance.rows.length ? trialBalance.rows.map((row) => `
    <div class="table-row">
      <strong>${row.code}</strong>
      <span>${row.name}</span>
      <span>${money(row.debit)}</span>
      <span>${money(row.credit)}</span>
    </div>
  `).join("") : emptyState("Post journal entries to build the trial balance.");
};

const renderSelects = () => {
  fillSelect(qs("#invoiceCustomer"), state.customers, (customer) => customer.name, "Choose customer");
  fillSelect(qs("#paymentInvoice"), state.invoices, (invoice) => `${invoice.customer?.name || "Invoice"} - ${money(invoice.total)}`, "Optional invoice");
  fillSelect(qs("#debitAccount"), state.accounts, (account) => `${account.code} - ${account.name}`, "Debit account");
  fillSelect(qs("#creditAccount"), state.accounts, (account) => `${account.code} - ${account.name}`, "Credit account");
};

const loadData = async () => {
  if (!state.token) return;
  const [dashboard, accounts, customers, invoices, payments, journalResult, trialBalance] = await Promise.all([
    api("/api/reports/dashboard"),
    api("/api/accounts"),
    api("/api/customers"),
    api("/api/invoices"),
    api("/api/payments"),
    api("/api/journal"),
    api("/api/reports/trial-balance"),
  ]);
  state.accounts = accounts;
  state.customers = customers;
  state.invoices = invoices;
  state.payments = payments;
  state.journalEntries = journalResult.data || [];
  renderStats(dashboard);
  renderSelects();
  renderAccounts();
  renderInvoices();
  renderJournal();
  renderTrialBalance(trialBalance);
};

qsa("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    qsa("[data-auth-tab]").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    const isLogin = button.dataset.authTab === "login";
    qs("#loginForm").classList.toggle("hidden", !isLogin);
    qs("#registerForm").classList.toggle("hidden", isLogin);
  });
});

qsa("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", toggleTheme);
});

qsa(".nav-list a").forEach((link) => {
  link.addEventListener("click", () => {
    qsa(".nav-list a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

qs("#registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(event.target, true);
  try {
    const payload = formData(event.target);
    const result = await api("/api/auth/register-company", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    result.company = result.company || { name: payload.companyName };
    saveSession(result);
    toggleView();
    await loadData();
    showToast("Company created successfully");
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(event.target, false);
  }
});

qs("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(event.target, true);
  try {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(formData(event.target)),
    });
    saveSession(result);
    toggleView();
    await loadData();
    showToast("Logged in successfully");
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(event.target, false);
  }
});

qs("#logoutBtn").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {}
  clearSession();
  toggleView();
});

qs("#accountForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(event.target, true);
  try {
    await api("/api/accounts", {
      method: "POST",
      body: JSON.stringify(formData(event.target)),
    });
    event.target.reset();
    event.target.currency.value = "USD";
    await loadData();
    showToast("Account added");
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(event.target, false);
  }
});

qs("#customerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(event.target, true);
  try {
    await api("/api/customers", {
      method: "POST",
      body: JSON.stringify(formData(event.target)),
    });
    event.target.reset();
    await loadData();
    showToast("Customer added");
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(event.target, false);
  }
});

qs("#invoiceForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(event.target, true);
  try {
    const data = formData(event.target);
    data.total = Number(data.total);
    await api("/api/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
    event.target.reset();
    await loadData();
    showToast("Invoice created");
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(event.target, false);
  }
});

qs("#paymentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(event.target, true);
  try {
    const data = formData(event.target);
    data.amount = Number(data.amount);
    data.invoiceId = data.invoiceId || null;
    await api("/api/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    event.target.reset();
    event.target.method.value = "Cash";
    await loadData();
    showToast("Payment recorded");
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(event.target, false);
  }
});

qs("#journalForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(event.target, true);
  try {
    const amount = Number(qs("#journalAmount").value);
    await api("/api/journal", {
      method: "POST",
      body: JSON.stringify({
        description: event.target.description.value,
        transactions: [
          { accountId: qs("#debitAccount").value, debit: amount },
          { accountId: qs("#creditAccount").value, credit: amount },
        ],
      }),
    });
    event.target.reset();
    await loadData();
    showToast("Journal entry created");
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(event.target, false);
  }
});

applyTheme();
toggleView();
loadData().catch((error) => showToast(error.message));
