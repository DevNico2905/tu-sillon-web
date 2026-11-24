/** "Barbería Don Juan" → "BD". Para el monograma del salón y los avatares de barberos. */
export function iniciales(nombre: string, maximo = 2): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maximo)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join("");
}

/** Primer nombre: "Ana María Pérez" → "Ana". */
export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}
