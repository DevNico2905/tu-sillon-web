import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Botón base (patrón de shadcn/ui, adaptado a los tokens de SPEC-WEB §4).
 * Todo botón mide al menos 44 px de alto (área tocable, §4.3).
 */
const variantesBoton = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-destacado font-semibold transition-opacity select-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variante: {
        principal: "bg-acento text-white hover:opacity-90 active:opacity-80",
        secundario: "bg-superficie-2 text-texto hover:opacity-80",
        texto: "px-2 text-acento hover:opacity-70",
        peligro: "bg-peligro-fondo text-peligro hover:opacity-80",
      },
      ancho: {
        normal: "",
        completo: "w-full",
      },
    },
    defaultVariants: { variante: "principal", ancho: "normal" },
  },
);

export interface PropsBoton extends ComponentProps<"button">, VariantProps<typeof variantesBoton> {
  /** Renderiza el hijo (por ejemplo un <a>) con el estilo del botón. */
  comoHijo?: boolean;
}

export function Boton({ className, variante, ancho, comoHijo = false, ...props }: PropsBoton) {
  const Componente = comoHijo ? Slot : "button";
  return <Componente className={cn(variantesBoton({ variante, ancho }), className)} {...props} />;
}
