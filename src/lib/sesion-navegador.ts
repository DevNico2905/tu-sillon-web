/**
 * Datos que se recuerdan solo durante la sesión del navegador (sessionStorage):
 * la reserva recién enviada (SPEC-WEB §5.3) y el nombre y contacto del chat (§5.4).
 *
 * Nunca se guarda aquí el token de sesión del panel (S1). sessionStorage puede
 * fallar (modo privado, almacenamiento lleno): todo acceso va con try/catch y
 * un fallo se trata como "no hay nada guardado".
 */

export interface ReservaEnviada {
  slug: string;
  citaId: number;
  clienteNombre: string;
  salonNombre: string;
  direccion: string;
  ciudad: string;
  servicio: string;
  estilista: string;
  inicio: string; // "2026-11-23T10:30:00"
  fin: string;
}

export interface DatosChat {
  nombre: string;
  contacto: string;
}

const CLAVE_RESERVA = "sillon.reserva";
const CLAVE_CHAT = "sillon.chat";

function leer<T>(clave: string, esValido: (valor: unknown) => valor is T): T | null {
  try {
    const texto = window.sessionStorage.getItem(clave);
    if (!texto) return null;
    const valor: unknown = JSON.parse(texto);
    return esValido(valor) ? valor : null;
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: unknown): void {
  try {
    window.sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento la app sigue funcionando; solo no recuerda el dato.
  }
}

function tieneTextos(valor: unknown, claves: string[]): valor is Record<string, string> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    claves.every((clave) => typeof (valor as Record<string, unknown>)[clave] === "string")
  );
}

function esReserva(valor: unknown): valor is ReservaEnviada {
  return (
    tieneTextos(valor, ["slug", "clienteNombre", "salonNombre", "servicio", "estilista", "inicio", "fin"]) &&
    typeof (valor as Record<string, unknown>).citaId === "number"
  );
}

function esDatosChat(valor: unknown): valor is DatosChat {
  return tieneTextos(valor, ["nombre", "contacto"]);
}

export function guardarReserva(reserva: ReservaEnviada): void {
  escribir(CLAVE_RESERVA, reserva);
}

/** La última reserva enviada, solo si es de este salón. */
export function leerReserva(slug: string): ReservaEnviada | null {
  const reserva = leer(CLAVE_RESERVA, esReserva);
  return reserva?.slug === slug ? reserva : null;
}

export function guardarDatosChat(datos: DatosChat): void {
  escribir(CLAVE_CHAT, datos);
}

export function leerDatosChat(): DatosChat | null {
  return leer(CLAVE_CHAT, esDatosChat);
}
