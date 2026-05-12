import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./modules/auth/auth.routes.js";
import accountRoutes from "./modules/accounts/account.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import vendorRoutes from "./modules/vendors/vendor.routes.js";
import invoiceRoutes from "./modules/invoices/invoice.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import journalRoutes from "./modules/journal/journal.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "../frontend");

app.use(express.json());
app.use(express.static(frontendPath));
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/reports', reportRoutes);
app.use(errorHandler);

export default app;
