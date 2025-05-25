import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardWrapper from "./dashboardWrapper";
import Script from "next/script"; // Added this import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Espace intranet gestion des equipements",
  description: "Espace intranet gestion des equipements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
       {/* <Script
          src="/cookie-helper.js"
          strategy="beforeInteractive"
          id="cookie-helper"
        />*/}
      </head>
      <body className={inter.className}>
        <DashboardWrapper>{children}</DashboardWrapper>
      </body>
    </html>
  );
}
