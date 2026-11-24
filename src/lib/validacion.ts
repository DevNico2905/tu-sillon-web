import { z } from "zod";
import { telefonoParaEnviar } from "./formato";

/**
 * Esquemas de formularios públicos. Aplican los mismos límites que el backend
 * (CitaRequest y ChatRequest) para avisar antes de enviar; el backend sigue
 * siendo quien decide.
 */

const textoObligatorio = (maximo: number, siFalta: string) =>
  z.string().trim().min(1, siFalta).max(maximo, `Máximo ${maximo} caracteres`);

const celular = z
  .string()
  .trim()
  .min(1, "Escribe tu celular")
  .refine((valor) => {
    if (!valor) return true; // el mensaje de vacío ya lo da min(1)
    const enviado = telefonoParaEnviar(valor);
    return enviado.replace("+", "").length >= 7 && enviado.length <= 30;
  }, "Revisa tu celular: debe tener al menos 7 dígitos");

export const esquemaDatosReserva = z.object({
  nombre: textoObligatorio(100, "Escribe tu nombre"),
  celular,
  nota: z.string().trim().max(300, "Máximo 300 caracteres"),
});

export type DatosReserva = z.infer<typeof esquemaDatosReserva>;

export const esquemaDatosChat = z.object({
  nombre: textoObligatorio(100, "Escribe tu nombre"),
  contacto: textoObligatorio(120, "Escribe tu celular o tu correo"),
});

export const MAXIMO_MENSAJE_CHAT = 500;
export const MAXIMO_TURNOS_CHAT = 20;

/** Campo del backend → campo del formulario, para mostrar los errores 400 junto a cada uno. */
export const CAMPOS_RESERVA: Record<string, keyof DatosReserva> = {
  clienteNombre: "nombre",
  clienteTelefono: "celular",
  nota: "nota",
};

export const esquemaEntrar = z.object({
  email: z.string().trim().min(1, "Escribe tu correo"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export type DatosEntrar = z.infer<typeof esquemaEntrar>;

/** Registro en dos pasos (SPEC-WEB §5.5). Mismos límites que RegistroRequest del backend. */
export const esquemaRegistroSalon = z.object({
  salonNombre: textoObligatorio(100, "Escribe el nombre de tu salón"),
  ciudad: textoObligatorio(60, "Escribe la ciudad"),
  direccion: textoObligatorio(150, "Escribe la dirección"),
  telefono: celular,
});

export const esquemaRegistroCuenta = z.object({
  nombre: textoObligatorio(100, "Escribe tu nombre"),
  email: z.string().trim().min(1, "Escribe tu correo").pipe(z.email("Revisa tu correo")),
  password: z.string().min(8, "Usa al menos 8 caracteres").max(72, "Máximo 72 caracteres"),
});

export const esquemaRegistro = esquemaRegistroSalon.extend(esquemaRegistroCuenta.shape);

export type DatosRegistro = z.infer<typeof esquemaRegistro>;

/** Campo del backend → campo del formulario de registro (errores 400). */
export const CAMPOS_REGISTRO: Record<string, keyof DatosRegistro> = {
  salonNombre: "salonNombre",
  ciudad: "ciudad",
  direccion: "direccion",
  telefono: "telefono",
  nombre: "nombre",
  email: "email",
  password: "password",
};

export type Fortaleza = { nivel: 0 | 1 | 2 | 3; texto: string };

/**
 * Indicador de fortaleza de la contraseña. Solo orienta: la regla que se exige
 * es la del backend (8 a 72 caracteres).
 */
export function fortalezaContrasena(contrasena: string): Fortaleza {
  if (contrasena.length < 8) return { nivel: 0, texto: "Muy corta" };
  let puntos = 0;
  if (contrasena.length >= 12) puntos++;
  if (/[a-z]/.test(contrasena) && /[A-Z]/.test(contrasena)) puntos++;
  if (/\d/.test(contrasena)) puntos++;
  if (/[^A-Za-z0-9]/.test(contrasena)) puntos++;
  if (puntos <= 1) return { nivel: 1, texto: "Débil" };
  if (puntos <= 2) return { nivel: 2, texto: "Aceptable" };
  return { nivel: 3, texto: "Fuerte" };
}
