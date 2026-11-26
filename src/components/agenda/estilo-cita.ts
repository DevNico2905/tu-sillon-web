import type { EstadoCita } from "@/api/tipos";

/**
 * Colores por estado (SPEC-WEB §4.2). Nunca solo color (§4.5): cada bloque lleva
 * su texto de estado y "Por confirmar" además tiene borde punteado.
 */
export const ESTILO_ESTADO: Record<EstadoCita, string> = {
  PENDIENTE: "border border-dashed border-aviso bg-aviso-fondo text-aviso",
  CONFIRMADA: "border-l-4 border-acento bg-acento-suave text-texto",
  COMPLETADA: "bg-completada text-texto-2",
  CANCELADA: "bg-completada text-texto-2 line-through opacity-70",
  NO_ASISTIO: "bg-peligro-fondo text-peligro",
};

export const ESTILO_ETIQUETA: Record<EstadoCita, string> = {
  PENDIENTE: "bg-aviso-fondo text-aviso",
  CONFIRMADA: "bg-acento-suave text-acento",
  COMPLETADA: "bg-completada text-texto-2",
  CANCELADA: "bg-completada text-texto-2",
  NO_ASISTIO: "bg-peligro-fondo text-peligro",
};
