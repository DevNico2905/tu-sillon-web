import type { Metadata } from "next";
import { PantallaPronto } from "@/components/panel/pantalla-pronto";

export const metadata: Metadata = { title: "Equipo" };

export default function Pagina() {
  return (
    <PantallaPronto
      titulo="Equipo"
      ticket="F4"
      descripcion="Aquí vas a agregar a tus barberos y elegir qué servicios hace cada uno."
    />
  );
}
