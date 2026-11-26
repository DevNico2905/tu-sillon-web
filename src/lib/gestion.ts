import { z } from "zod";
import type { Cliente } from "@/api/tipos";
import { telefonoParaEnviar } from "./formato";

/**
 * Lógica de las pantallas de gestión del panel (SPEC-WEB §5.7). Los límites
 * son los del backend (ServicioRequest, EstilistaRequest, R43, R44 y
 * ConfiguracionRequest) para avisar antes de enviar; el backend decide.
 */

const texto = (maximo: number, siFalta: string) =>
  z.string().trim().min(1, siFalta).max(maximo, `Máximo ${maximo} caracteres`);

/** Acepta "35.000", "$35000" o "35 000": solo cuentan los dígitos. */
export function leerPesos(valor: string): number {
  const digitos = valor.replace(/\D/g, "");
  return digitos ? Number(digitos) : 0;
}

export const esquemaServicio = z.object({
  nombre: texto(100, "Escribe el nombre del servicio"),
  descripcion: z.string().trim().max(300, "Máximo 300 caracteres"),
  duracionMinutos: z
    .number({ error: "Escribe la duración en minutos" })
    .int("Usa minutos enteros")
    .min(15, "Mínimo 15 minutos")
    .max(480, "Máximo 480 minutos (8 horas)"),
  precio: z.string().refine((valor) => leerPesos(valor) > 0, "Escribe un precio mayor que cero"),
  activo: z.boolean(),
});

export type DatosServicio = z.infer<typeof esquemaServicio>;

const contrasena = z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72 caracteres");

export const esquemaNuevoEstilista = z.object({
  nombre: texto(100, "Escribe su nombre"),
  email: z.string().trim().min(1, "Escribe su correo").email("Revisa el correo"),
  password: contrasena,
  servicioIds: z.array(z.number()).min(1, "Elige al menos un servicio"),
});

export type DatosNuevoEstilista = z.infer<typeof esquemaNuevoEstilista>;

/** Al editar, la contraseña vacía significa "no cambiarla" (R43). */
export const esquemaEditarEstilista = z.object({
  nombre: texto(100, "Escribe su nombre"),
  servicioIds: z.array(z.number()).min(1, "Elige al menos un servicio"),
  activo: z.boolean(),
  password: z.union([z.literal(""), contrasena]),
});

export type DatosEditarEstilista = z.infer<typeof esquemaEditarEstilista>;

export const esquemaDatosSalon = z.object({
  nombre: texto(100, "Escribe el nombre del salón"),
  ciudad: texto(60, "Escribe la ciudad"),
  direccion: texto(150, "Escribe la dirección"),
  telefono: texto(30, "Escribe el teléfono"),
});

export type DatosSalon = z.infer<typeof esquemaDatosSalon>;

export const INTERVALOS = [15, 20, 30, 45, 60] as const;

export const esquemaHorario = z
  .object({
    horaApertura: z.string().regex(/^\d{2}:\d{2}$/, "Elige la hora de apertura"),
    horaCierre: z.string().regex(/^\d{2}:\d{2}$/, "Elige la hora de cierre"),
    intervaloMinutos: z.number().int().min(15).max(60),
    abreDomingos: z.boolean(),
  })
  .refine((datos) => datos.horaApertura < datos.horaCierre, {
    path: ["horaCierre"],
    message: "El cierre tiene que ser después de la apertura",
  });

export type DatosHorario = z.infer<typeof esquemaHorario>;

/** "09:00:00" → "09:00", para los <input type="time">. */
export function horaCorta(valor: string): string {
  return valor.slice(0, 5);
}

/** Minúsculas y sin tildes, para buscar "Maria" y encontrar "María". */
function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Búsqueda local de clientes (el backend devuelve la lista completa). Con letras
 * busca en el nombre; con 3 o más dígitos busca en el teléfono, con o sin +57.
 */
export function filtrarClientes(clientes: Cliente[], busqueda: string): Cliente[] {
  const consulta = normalizar(busqueda);
  const ordenados = [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  if (!consulta) return ordenados;
  const digitos = consulta.replace(/\D/g, "");
  return ordenados.filter((cliente) => {
    if (normalizar(cliente.nombre).includes(consulta)) return true;
    return digitos.length >= 3 && telefonoParaEnviar(cliente.telefono).includes(digitos);
  });
}

const LETRAS = "abcdefghjkmnpqrstuvwxyz";
const DIGITOS = "23456789";

/**
 * Contraseña sugerida para un estilista nuevo: fácil de dictar (sin 0/O ni 1/l)
 * y con 12 caracteres, bien por encima del mínimo de 8.
 */
export function sugerirContrasena(aleatorio: (n: number) => Uint32Array = valoresAleatorios): string {
  const valores = aleatorio(12);
  const caracteres = Array.from(valores, (valor, i) => {
    const fuente = i % 4 === 3 ? DIGITOS : LETRAS;
    const letra = fuente[valor % fuente.length];
    return i === 0 ? letra.toUpperCase() : letra;
  });
  return caracteres.join("");
}

function valoresAleatorios(n: number): Uint32Array {
  return crypto.getRandomValues(new Uint32Array(n));
}

/** Texto que el dueño le envía al estilista para que entre al panel. */
export function textoAcceso({
  nombre,
  email,
  password,
  urlEntrar,
}: {
  nombre: string;
  email: string;
  password: string;
  urlEntrar: string;
}): string {
  return [
    `Hola ${nombre.split(" ")[0]}, este es tu acceso a la agenda en Sillón:`,
    urlEntrar,
    `Correo: ${email}`,
    `Contraseña: ${password}`,
  ].join("\n");
}
