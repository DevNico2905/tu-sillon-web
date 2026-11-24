"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { browser } from "react-dom";
import { Boton } from "@/components/ui/boton";
import { FilaDato, Grupo } from "@/components/ui/grupo";
import { crearIcs, enlaceMapa } from "@/lib/calendario";
import { formatoFechaLarga, formatoHora } from "@/lib/formato";
import { leerReserva } from "@/lib/sesion-navegador";
import { primerNombre } from "@/lib/texto";

/** Confirmación (SPEC-WEB §5.3). La reserva sale de sessionStorage: solo existe en el navegador. */
export function ReservaEnviada({ slug }: { slug: string }) {
  use(browser("La reserva enviada se guarda en sessionStorage."));
  const router = useRouter();
  const [reserva] = useState(() => leerReserva(slug));

  useEffect(() => {
    // Sin una reserva de este salón en la sesión (entrada directa), se vuelve al salón.
    if (!reserva) router.replace(`/s/${slug}`);
  }, [reserva, router, slug]);

  if (!reserva) return null;

  const descargarIcs = () => {
    const ics = crearIcs({
      id: reserva.citaId,
      inicio: reserva.inicio,
      fin: reserva.fin,
      titulo: `${reserva.servicio} en ${reserva.salonNombre}`,
      lugar: `${reserva.direccion}, ${reserva.ciudad}`,
      descripcion: `Con ${reserva.estilista}. Reserva pendiente de confirmación.`,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `cita-${reserva.salonNombre.toLowerCase().replace(/\s+/g, "-")}.ics`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <span
          aria-hidden
          className="flex size-20 items-center justify-center rounded-full bg-acento text-titulo font-bold text-white"
        >
          ✓
        </span>
        <h1 className="text-titulo font-bold">Reserva enviada</h1>
        <p className="max-w-sm text-cuerpo text-texto-2">
          {primerNombre(reserva.clienteNombre)}, {reserva.salonNombre} confirmará tu cita pronto.
        </p>
      </div>

      <Grupo>
        <dl>
          <FilaDato etiqueta="Fecha">{formatoFechaLarga(reserva.inicio)}</FilaDato>
          <FilaDato etiqueta="Hora">{formatoHora(reserva.inicio)}</FilaDato>
          <FilaDato etiqueta="Servicio">{reserva.servicio}</FilaDato>
          <FilaDato etiqueta="Barbero">{reserva.estilista}</FilaDato>
          <FilaDato etiqueta="Dónde">
            {reserva.direccion}, {reserva.ciudad}
          </FilaDato>
        </dl>
      </Grupo>

      <div className="grid grid-cols-2 gap-3">
        <Boton variante="secundario" onClick={descargarIcs}>
          Al calendario
        </Boton>
        <Boton variante="secundario" comoHijo>
          <a href={enlaceMapa(reserva.direccion, reserva.ciudad)} target="_blank" rel="noopener noreferrer">
            Cómo llegar
          </a>
        </Boton>
      </div>

      <Boton variante="texto" comoHijo className="self-center">
        <Link href={`/s/${slug}`}>Volver al salón</Link>
      </Boton>
    </div>
  );
}
