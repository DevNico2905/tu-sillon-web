"use client";

import { useQuery } from "@tanstack/react-query";
import { consultarDisponibilidad } from "@/api/publico";
import type { Catalogo } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { Grupo } from "@/components/ui/grupo";
import {
  formatoDinero,
  formatoDuracion,
  formatoFechaCorta,
  formatoFechaMedia,
  formatoHora,
} from "@/lib/formato";
import { horaCorta, proximosDias } from "@/lib/horario";
import {
  barberosDelServicio,
  cambiarBarbero,
  cambiarFecha,
  cambiarHora,
  cambiarServicio,
  CUALQUIERA,
  type Seleccion,
} from "@/lib/seleccion";
import { iniciales } from "@/lib/texto";
import { cn } from "@/lib/utils";

/**
 * Selectores de la reserva (SPEC-WEB §5.1): servicio, barbero, fecha y hora.
 * Son controlados: reciben la selección y avisan el cambio. La página pública
 * guarda la selección en la URL; "Nueva cita" del panel (§5.6), en su estado.
 */
interface PropsSelector {
  catalogo: Catalogo;
  seleccion: Seleccion;
  alCambiar: (nueva: Seleccion) => void;
}

export function SelectorServicio({ catalogo, seleccion, alCambiar }: PropsSelector) {
  return (
    <Grupo rotulo="Servicio">
      <ul role="radiogroup" aria-label="Servicio">
        {catalogo.servicios.map((s) => {
          const elegido = s.id === seleccion.servicioId;
          return (
            <li key={s.id} className="border-b border-separador last:border-0">
              <button
                type="button"
                role="radio"
                aria-checked={elegido}
                onClick={() => alCambiar(cambiarServicio(seleccion, s.id, catalogo))}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="flex flex-1 flex-col">
                  <span className="text-destacado font-medium">{s.nombre}</span>
                  <span className="text-rotulo text-texto-2">
                    {formatoDuracion(s.duracionMinutos)}
                    {s.descripcion ? ` · ${s.descripcion}` : ""}
                  </span>
                </span>
                <span className="text-cuerpo font-medium">{formatoDinero(s.precio)}</span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-nota font-bold",
                    elegido ? "bg-acento text-white" : "border border-separador",
                  )}
                >
                  {elegido ? "✓" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Grupo>
  );
}

const carrusel = "-mx-5 flex overflow-x-auto px-5 pb-1 md:-mx-8 md:px-8";

export function SelectorBarbero({
  catalogo,
  seleccion,
  alCambiar,
  enHoja = false,
}: PropsSelector & { enHoja?: boolean }) {
  const barberos = barberosDelServicio(catalogo, seleccion.servicioId);
  return (
    <section aria-label="Barbero" className="flex flex-col gap-2">
      <h2 className="px-4 text-rotulo font-medium text-texto-2">Barbero</h2>
      <div
        role="radiogroup"
        aria-label="Barbero"
        className={cn(carrusel, "gap-3", enHoja && "md:-mx-5 md:px-5")}
      >
        <OpcionBarbero
          nombre="Cualquiera"
          marca="?"
          elegido={seleccion.barbero === CUALQUIERA}
          alElegir={() => alCambiar(cambiarBarbero(seleccion, CUALQUIERA))}
        />
        {barberos.map((b) => (
          <OpcionBarbero
            key={b.id}
            nombre={b.nombre}
            marca={iniciales(b.nombre)}
            elegido={seleccion.barbero === b.id}
            alElegir={() => alCambiar(cambiarBarbero(seleccion, b.id))}
          />
        ))}
      </div>
    </section>
  );
}

function OpcionBarbero({
  nombre,
  marca,
  elegido,
  alElegir,
}: {
  nombre: string;
  marca: string;
  elegido: boolean;
  alElegir: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegido}
      onClick={alElegir}
      className="flex w-20 shrink-0 flex-col items-center gap-1.5 py-1"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-14 items-center justify-center rounded-full text-destacado font-semibold",
          elegido ? "bg-acento text-white" : "bg-superficie text-texto",
        )}
      >
        {marca}
      </span>
      <span className={cn("w-full truncate text-center text-rotulo", elegido && "font-semibold")}>
        {nombre}
      </span>
    </button>
  );
}

export function SelectorFecha({
  catalogo,
  seleccion,
  alCambiar,
  hoy,
  enHoja = false,
}: PropsSelector & { hoy: string; enHoja?: boolean }) {
  return (
    <section aria-label="Fecha" className="flex flex-col gap-2">
      <h2 className="px-4 text-rotulo font-medium text-texto-2">Fecha</h2>
      <div
        role="radiogroup"
        aria-label="Fecha"
        className={cn(carrusel, "gap-2", enHoja && "md:-mx-5 md:px-5")}
      >
        {proximosDias(catalogo, hoy).map(({ fecha, atiende }, indice) => {
          const elegida = fecha === seleccion.fecha;
          const [dia, numero] = formatoFechaCorta(fecha).split(" ");
          return (
            <button
              key={fecha}
              type="button"
              role="radio"
              aria-checked={elegida}
              aria-label={`${indice === 0 ? "Hoy, " : ""}${formatoFechaMedia(fecha)}${atiende ? "" : ", cerrado"}`}
              disabled={!atiende}
              onClick={() => alCambiar(cambiarFecha(seleccion, fecha, catalogo))}
              className={cn(
                "flex min-h-16 min-w-14 shrink-0 flex-col items-center justify-center rounded-control",
                elegida ? "bg-acento text-white" : "bg-superficie",
                !atiende && "opacity-40",
              )}
            >
              <span className={cn("text-nota", elegida ? "text-white" : "text-texto-2")}>
                {indice === 0 ? "Hoy" : dia}
              </span>
              <span className="text-destacado font-semibold">{numero}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function SelectorHora({ catalogo, seleccion, alCambiar }: PropsSelector) {
  const estilistaId = seleccion.barbero === CUALQUIERA ? null : seleccion.barbero;
  const servicioId = seleccion.servicioId;
  // La clave no incluye la hora: elegir una hora no vuelve a pedir la disponibilidad.
  const disponibilidad = useQuery({
    queryKey: ["disponibilidad", catalogo.slug, servicioId, estilistaId, seleccion.fecha],
    queryFn: ({ signal }) =>
      consultarDisponibilidad(
        catalogo.slug,
        { servicioId: servicioId ?? 0, estilistaId, fecha: seleccion.fecha },
        signal,
      ),
    enabled: servicioId !== null,
  });

  return (
    <section id="paso-hora" aria-label="Hora" className="flex scroll-mt-6 flex-col gap-2">
      <h2 className="px-4 text-rotulo font-medium text-texto-2">Hora</h2>
      {disponibilidad.isPending ? (
        <div
          aria-busy="true"
          aria-label="Buscando horas libres"
          className="grid animate-pulse grid-cols-4 gap-2"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-11 rounded-control bg-superficie" />
          ))}
        </div>
      ) : disponibilidad.isError ? (
        <div className="flex flex-col items-start gap-2 rounded-grupo bg-superficie p-4">
          <p className="text-cuerpo">{disponibilidad.error.message}</p>
          <Boton variante="texto" onClick={() => void disponibilidad.refetch()}>
            Intentar de nuevo
          </Boton>
        </div>
      ) : disponibilidad.data.horariosLibres.length === 0 ? (
        <p className="rounded-grupo bg-superficie p-4 text-cuerpo text-texto-2">
          No hay horas libres este día. Prueba otro.
        </p>
      ) : (
        <div role="radiogroup" aria-label="Hora" className="grid grid-cols-4 gap-2">
          {disponibilidad.data.horariosLibres.map((hora) => {
            const elegida = horaCorta(hora) === seleccion.hora;
            return (
              <button
                key={hora}
                type="button"
                role="radio"
                aria-checked={elegida}
                onClick={() => alCambiar(cambiarHora(seleccion, hora))}
                className={cn(
                  "min-h-11 rounded-control text-rotulo font-medium",
                  elegida ? "bg-acento text-white" : "bg-superficie",
                )}
              >
                {formatoHora(hora)}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
