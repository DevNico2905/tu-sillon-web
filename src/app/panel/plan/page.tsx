import type { Metadata } from "next";
import { PantallaPronto } from "@/components/panel/pantalla-pronto";

export const metadata: Metadata = { title: "Plan" };

export default function Pagina() {
  return (
    <PantallaPronto
      titulo="Plan"
      ticket="F5"
      descripcion="Aquí vas a ver tu plan y cambiarlo. Estamos definiendo los planes nuevos."
    />
  );
}
