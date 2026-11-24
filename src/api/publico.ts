import { peticion } from "./cliente";
import type { Catalogo, Cita, Disponibilidad, RespuestaChat, SolicitudChat, SolicitudReserva } from "./tipos";

/** Endpoints públicos del salón (sin sesión). SPEC-WEB §5.1–5.4. */

function ruta(slug: string, resto = ""): string {
  return `/api/publico/salones/${encodeURIComponent(slug)}${resto}`;
}

export function obtenerCatalogo(slug: string, senal?: AbortSignal): Promise<Catalogo> {
  return peticion<Catalogo>(ruta(slug), { senal });
}

export function consultarDisponibilidad(
  slug: string,
  consulta: { servicioId: number; estilistaId: number | null; fecha: string },
  senal?: AbortSignal,
): Promise<Disponibilidad> {
  return peticion<Disponibilidad>(ruta(slug, "/disponibilidad"), {
    consulta: {
      servicioId: consulta.servicioId,
      estilistaId: consulta.estilistaId ?? undefined,
      fecha: consulta.fecha,
    },
    senal,
  });
}

export function reservar(slug: string, solicitud: SolicitudReserva): Promise<Cita> {
  return peticion<Cita>(ruta(slug, "/reservas"), { metodo: "POST", cuerpo: solicitud });
}

export function enviarChat(slug: string, solicitud: SolicitudChat): Promise<RespuestaChat> {
  return peticion<RespuestaChat>(ruta(slug, "/chat"), { metodo: "POST", cuerpo: solicitud });
}
