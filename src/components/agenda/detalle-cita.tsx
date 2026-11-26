"use client";

import type { Cita, EstadoCita, Rol } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { FilaDato } from "@/components/ui/grupo";
import { ACCION_HACIA, accionesPermitidas, ETIQUETA_ESTADO, puedeRecordar } from "@/lib/agenda";
import { formatoDinero, formatoFechaMedia, formatoHora, formatoTelefono } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { ESTILO_ETIQUETA } from "./estilo-cita";

/** Detalle de una cita con las acciones que permite su estado (SPEC-WEB §5.6). */
export function DetalleCita({
  cita,
  rol,
  cambiando,
  alCambiarEstado,
  alRecordar,
}: {
  cita: Cita;
  rol: Rol;
  cambiando: boolean;
  alCambiarEstado: (estado: EstadoCita) => void;
  alRecordar: () => void;
}) {
  const acciones = accionesPermitidas(cita.estado, rol);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn("rounded-full px-3 py-1 text-rotulo font-semibold", ESTILO_ETIQUETA[cita.estado])}
          >
            {ETIQUETA_ESTADO[cita.estado]}
          </span>
          <span className="text-nota text-texto-2">
            {cita.origen === "EN_LINEA" ? "Reservada en línea" : "Creada en el salón"}
          </span>
        </div>
        <h2 className="text-seccion font-bold break-words">{cita.clienteNombre}</h2>
        <a href={`tel:${cita.clienteTelefono}`} className="text-cuerpo font-medium text-acento">
          {formatoTelefono(cita.clienteTelefono)}
        </a>
      </div>

      <dl className="overflow-hidden rounded-grupo bg-superficie">
        <FilaDato etiqueta="Servicio">{cita.servicioNombre}</FilaDato>
        <FilaDato etiqueta="Cuándo">
          {formatoFechaMedia(cita.inicio)} · {formatoHora(cita.inicio)}
        </FilaDato>
        <FilaDato etiqueta="Hasta">{formatoHora(cita.fin)}</FilaDato>
        <FilaDato etiqueta="Barbero">{cita.estilistaNombre}</FilaDato>
        {rol === "DUENO" && <FilaDato etiqueta="Valor">{formatoDinero(cita.precio)}</FilaDato>}
        {cita.nota && <FilaDato etiqueta="Nota">{cita.nota}</FilaDato>}
      </dl>

      {acciones.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {acciones.map((destino) => (
            <Boton
              key={destino}
              variante={destino === "CANCELADA" || destino === "NO_ASISTIO" ? "peligro" : "principal"}
              disabled={cambiando}
              onClick={() => alCambiarEstado(destino)}
              className={cn(destino === "CANCELADA" && acciones.length % 2 === 1 && "col-span-2")}
            >
              {ACCION_HACIA[destino]}
            </Boton>
          ))}
        </div>
      )}

      {puedeRecordar(cita.estado, rol) && (
        <Boton variante="secundario" ancho="completo" onClick={alRecordar}>
          Redactar recordatorio
        </Boton>
      )}
    </div>
  );
}
