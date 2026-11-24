import type { Metadata } from "next";
import { PantallaPronto } from "@/components/panel/pantalla-pronto";

export const metadata: Metadata = { title: "Configuración" };

export default function Pagina() {
  return (
    <PantallaPronto
      titulo="Configuración"
      ticket="F4"
      descripcion="Aquí vas a cambiar el horario y los datos de tu salón."
    />
  );
}
