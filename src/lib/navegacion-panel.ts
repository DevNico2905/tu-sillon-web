import type { Rol } from "@/api/tipos";

/**
 * Secciones del panel y quién las ve (SPEC-WEB §3.1, S8).
 * "Plan" reemplaza a "Plan y créditos": los créditos salen del lenguaje comercial.
 */
export interface Seccion {
  ruta: string;
  titulo: string;
  roles: Rol[];
  /** Pestaña fija en la barra inferior del celular. */
  enPestanas?: boolean;
}

export const SECCIONES: Seccion[] = [
  { ruta: "/panel/agenda", titulo: "Agenda", roles: ["DUENO", "ESTILISTA"], enPestanas: true },
  { ruta: "/panel/solicitudes", titulo: "Solicitudes", roles: ["DUENO"], enPestanas: true },
  { ruta: "/panel/servicios", titulo: "Servicios", roles: ["DUENO"] },
  { ruta: "/panel/equipo", titulo: "Equipo", roles: ["DUENO"], enPestanas: true },
  { ruta: "/panel/clientes", titulo: "Clientes", roles: ["DUENO"] },
  { ruta: "/panel/plan", titulo: "Plan", roles: ["DUENO"] },
  { ruta: "/panel/configuracion", titulo: "Configuración", roles: ["DUENO"] },
];

export function seccionesDe(rol: Rol): Seccion[] {
  return SECCIONES.filter((s) => s.roles.includes(rol));
}

export function puedeVer(rol: Rol, ruta: string): boolean {
  const seccion = SECCIONES.find((s) => ruta === s.ruta || ruta.startsWith(`${s.ruta}/`));
  return seccion ? seccion.roles.includes(rol) : true;
}

/** Solo se vuelve a rutas del panel: evita redirecciones abiertas con ?volver=https://… */
export function destinoSeguro(volver: string | null): string {
  if (volver && volver.startsWith("/panel") && !volver.startsWith("//")) return volver;
  return "/panel/agenda";
}
