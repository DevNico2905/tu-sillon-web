import { Boton } from "@/components/ui/boton";

/** Esqueleto mientras carga una lista del panel. */
export function CargandoLista({ filas = 3 }: { filas?: number }) {
  return (
    <div aria-busy="true" aria-label="Cargando" className="overflow-hidden rounded-grupo bg-superficie">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-separador px-4 py-4 last:border-0">
          <div className="h-4 w-1/3 animate-pulse rounded bg-superficie-2" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-superficie-2" />
        </div>
      ))}
    </div>
  );
}

export function FalloCarga({ mensaje, alReintentar }: { mensaje: string; alReintentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-grupo bg-superficie p-5">
      <p className="text-cuerpo">{mensaje}</p>
      <Boton variante="secundario" onClick={alReintentar}>
        Reintentar
      </Boton>
    </div>
  );
}

/** Mensaje vacío de una lista, con una acción opcional. */
export function ListaVacia({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-grupo bg-superficie p-5">
      <p className="text-destacado font-semibold">{titulo}</p>
      <p className="text-cuerpo text-texto-2">{texto}</p>
      {children}
    </div>
  );
}
