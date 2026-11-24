import { configurarSesion, ErrorApi, peticion } from "@/api/cliente";
import type { RespuestaAuth, Usuario } from "@/api/tipos";

/**
 * Sesión del panel (SPEC-WEB §3.3, backend ADR-0005).
 *
 * - S1: el access token vive solo en esta variable del módulo, en memoria.
 *   Nunca en localStorage, sessionStorage ni en cookies legibles.
 * - S3: un solo refresh en curso; las peticiones que llegan mientras tanto esperan la misma promesa.
 * - El refresh token viaja en una cookie httpOnly que el front no puede leer.
 */

export type MotivoSalida = "salida" | "expirada";

interface Estado {
  token: string;
  /** Momento (ms) en que vence el access token. */
  expiraEn: number;
  usuario: Usuario;
}

let estado: Estado | null = null;
let motivoSalida: MotivoSalida | null = null;
let refrescoEnCurso: Promise<boolean> | null = null;
const oyentes = new Set<() => void>();

function avisar() {
  for (const oyente of oyentes) oyente();
}

export function suscribirSesion(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function obtenerSesion(): Estado | null {
  return estado;
}

/** Por qué se cerró la última sesión: lo usa el panel para el mensaje de S4. */
export function obtenerMotivoSalida(): MotivoSalida | null {
  return motivoSalida;
}

export function iniciarSesion(respuesta: RespuestaAuth, ahora = Date.now()): void {
  estado = {
    token: respuesta.token,
    expiraEn: ahora + respuesta.expiraEnMinutos * 60_000,
    usuario: {
      usuarioId: respuesta.usuarioId,
      nombre: respuesta.nombre,
      rol: respuesta.rol,
      salonId: respuesta.salonId,
      salonSlug: respuesta.salonSlug,
    },
  };
  motivoSalida = null;
  avisar();
}

export function borrarSesion(motivo: MotivoSalida): void {
  estado = null;
  motivoSalida = motivo;
  avisar();
}

/**
 * POST /api/auth/refresh con la cookie. true si hay sesión nueva; false si la
 * cookie no sirve (401). Un error de red se propaga: no es lo mismo que una sesión vencida.
 */
export function refrescarSesion(): Promise<boolean> {
  refrescoEnCurso ??= (async () => {
    try {
      iniciarSesion(await peticion<RespuestaAuth>("/api/auth/refresh", { metodo: "POST" }));
      return true;
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 401) {
        if (estado) borrarSesion("expirada");
        return false;
      }
      throw error;
    } finally {
      refrescoEnCurso = null;
    }
  })();
  return refrescoEnCurso;
}

/** S6: revoca la sesión de este dispositivo. Aunque la API falle, la sesión local se borra. */
export async function cerrarSesion(): Promise<void> {
  try {
    await peticion<void>("/api/auth/logout", { metodo: "POST" });
  } catch {
    // Sin red la cookie queda viva en el servidor, pero este navegador ya no tiene el token.
  }
  borrarSesion("salida");
}

configurarSesion({
  obtenerToken: () => estado?.token ?? null,
  refrescar: () => refrescarSesion().catch(() => false),
});
