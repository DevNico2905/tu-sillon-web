import type { Metadata } from "next";
import { PantallaPronto } from "@/components/panel/pantalla-pronto";

export const metadata: Metadata = { title: "Servicios" };

export default function Pagina() {
  return (
    <PantallaPronto
      titulo="Servicios"
      ticket="F4"
      descripcion="Aquí vas a crear y editar los servicios que ofreces, con su duración y su precio."
    />
  );
}
