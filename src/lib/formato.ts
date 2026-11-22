/**
 * Formatos para Colombia (SPEC-WEB §4.4).
 *
 * Se escriben a mano y no con Intl: Intl inserta espacios duros invisibles
 * ("10:30 a. m." con U+202F) que rompen comparaciones y tests, y su salida
 * cambia entre navegadores. Toda fecha y hora es de America/Bogota.
 *
 * La API envía fechas como "2026-11-23" y fechas con hora como
 * "2026-11-23T10:30:00", ya en hora de Bogotá y sin zona. Por eso aquí se
 * leen como texto y nunca con new Date(texto), que las movería a la zona
 * del dispositivo.
 */

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Colombia no tiene horario de verano: siempre UTC−5. */
const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000;

function mayusculaInicial(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function separarFecha(fecha: string): { anio: number; mes: number; dia: number } {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  if (!coincidencia) throw new Error(`Fecha inválida: ${fecha}`);
  return {
    anio: Number(coincidencia[1]),
    mes: Number(coincidencia[2]),
    dia: Number(coincidencia[3]),
  };
}

function diaDeLaSemana(fecha: string): number {
  const { anio, mes, dia } = separarFecha(fecha);
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
}

/** 35000 → "$35.000". Pesos sin decimales y con punto de miles. */
export function formatoDinero(valor: number): string {
  const redondeado = Math.round(Math.abs(valor));
  const conPuntos = String(redondeado).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${valor < 0 ? "-" : ""}$${conPuntos}`;
}

/** "14:00:00", "14:00" o "2026-11-23T14:00:00" → "2:00 p. m." */
export function formatoHora(valor: string): string {
  const coincidencia = /(?:^|T)(\d{1,2}):(\d{2})/.exec(valor);
  if (!coincidencia) throw new Error(`Hora inválida: ${valor}`);
  const horas = Number(coincidencia[1]);
  const minutos = coincidencia[2];
  const sufijo = horas < 12 ? "a. m." : "p. m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${horas12}:${minutos} ${sufijo}`;
}

/** "2026-11-23" → "Lun 23" */
export function formatoFechaCorta(fecha: string): string {
  const { dia } = separarFecha(fecha);
  return `${mayusculaInicial(DIAS[diaDeLaSemana(fecha)].slice(0, 3))} ${dia}`;
}

/** "2026-11-23" → "Lun 23 de nov" */
export function formatoFechaMedia(fecha: string): string {
  const { mes } = separarFecha(fecha);
  return `${formatoFechaCorta(fecha)} de ${MESES[mes - 1].slice(0, 3)}`;
}

/** "2026-11-23" → "Lunes 23 de noviembre" */
export function formatoFechaLarga(fecha: string): string {
  const { mes, dia } = separarFecha(fecha);
  return `${mayusculaInicial(DIAS[diaDeLaSemana(fecha)])} ${dia} de ${MESES[mes - 1]}`;
}

/** 45 → "45 min", 60 → "1 h", 75 → "1 h 15 min" */
export function formatoDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** Deja solo dígitos y un "+" inicial; a un celular colombiano de 10 dígitos le agrega +57. */
export function telefonoParaEnviar(valor: string): string {
  const conMas = valor.trim().startsWith("+");
  const digitos = valor.replace(/\D/g, "");
  if (!conMas && digitos.length === 10 && digitos.startsWith("3")) return `+57${digitos}`;
  return conMas ? `+${digitos}` : digitos;
}

/** "+573001234567" → "+57 300 123 4567". Otros formatos se muestran tal cual. */
export function formatoTelefono(valor: string): string {
  const normalizado = telefonoParaEnviar(valor);
  const coincidencia = /^\+57(\d{3})(\d{3})(\d{4})$/.exec(normalizado);
  if (!coincidencia) return valor.trim();
  return `+57 ${coincidencia[1]} ${coincidencia[2]} ${coincidencia[3]}`;
}

/** Fecha de hoy en Bogotá como "2026-11-23", sin importar la zona del dispositivo. */
export function hoyEnBogota(ahora: Date = new Date()): string {
  return new Date(ahora.getTime() + DESFASE_BOGOTA_MS).toISOString().slice(0, 10);
}

/** "2026-11-30" + 2 → "2026-12-02" */
export function sumarDias(fecha: string, dias: number): string {
  const { anio, mes, dia } = separarFecha(fecha);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}
