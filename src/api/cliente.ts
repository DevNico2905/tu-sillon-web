/**
 * Único cliente HTTP del front (SPEC-WEB §3.2).
 * Los componentes nunca llaman a fetch directo: todo pasa por `peticion`.
 */

export type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH";

/** Error de la API ya traducido. `codigo` 0 significa que no hubo respuesta (sin conexión). */
export class ErrorApi extends Error {
  readonly codigo: number;
  /** Mensajes por campo de un 400 ("campo: mensaje; campo: mensaje"). Vacío en otros códigos. */
  readonly campos: Readonly<Record<string, string>>;
  /** Segundos de espera de un 429, si la API los envió en Retry-After. */
  readonly reintentarEn?: number;

  constructor(
    codigo: number,
    mensaje: string,
    opciones: { campos?: Record<string, string>; reintentarEn?: number } = {},
  ) {
    super(mensaje);
    this.name = "ErrorApi";
    this.codigo = codigo;
    this.campos = opciones.campos ?? {};
    this.reintentarEn = opciones.reintentarEn;
  }
}

export interface OpcionesPeticion {
  metodo?: MetodoHttp;
  cuerpo?: unknown;
  consulta?: Record<string, string | number | boolean | undefined | null>;
  senal?: AbortSignal;
}

type ProveedorToken = () => string | null;

let proveedorToken: ProveedorToken = () => null;

/** La sesión (F2) registra aquí de dónde sale el access token. El token vive solo en memoria (S1). */
export function configurarToken(proveedor: ProveedorToken): void {
  proveedorToken = proveedor;
}

export function urlBaseApi(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_API_URL. Cópiala de .env.example a .env.local.");
  }
  return url.replace(/\/+$/, "");
}

function construirUrl(ruta: string, consulta?: OpcionesPeticion["consulta"]): string {
  const url = new URL(urlBaseApi() + ruta);
  for (const [clave, valor] of Object.entries(consulta ?? {})) {
    if (valor !== undefined && valor !== null && valor !== "") {
      url.searchParams.set(clave, String(valor));
    }
  }
  return url.toString();
}

/** "nombre: es obligatorio; telefono: debe tener entre 7 y 30" → { nombre: "es obligatorio", … } */
export function separarCampos(mensaje: string): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const parte of mensaje.split(";")) {
    const separador = parte.indexOf(":");
    if (separador <= 0) continue;
    const campo = parte.slice(0, separador).trim();
    const texto = parte.slice(separador + 1).trim();
    if (campo && texto && !/\s/.test(campo)) campos[campo] = texto;
  }
  return campos;
}

function leerSegundos(cabecera: string | null): number | undefined {
  if (!cabecera) return undefined;
  const segundos = Number.parseInt(cabecera, 10);
  return Number.isFinite(segundos) && segundos >= 0 ? segundos : undefined;
}

async function convertirError(respuesta: Response): Promise<ErrorApi> {
  let mensaje = "";
  try {
    const cuerpo: unknown = await respuesta.json();
    if (cuerpo && typeof cuerpo === "object" && "mensaje" in cuerpo) {
      const valor = (cuerpo as { mensaje: unknown }).mensaje;
      if (typeof valor === "string") mensaje = valor;
    }
  } catch {
    // Cuerpo vacío o no JSON: se usa el mensaje por defecto del código.
  }
  return new ErrorApi(respuesta.status, mensaje || mensajePorDefecto(respuesta.status), {
    campos: respuesta.status === 400 ? separarCampos(mensaje) : undefined,
    reintentarEn: respuesta.status === 429 ? leerSegundos(respuesta.headers.get("Retry-After")) : undefined,
  });
}

/** Textos de SPEC-WEB §3.4 para cuando la API no trae un mensaje propio. */
export function mensajePorDefecto(codigo: number): string {
  if (codigo === 0) return "Sin conexión. Revisa tu internet e intenta de nuevo.";
  if (codigo === 403) return "No tienes permiso para hacer esto.";
  if (codigo === 429) return "Muchos intentos seguidos. Intenta de nuevo en un momento.";
  if (codigo >= 500) return "Algo falló de nuestro lado. Intenta de nuevo en un rato.";
  return "No pudimos completar la acción. Intenta de nuevo.";
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = "GET", cuerpo, consulta, senal } = opciones;
  const cabeceras = new Headers({ Accept: "application/json" });
  if (cuerpo !== undefined) cabeceras.set("Content-Type", "application/json");
  const token = proveedorToken();
  if (token) cabeceras.set("Authorization", `Bearer ${token}`);

  let respuesta: Response;
  try {
    respuesta = await fetch(construirUrl(ruta, consulta), {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      // La cookie del refresh token solo viaja a /api/auth/* (SPEC-WEB §3.2).
      credentials: ruta.startsWith("/api/auth/") ? "include" : "omit",
      signal: senal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ErrorApi(0, mensajePorDefecto(0));
  }

  if (!respuesta.ok) throw await convertirError(respuesta);
  if (respuesta.status === 204) return undefined as T;
  const texto = await respuesta.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}
