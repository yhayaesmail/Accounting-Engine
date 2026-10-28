export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type EntryStatus = "DRAFT" | "POSTED";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

export type Role = "SUPER_ADMIN" | "COMPANY_ADMIN" | "USER";

export interface Company {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  company: Company | null;
  tokens: Tokens;
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
}

export interface Session {
  user: User;
  company: Company | null;
  accessToken: string;
  refreshToken: string;
}

export interface Account {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  currency: string;
  parentId: string | null;
  createdAt: string;
  children?: Account[];
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
  invoices?: Invoice[];
}

export interface CustomerDetail extends Customer {
  invoices: Invoice[];
}

export interface Vendor {
  id: string;
  name: string;
  contact: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  createdAt: string;
  invoiceId: string | null;
  invoice?: Invoice | null;
  deletedAt?: string | null;
}

export interface Invoice {
  id: string;
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
  createdAt?: string;
  deletedAt?: string | null;
  customerId: string;
  customer: Customer;
  payments: Payment[];
}

export interface JournalTransaction {
  id: string;
  debit: number;
  credit: number;
  type: "DEBIT" | "CREDIT" | string;
  accountId: string;
  journalId: string;
  createdAt?: string;
}

export interface JournalEntry {
  id: string;
  description: string;
  date: string;
  status: EntryStatus;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
  transactions: JournalTransaction[];
}

export interface JournalPagination {
  page: number;
  limit: number;
  totalEntries: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface JournalList {
  data: JournalEntry[];
  pagination: JournalPagination;
}

export interface DashboardData {
  accounts: number;
  customers: number;
  vendors: number;
  journalEntries: number;
  invoices: number;
  invoiceTotal: number;
  paidTotal: number;
  openBalance: number;
}

export interface TrialBalanceRow {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceData {
  rows: TrialBalanceRow[];
  totals: {
    debit: number;
    credit: number;
  };
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
