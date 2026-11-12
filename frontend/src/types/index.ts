export type Role = "SUPER_ADMIN" | "COMPANY_ADMIN" | "USER";
export type EntryStatus = "DRAFT" | "POSTED";
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface User {
  id: string;
  email: string;
  role: Role;
  companyId: string | null;
  company?: Company;
  createdAt: string;
  deletedAt: string | null;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface Account {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  currency: string;
  companyId: string;
  parentId: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  companyId: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string | null;
  companyId: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface Invoice {
  id: string;
  total: number;
  status: string;
  issuedAt: string;
  companyId: string;
  customerId: string;
  customer?: Customer;
  deletedAt: string | null;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  createdAt: string;
  companyId: string;
  invoiceId: string | null;
  deletedAt: string | null;
}

export interface VendorBill {
  id: string;
  total: number;
  status: string;
  issuedAt: string;
  companyId: string;
  vendorId: string;
  vendor?: Vendor;
  createdAt: string;
  deletedAt: string | null;
}

export interface Transaction {
  id: string;
  debit: number;
  credit: number;
  type: string;
  accountId: string;
  journalId: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface JournalEntry {
  id: string;
  description: string;
  date: string;
  status: EntryStatus;
  referenceId: string | null;
  referenceType: string | null;
  companyId: string;
  userId: string;
  createdAt: string;
  deletedAt: string | null;
  transactions: Transaction[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthSession {
  success?: boolean;
  user: AuthUser;
  company: Company | null;
  tokens: AuthTokens;
}

export interface RefreshResult {
  success?: boolean;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  companyName: string;
  email: string;
  password: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalEntries: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DashboardMetrics {
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

export interface TrialBalance {
  rows: TrialBalanceRow[];
  totals: {
    debit: number;
    credit: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
}
