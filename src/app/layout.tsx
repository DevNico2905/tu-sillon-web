import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Proveedores } from "./proveedores";
import "./globals.css";

// Inter variable, servida desde el repo: no depende de Google Fonts al compilar.
const inter = localFont({
  src: "../fonts/inter-latin-variable.woff2",
  variable: "--fuente-inter",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Sillón", template: "%s · Sillón" },
  description: "Reserva tu cita en tu barbería o salón de belleza.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function LayoutRaiz({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <Proveedores>{children}</Proveedores>
      </body>
    </html>
  );
}
