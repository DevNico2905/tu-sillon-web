import { peticion } from "./cliente";
import type { RespuestaAuth, Salon, SolicitudLogin, SolicitudRegistro } from "./tipos";

/** Endpoints de cuenta (SPEC-WEB §5.5). Las respuestas dejan la cookie httpOnly del refresh. */

export function entrar(solicitud: SolicitudLogin): Promise<RespuestaAuth> {
  return peticion<RespuestaAuth>("/api/auth/login", { metodo: "POST", cuerpo: solicitud });
}

export function registrar(solicitud: SolicitudRegistro): Promise<RespuestaAuth> {
  return peticion<RespuestaAuth>("/api/auth/registro", { metodo: "POST", cuerpo: solicitud });
}

/** Datos del salón del dueño. Solo DUENO (los estilistas reciben 403). */
export function obtenerMiSalon(): Promise<Salon> {
  return peticion<Salon>("/api/salon");
}
