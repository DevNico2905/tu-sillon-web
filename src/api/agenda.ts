import { peticion } from "./cliente";
import type { Cita, EstadoCita, Recordatorio, SolicitudReserva } from "./tipos";

/** Endpoints de la agenda del panel (SPEC-WEB §5.6). Requieren sesión. */

/** Citas del día. El estilista recibe solo las suyas: el backend filtra. */
export function listarCitas(fecha: string, senal?: AbortSignal): Promise<Cita[]> {
  return peticion<Cita[]>("/api/citas", { consulta: { fecha }, senal });
}

export function cambiarEstadoCita(id: number, estado: EstadoCita): Promise<Cita> {
  return peticion<Cita>(`/api/citas/${id}/estado`, { metodo: "PATCH", cuerpo: { estado } });
}

/** Cita creada desde el salón: nace CONFIRMADA (solo DUENO). */
export function crearCita(solicitud: SolicitudReserva): Promise<Cita> {
  return peticion<Cita>("/api/citas", { metodo: "POST", cuerpo: solicitud });
}

/** Borrador del recordatorio redactado por la IA (solo DUENO). Sillón no lo envía. */
export function redactarRecordatorio(id: number): Promise<Recordatorio> {
  return peticion<Recordatorio>(`/api/citas/${id}/recordatorio`, { metodo: "POST" });
}
