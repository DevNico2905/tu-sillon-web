import type { components } from "./esquema";

/**
 * Tipos de la API derivados de `esquema.ts` (generado). Aquí no se escribe
 * ningún campo a mano: solo se ajusta lo que springdoc no sabe expresar.
 *
 * springdoc marca opcional todo campo de una respuesta, aunque el backend
 * siempre lo envía. `Completo` los vuelve obligatorios; los pocos campos que
 * de verdad pueden venir en null se declaran aparte.
 */
type Esquemas = components["schemas"];

type Completo<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends (infer U)[]
    ? U extends object
      ? Completo<U>[]
      : U[]
    : NonNullable<T[K]> extends object
      ? Completo<NonNullable<T[K]>>
      : NonNullable<T[K]>;
};

type ConNulos<T, K extends keyof T> = Omit<T, K> & { [P in K]: T[P] | null };

export type Servicio = ConNulos<Completo<Esquemas["ServicioResponse"]>, "descripcion">;
export type EstilistaPublico = Completo<Esquemas["EstilistaPublicoResponse"]>;
export type Catalogo = Omit<Completo<Esquemas["CatalogoResponse"]>, "servicios"> & { servicios: Servicio[] };

/** `estilista` es null cuando se consulta sin elegir barbero (R40). */
export type Disponibilidad = ConNulos<Completo<Esquemas["DisponibilidadResponse"]>, "estilista">;

export type SolicitudReserva = Esquemas["CitaRequest"];
export type Cita = ConNulos<Completo<Esquemas["CitaResponse"]>, "nota">;

export type SolicitudChat = Esquemas["ChatRequest"];
export type TurnoChat = Esquemas["TurnoChat"];
export type RespuestaChat = Pick<Completo<Esquemas["ChatResponse"]>, "respuesta" | "escalado">;
