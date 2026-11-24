import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge no conoce la escala tipográfica propia (globals.css): sin esto
// trataría "text-cuerpo" como un color y lo borraría al lado de "text-acento".
const unir = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["titulo-grande", "titulo", "seccion", "destacado", "cuerpo", "rotulo", "nota"] },
      ],
    },
  },
});

/** Une clases de Tailwind resolviendo conflictos ("px-2 px-4" → "px-4"). Convención de shadcn/ui. */
export function cn(...entradas: ClassValue[]): string {
  return unir(clsx(entradas));
}
