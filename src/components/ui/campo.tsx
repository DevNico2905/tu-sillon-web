import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Campo de formulario dentro de un grupo: etiqueta, control y error debajo (SPEC-WEB §4.5). */
export function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-separador px-4 py-3 last:border-0">
      <label htmlFor={id} className="text-rotulo font-medium text-texto-2">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-nota text-peligro">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-nota text-texto-2">{ayuda}</p>
      )}
    </div>
  );
}

export const clasesControl =
  "w-full bg-transparent text-destacado text-texto outline-none placeholder:text-texto-2/70";

export function Entrada({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(clasesControl, "min-h-8", className)} {...props} />;
}

export function AreaTexto({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(clasesControl, "min-h-16 resize-none", className)} {...props} />;
}
