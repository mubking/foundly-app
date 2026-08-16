import { connection } from "next/server";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Foundly Admin",
  description: "Foundly admin dashboard",
};

// Nonce-based CSP (see src/proxy.js) requires dynamic rendering: the nonce
// is per-request, so the framework's bootstrap script/style tags can only
// carry it if pages are rendered at request time, not prebuilt statically.
// Every admin page fetches its actual data client-side anyway (see AuthContext
// and lib/api.js), so this only changes when the HTML shell is generated,
// not what data it can show.
export default async function RootLayout({ children }) {
  await connection();
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
