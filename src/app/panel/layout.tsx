import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MarcoPanel } from "@/components/panel/marco-panel";
import { ProveedorSesion } from "@/sesion/proveedor-sesion";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Sillón" },
  robots: { index: false },
};

/** Todo /panel exige sesión (S2, S7). */
export default function LayoutPanel({ children }: { children: ReactNode }) {
  return (
    <ProveedorSesion>
      <MarcoPanel>{children}</MarcoPanel>
    </ProveedorSesion>
  );
}
