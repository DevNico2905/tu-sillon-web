import type { Metadata } from "next";
import { PantallaPronto } from "@/components/panel/pantalla-pronto";

export const metadata: Metadata = { title: "Solicitudes" };

export default function Pagina() {
  return (
    <PantallaPronto
      titulo="Solicitudes"
      ticket="F6"
      descripcion="Aquí verás los mensajes del chat que necesitan a una persona del salón."
    />
  );
}
