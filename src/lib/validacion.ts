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
