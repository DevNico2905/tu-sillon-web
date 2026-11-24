import type { ReactNode } from "react";

/** Cabecera común de las pantallas del panel. */
export function CabeceraPanel({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-1 px-5 pt-8 pb-4 md:px-8">
      <h1 className="text-titulo font-bold">{titulo}</h1>
      {children}
    </header>
  );
}

/** Sección del menú que llega en un ticket posterior (F3 a F6). */
export function PantallaPronto({
  titulo,
  ticket,
  descripcion,
}: {
  titulo: string;
  ticket: string;
  descripcion: string;
}) {
  return (
    <>
      <CabeceraPanel titulo={titulo} />
      <div className="px-5 md:px-8">
        <div className="flex flex-col gap-1 rounded-grupo bg-superficie p-5">
          <p className="text-destacado font-semibold">Pronto</p>
          <p className="text-cuerpo text-texto-2">{descripcion}</p>
          <p className="pt-2 text-nota text-texto-2">Llega con el ticket {ticket}.</p>
        </div>
      </div>
    </>
  );
}
