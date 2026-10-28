import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Kaushan_Script, Libre_Franklin } from "next/font/google";
import { SessionProvider } from "@/lib/session";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-libre-franklin",
});

const kaushanScript = Kaushan_Script({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-kaushan-script",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Accounting Engine",
    template: "%s · Accounting Engine",
  },
  description:
    "A focused workspace for accounts, invoices, payments, and double-entry bookkeeping.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F5EF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${libreFranklin.variable} ${kaushanScript.variable} ${plexMono.variable}`}>
      <body>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
