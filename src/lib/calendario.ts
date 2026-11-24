/**
 * Archivo .ics para "Al calendario" (SPEC-WEB §5.3).
 * Las horas van con zona America/Bogota y un VTIMEZONE fijo en UTC−5
 * (Colombia no tiene horario de verano), así el calendario del celular
 * la muestra bien aunque el teléfono esté en otra zona.
 */

export interface EventoCita {
  id: number | string;
  inicio: string; // "2026-11-23T10:30:00", hora de Bogotá
  fin: string;
  titulo: string;
  lugar: string;
  descripcion?: string;
}

function fechaIcs(fechaHora: string): string {
  return fechaHora.replace(/[-:]/g, "").slice(0, 15); // 20261123T103000
}

/** Escapa los caracteres especiales de un texto de iCalendar (RFC 5545 §3.3.11). */
export function escaparIcs(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function crearIcs(evento: EventoCita, creado: Date = new Date()): string {
  const marca = creado.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sillon//Reservas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:America/Bogota",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0500",
    "TZNAME:-05",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:cita-${evento.id}@sillon.nick-bern.com`,
    `DTSTAMP:${marca}`,
    `DTSTART;TZID=America/Bogota:${fechaIcs(evento.inicio)}`,
    `DTEND;TZID=America/Bogota:${fechaIcs(evento.fin)}`,
    `SUMMARY:${escaparIcs(evento.titulo)}`,
    `LOCATION:${escaparIcs(evento.lugar)}`,
    ...(evento.descripcion ? [`DESCRIPTION:${escaparIcs(evento.descripcion)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lineas.join("\r\n") + "\r\n";
}

/** Enlace de Google Maps para "Cómo llegar". */
export function enlaceMapa(direccion: string, ciudad: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${direccion}, ${ciudad}`)}`;
}
