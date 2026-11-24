import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Lista agrupada (SPEC-WEB §4.1): rótulo gris arriba y filas separadas por una línea fina. */
export function Grupo({
  rotulo,
  id,
  children,
  className,
}: {
  rotulo?: string;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-label={rotulo} className={cn("flex scroll-mt-6 flex-col gap-2", className)}>
      {rotulo && <h2 className="px-4 text-rotulo font-medium text-texto-2">{rotulo}</h2>}
      <div className="overflow-hidden rounded-grupo bg-superficie">{children}</div>
    </section>
  );
}

/** Fila de un grupo con etiqueta a la izquierda y valor a la derecha. */
export function FilaDato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-separador px-4 py-3 last:border-0">
      <dt className="text-cuerpo text-texto-2">{etiqueta}</dt>
      <dd className="text-right text-cuerpo font-medium">{children}</dd>
    </div>
  );
}
