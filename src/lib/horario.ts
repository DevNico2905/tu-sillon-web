import { sumarDias } from "./formato";

/**
 * Horario del salón en el front (SPEC-WEB §5.1, backend R42).
 * El front no decide qué horas hay libres: eso lo calcula la API. Aquí solo se
 * muestra si el salón está abierto ahora y qué días se pueden elegir.
 */

export interface HorarioSalon {
  horaApertura: string; // "08:00:00"
  horaCierre: string; // "19:00:00"
  abreDomingos: boolean;
}

/** Colombia no tiene horario de verano: siempre UTC−5. */
const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000;

/** Día y hora de Bogotá de un instante, sin depender de la zona del dispositivo. */
export function momentoEnBogota(ahora: Date): { fecha: string; hora: string; diaSemana: number } {
  const bogota = new Date(ahora.getTime() + DESFASE_BOGOTA_MS);
  const iso = bogota.toISOString();
  return { fecha: iso.slice(0, 10), hora: iso.slice(11, 19), diaSemana: bogota.getUTCDay() };
}

export function esDomingo(fecha: string): boolean {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay() === 0;
}

export function atiendeElDia(horario: HorarioSalon, fecha: string): boolean {
  return horario.abreDomingos || !esDomingo(fecha);
}

/** Abierto si hoy atiende y la hora está entre la apertura (incluida) y el cierre (excluido). */
export function estaAbierto(horario: HorarioSalon, ahora: Date): boolean {
  const { fecha, hora } = momentoEnBogota(ahora);
  if (!atiendeElDia(horario, fecha)) return false;
  return hora >= normalizarHora(horario.horaApertura) && hora < normalizarHora(horario.horaCierre);
}

/** Los próximos `cantidad` días desde hoy, marcando los que el salón no atiende. */
export function proximosDias(
  horario: HorarioSalon,
  hoy: string,
  cantidad = 14,
): { fecha: string; atiende: boolean }[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = sumarDias(hoy, i);
    return { fecha, atiende: atiendeElDia(horario, fecha) };
  });
}

/** "8:00" o "08:00" → "08:00:00", para comparar horas como texto. */
export function normalizarHora(hora: string): string {
  const [h = "0", m = "0", s = "0"] = hora.split(":");
  return [h, m, s].map((parte) => parte.padStart(2, "0")).join(":");
}

/** "10:30:00" → "10:30", la forma corta que viaja en la URL. */
export function horaCorta(hora: string): string {
  return normalizarHora(hora).slice(0, 5);
}
