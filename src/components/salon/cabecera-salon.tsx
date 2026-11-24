import type { Catalogo } from "@/api/tipos";
import { iniciales } from "@/lib/texto";
import { ChatSalon } from "./chat-salon";
import { EstadoAbierto } from "./estado-abierto";

/** Cabecera de la página pública: el salón es el protagonista (SPEC-WEB §4.1, §5.1). */
export function CabeceraSalon({ catalogo }: { catalogo: Catalogo }) {
  return (
    <header className="flex items-start gap-4">
      <div
        aria-hidden
        className="flex size-16 shrink-0 items-center justify-center rounded-grupo bg-texto text-seccion font-bold text-fondo"
      >
        {iniciales(catalogo.nombre)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="text-titulo font-bold break-words">{catalogo.nombre}</h1>
        <p className="text-cuerpo text-texto-2">
          {catalogo.ciudad} · <EstadoAbierto horario={catalogo} />
        </p>
        <p className="text-nota text-texto-2">{catalogo.horario}</p>
      </div>
      <ChatSalon slug={catalogo.slug} salonNombre={catalogo.nombre} telefono={catalogo.telefono} />
    </header>
  );
}

export function EsqueletoSalon() {
  return (
    <div aria-busy="true" aria-label="Cargando el salón" className="flex animate-pulse flex-col gap-8">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-grupo bg-superficie-2" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-7 w-2/3 rounded-control bg-superficie-2" />
          <div className="h-4 w-1/3 rounded-control bg-superficie-2" />
        </div>
      </div>
      <div className="h-48 rounded-grupo bg-superficie" />
      <div className="h-24 rounded-grupo bg-superficie" />
      <div className="h-40 rounded-grupo bg-superficie" />
    </div>
  );
}
