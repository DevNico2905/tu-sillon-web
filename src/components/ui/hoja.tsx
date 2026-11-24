"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Hoja modal sobre la página (SPEC-WEB §4.5): en celular sube desde abajo y en
 * escritorio queda centrada. Usa <dialog> nativo, que atrapa el foco y se
 * cierra con Escape sin código extra.
 */
export function Hoja({
  abierta,
  alCerrar,
  titulo,
  children,
  className,
}: {
  abierta: boolean;
  alCerrar: () => void;
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (abierta && !elemento.open) elemento.showModal();
    if (!abierta && elemento.open) elemento.close();
  }, [abierta]);

  return (
    <dialog
      ref={dialogo}
      aria-label={titulo}
      onClose={alCerrar}
      onClick={(evento) => {
        // Un clic en el fondo (fuera del contenido) cierra la hoja.
        if (evento.target === evento.currentTarget) alCerrar();
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-grupo bg-fondo p-0 text-texto backdrop:bg-black/40",
        "md:m-auto md:max-h-[80dvh] md:max-w-lg md:rounded-grupo",
        className,
      )}
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-center justify-between border-b border-separador px-5 py-3">
          <h2 className="text-destacado font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={alCerrar}
            className="-mr-2 min-h-11 min-w-11 rounded-control text-cuerpo text-acento"
          >
            Cerrar
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
