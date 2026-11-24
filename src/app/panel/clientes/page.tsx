import type { Metadata } from "next";
import { PantallaPronto } from "@/components/panel/pantalla-pronto";

export const metadata: Metadata = { title: "Clientes" };

export default function Pagina() {
  return (
    <PantallaPronto
      titulo="Clientes"
      ticket="F4"
      descripcion="Aquí verás la lista de clientes que han reservado en tu salón."
    />
  );
}
