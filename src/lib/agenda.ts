import type { Cita, EstadoCita, Rol } from "@/api/tipos";
import { normalizarHora } from "./horario";

/**
 * Reglas de presentación de la agenda (SPEC-WEB §5.6). Las transiciones las
 * decide el backend (EstadoCita.puedeCambiarA); aquí solo se ofrecen los
 * botones que el backend va a aceptar, para no mostrar acciones imposibles.
 */

export const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  PENDIENTE: "Por confirmar",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
  NO_ASISTIO: "No asistió",
};

/** Texto del botón que lleva a cada estado. */
export const ACCION_HACIA: Record<EstadoCita, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmar",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelar",
  NO_ASISTIO: "No asistió",
};

const TRANSICIONES: Record<EstadoCita, EstadoCita[]> = {
  PENDIENTE: ["CONFIRMADA", "CANCELADA"],
  CONFIRMADA: ["COMPLETADA", "NO_ASISTIO", "CANCELADA"],
  COMPLETADA: [],
  CANCELADA: [],
  NO_ASISTIO: [],
};

/** El estilista solo marca sus citas como completada o no asistió. */
const DESTINOS_DEL_ESTILISTA: EstadoCita[] = ["COMPLETADA", "NO_ASISTIO"];

export function accionesPermitidas(estado: EstadoCita, rol: Rol): EstadoCita[] {
  const posibles = TRANSICIONES[estado];
  return rol === "ESTILISTA" ? posibles.filter((d) => DESTINOS_DEL_ESTILISTA.includes(d)) : posibles;
}

/** Recordatorio solo para citas que siguen en pie (SPEC-WEB §5.6) y solo para el dueño. */
export function puedeRecordar(estado: EstadoCita, rol: Rol): boolean {
  return rol === "DUENO" && (estado === "PENDIENTE" || estado === "CONFIRMADA");
}

export interface CifrasDia {
  citas: number;
  porConfirmar: number;
  ingresosEsperados: number;
  completadas: number;
  valorCompletadas: number;
}

/** Cifras de la cabecera. "Citas hoy" cuenta todas, como dice la SPEC. */
export function cifrasDelDia(citas: Cita[]): CifrasDia {
  const suma = (estados: EstadoCita[]) =>
    citas.filter((c) => estados.includes(c.estado)).reduce((total, c) => total + c.precio, 0);
  return {
    citas: citas.length,
    porConfirmar: citas.filter((c) => c.estado === "PENDIENTE").length,
    ingresosEsperados: suma(["PENDIENTE", "CONFIRMADA", "COMPLETADA"]),
    completadas: citas.filter((c) => c.estado === "COMPLETADA").length,
    valorCompletadas: suma(["COMPLETADA"]),
  };
}

/** "2026-11-23T10:30:00" o "10:30:00" → minutos desde la medianoche. */
export function minutosDelDia(valor: string): number {
  const hora = valor.includes("T") ? valor.slice(11, 19) : normalizarHora(valor);
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export const PIXELES_POR_HORA = 64;

/** Posición vertical de un bloque en la línea de tiempo, desde la apertura del salón. */
export function posicionEnLinea(
  inicio: string,
  fin: string,
  apertura: string,
): { arriba: number; alto: number } {
  const base = minutosDelDia(apertura);
  const desde = minutosDelDia(inicio) - base;
  const hasta = minutosDelDia(fin) - base;
  const porMinuto = PIXELES_POR_HORA / 60;
  return { arriba: desde * porMinuto, alto: Math.max((hasta - desde) * porMinuto, 22) };
}

/** Horas en punto entre la apertura y el cierre, para las marcas de la línea de tiempo. */
export function horasDelDia(apertura: string, cierre: string): number[] {
  const desde = Math.floor(minutosDelDia(apertura) / 60);
  const hasta = Math.ceil(minutosDelDia(cierre) / 60);
  return Array.from({ length: Math.max(hasta - desde, 0) + 1 }, (_, i) => desde + i);
}

/** Enlace para abrir WhatsApp con el mensaje escrito. wa.me pide el número solo con dígitos. */
export function enlaceWhatsapp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
}
