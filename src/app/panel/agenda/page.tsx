import type { Metadata } from "next";
import { Suspense } from "react";
import { Bienvenida } from "@/components/panel/bienvenida";
import { PantallaPronto } from "@/components/panel/pantalla-pronto";

export const metadata: Metadata = { title: "Agenda" };

export default function PaginaAgenda() {
  return (
    <>
      <Suspense>
        <Bienvenida />
      </Suspense>
      <PantallaPronto
        titulo="Agenda"
        ticket="F3"
        descripcion="Aquí verás las citas del día, por barbero, y podrás confirmarlas o marcarlas como completadas."
      />
    </>
  );
}
