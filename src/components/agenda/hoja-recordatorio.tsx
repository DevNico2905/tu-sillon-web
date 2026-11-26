"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { redactarRecordatorio } from "@/api/agenda";
import { ErrorApi } from "@/api/cliente";
import type { Cita } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { AreaTexto } from "@/components/ui/campo";
import { Hoja } from "@/components/ui/hoja";
import { enlaceWhatsapp } from "@/lib/agenda";
import { formatoTelefono } from "@/lib/formato";

/**
 * Estado del recordatorio. La redacción se pide en el clic de "Redactar recordatorio"
 * y no en un efecto: cada pedido usa IA, y un efecto se repite al remontar.
 */
export function useRecordatorio() {
  const [cita, setCita] = useState<Cita | null>(null);
  const [mensaje, setMensaje] = useState("");
  const redaccion = useMutation({
    mutationFn: redactarRecordatorio,
    onSuccess: (respuesta) => setMensaje(respuesta.mensaje),
  });

  const abrir = (nueva: Cita) => {
    setCita(nueva);
    setMensaje("");
    redaccion.mutate(nueva.id);
  };

  return { cita, mensaje, setMensaje, redaccion, abrir, cerrar: () => setCita(null) };
}

/**
 * Recordatorio redactado por la IA (SPEC-WEB §5.6). La persona lo revisa, lo puede
 * ajustar y lo envía ella misma por WhatsApp: Sillón nunca envía nada solo.
 */
export function HojaRecordatorio({ estado }: { estado: ReturnType<typeof useRecordatorio> }) {
  const { cita, mensaje, setMensaje, redaccion, cerrar } = estado;
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  const error = redaccion.error;
  const sinPlan = error instanceof ErrorApi && error.codigo === 402;
  const iaCaida = error instanceof ErrorApi && (error.codigo === 502 || error.codigo === 503);

  return (
    <Hoja abierta={cita !== null} alCerrar={cerrar} titulo="Recordatorio">
      {cita && (
        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <p className="text-cuerpo text-texto-2">
            Para {cita.clienteNombre} · {formatoTelefono(cita.clienteTelefono)}
          </p>
          {redaccion.isPending ? (
            <div aria-busy="true" className="flex flex-col gap-2 rounded-grupo bg-superficie p-4">
              <p className="text-cuerpo text-texto-2">Redactando el mensaje…</p>
              <div className="h-4 w-full animate-pulse rounded-control bg-superficie-2" />
              <div className="h-4 w-4/5 animate-pulse rounded-control bg-superficie-2" />
            </div>
          ) : error ? (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-grupo bg-superficie p-4">
              <p className="text-cuerpo">
                {iaCaida
                  ? "El asistente no está disponible en este momento. Intenta en un rato."
                  : error.message}
              </p>
              {sinPlan ? (
                <Boton comoHijo variante="secundario">
                  <Link href="/panel/plan">Ver planes</Link>
                </Boton>
              ) : (
                <Boton variante="texto" onClick={() => redaccion.mutate(cita.id)}>
                  Intentar de nuevo
                </Boton>
              )}
            </div>
          ) : (
            <>
              <label htmlFor="recordatorio" className="sr-only">
                Mensaje
              </label>
              <AreaTexto
                id="recordatorio"
                value={mensaje}
                onChange={(evento) => setMensaje(evento.target.value)}
                rows={6}
                className="rounded-grupo bg-superficie p-4 text-cuerpo"
              />
              <p className="text-nota text-texto-2">
                Revísalo antes de enviarlo. Puedes cambiar lo que quieras.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Boton variante="secundario" onClick={() => void copiar()} disabled={!mensaje}>
                  {copiado ? "Copiado" : "Copiar"}
                </Boton>
                <Boton comoHijo>
                  <a
                    href={enlaceWhatsapp(cita.clienteTelefono, mensaje)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir WhatsApp
                  </a>
                </Boton>
              </div>
            </>
          )}
        </div>
      )}
    </Hoja>
  );
}
