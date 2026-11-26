import { cn } from "@/lib/utils";

/** Interruptor sí/no (role="switch"). Fila completa tocable dentro de un grupo. */
export function Interruptor({
  id,
  etiqueta,
  ayuda,
  activo,
  alCambiar,
  deshabilitado,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  activo: boolean;
  alCambiar: (activo: boolean) => void;
  deshabilitado?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-separador px-4 py-3 last:border-0">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-cuerpo font-medium">
          {etiqueta}
        </label>
        {ayuda && <p className="text-nota text-texto-2">{ayuda}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={activo}
        disabled={deshabilitado}
        onClick={() => alCambiar(!activo)}
        className={cn(
          "relative inline-flex h-8 w-13 shrink-0 items-center rounded-full transition-colors disabled:opacity-40",
          activo ? "bg-exito" : "bg-superficie-2",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-7 rounded-full bg-white shadow transition-transform",
            activo ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
