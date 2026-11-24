import type { Catalogo } from "@/api/tipos";
import { atiendeElDia, horaCorta, proximosDias } from "./horario";

/**
 * La selección de la reserva vive en la URL (SPEC-WEB §5.1):
 * ?servicio=3&barbero=7&fecha=2026-11-23&hora=10:30
 * Así se puede compartir el enlace y "Atrás" funciona.
 *
 * `barbero` ausente o "cualquiera" significa que la API asigna uno libre (R40).
 */

export const CUALQUIERA = "cualquiera" as const;

export interface Seleccion {
  servicioId: number | null;
  barbero: number | typeof CUALQUIERA;
  fecha: string;
  hora: string | null; // "10:30"
}

type LectorParametros = Pick<URLSearchParams, "get">;

function entero(valor: string | null): number | null {
  if (!valor || !/^\d+$/.test(valor)) return null;
  return Number(valor);
}

/**
 * Lee la URL y la ajusta al catálogo: descarta lo que no existe o no encaja
 * y completa lo que tiene un valor obvio (un único servicio, el primer día abierto).
 */
export function leerSeleccion(parametros: LectorParametros, catalogo: Catalogo, hoy: string): Seleccion {
  const servicios = catalogo.servicios;
  let servicioId = entero(parametros.get("servicio"));
  if (!servicios.some((s) => s.id === servicioId)) servicioId = null;
  if (servicioId === null && servicios.length === 1) servicioId = servicios[0].id;

  let barbero: Seleccion["barbero"] = CUALQUIERA;
  const barberoId = entero(parametros.get("barbero"));
  if (barberoId !== null && servicioId !== null) {
    const estilista = catalogo.estilistas.find((e) => e.id === barberoId);
    if (estilista?.servicioIds.includes(servicioId)) barbero = barberoId;
  }

  const dias = proximosDias(catalogo, hoy);
  const pedida = parametros.get("fecha");
  const fechaValida = dias.find((d) => d.fecha === pedida && d.atiende);
  const fecha = fechaValida?.fecha ?? dias.find((d) => d.atiende)?.fecha ?? hoy;

  const horaPedida = parametros.get("hora");
  const hora = horaPedida && /^\d{2}:\d{2}$/.test(horaPedida) ? horaPedida : null;

  return { servicioId, barbero, fecha, hora: servicioId === null ? null : hora };
}

/** Convierte la selección en los parámetros de la URL, sin los valores por defecto. */
export function aParametros(seleccion: Seleccion): URLSearchParams {
  const parametros = new URLSearchParams();
  if (seleccion.servicioId !== null) parametros.set("servicio", String(seleccion.servicioId));
  if (seleccion.barbero !== CUALQUIERA) parametros.set("barbero", String(seleccion.barbero));
  parametros.set("fecha", seleccion.fecha);
  if (seleccion.hora) parametros.set("hora", seleccion.hora);
  return parametros;
}

/**
 * Reglas al cambiar la selección (SPEC-WEB §5.1):
 * - cambiar el servicio borra el barbero si no lo ofrece;
 * - cambiar el servicio, el barbero o la fecha borra la hora.
 */
export function cambiarServicio(seleccion: Seleccion, servicioId: number, catalogo: Catalogo): Seleccion {
  const barberoSigue =
    seleccion.barbero === CUALQUIERA ||
    catalogo.estilistas.some((e) => e.id === seleccion.barbero && e.servicioIds.includes(servicioId));
  return {
    ...seleccion,
    servicioId,
    barbero: barberoSigue ? seleccion.barbero : CUALQUIERA,
    hora: seleccion.servicioId === servicioId ? seleccion.hora : null,
  };
}

export function cambiarBarbero(seleccion: Seleccion, barbero: Seleccion["barbero"]): Seleccion {
  return { ...seleccion, barbero, hora: seleccion.barbero === barbero ? seleccion.hora : null };
}

export function cambiarFecha(seleccion: Seleccion, fecha: string, catalogo: Catalogo): Seleccion {
  if (!atiendeElDia(catalogo, fecha)) return seleccion;
  return { ...seleccion, fecha, hora: seleccion.fecha === fecha ? seleccion.hora : null };
}

export function cambiarHora(seleccion: Seleccion, hora: string): Seleccion {
  return { ...seleccion, hora: horaCorta(hora) };
}

/** Los barberos que ofrecen el servicio, en el orden del catálogo (por nombre). */
export function barberosDelServicio(catalogo: Catalogo, servicioId: number | null) {
  if (servicioId === null) return [];
  return catalogo.estilistas.filter((e) => e.servicioIds.includes(servicioId));
}

/** "2026-11-23" + "10:30" → "2026-11-23T10:30:00", la hora local de Bogotá que espera la API. */
export function inicioDeCita(fecha: string, hora: string): string {
  return `${fecha}T${horaCorta(hora)}:00`;
}
