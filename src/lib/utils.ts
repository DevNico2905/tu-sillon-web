import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Une clases de Tailwind resolviendo conflictos ("px-2 px-4" → "px-4"). Convención de shadcn/ui. */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas));
}
