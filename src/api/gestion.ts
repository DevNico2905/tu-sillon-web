import { peticion } from "./cliente";
import type {
  Cliente,
  Estilista,
  Salon,
  Servicio,
  SolicitudConfiguracion,
  SolicitudDatosSalon,
  SolicitudEditarEstilista,
  SolicitudEstilista,
  SolicitudServicio,
} from "./tipos";

/** Endpoints de gestión del panel (SPEC-WEB §5.7). Todos son solo para DUENO. */

/** Activos e inactivos: el panel los separa. */
export function listarServicios(): Promise<Servicio[]> {
  return peticion<Servicio[]>("/api/servicios");
}

export function crearServicio(solicitud: SolicitudServicio): Promise<Servicio> {
  return peticion<Servicio>("/api/servicios", { metodo: "POST", cuerpo: solicitud });
}

export function actualizarServicio(id: number, solicitud: SolicitudServicio): Promise<Servicio> {
  return peticion<Servicio>(`/api/servicios/${id}`, { metodo: "PUT", cuerpo: solicitud });
}

export function listarEstilistas(): Promise<Estilista[]> {
  return peticion<Estilista[]>("/api/estilistas");
}

export function crearEstilista(solicitud: SolicitudEstilista): Promise<Estilista> {
  return peticion<Estilista>("/api/estilistas", { metodo: "POST", cuerpo: solicitud });
}

/** R43: nombre, servicios, estado y, si viene, contraseña nueva. */
export function actualizarEstilista(id: number, solicitud: SolicitudEditarEstilista): Promise<Estilista> {
  return peticion<Estilista>(`/api/estilistas/${id}`, { metodo: "PUT", cuerpo: solicitud });
}

export function listarClientes(): Promise<Cliente[]> {
  return peticion<Cliente[]>("/api/clientes");
}

/** R44: el slug no cambia. */
export function actualizarDatosSalon(solicitud: SolicitudDatosSalon): Promise<Salon> {
  return peticion<Salon>("/api/salon", { metodo: "PUT", cuerpo: solicitud });
}

export function actualizarHorario(solicitud: SolicitudConfiguracion): Promise<Salon> {
  return peticion<Salon>("/api/salon/configuracion", { metodo: "PUT", cuerpo: solicitud });
}
