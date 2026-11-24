"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
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
  hoyEnBogota,
} from "@/lib/formato";
import { horaCorta, proximosDias } from "@/lib/horario";
import {
  aParametros,
  barberosDelServicio,
  cambiarBarbero,
  cambiarFecha,
  cambiarHora,
  cambiarServicio,
  CUALQUIERA,
  leerSeleccion,
  type Seleccion,
} from "@/lib/seleccion";
import { iniciales } from "@/lib/texto";
import { cn } from "@/lib/utils";

// "Hoy" se calcula en el navegador; en el servidor se usa la fecha del render.
const sinSuscripcion = () => () => {};

/** Paso a paso de la reserva en una sola página (SPEC-WEB §5.1). */
export function ReservaSalon({ catalogo }: { catalogo: Catalogo }) {
  const parametros = useSearchParams();
  const router = useRouter();
  const ruta = usePathname();
  const hoy = useSyncExternalStore(
    sinSuscripcion,
    () => hoyEnBogota(),
    () => hoyEnBogota(),
  );
  const seleccion = leerSeleccion(parametros, catalogo, hoy);

  const actualizar = (nueva: Seleccion) => {
    router.replace(`${ruta}?${aParametros(nueva).toString()}`, { scroll: false });
  };

  const servicio = catalogo.servicios.find((s) => s.id === seleccion.servicioId) ?? null;
  const barberos = barberosDelServicio(catalogo, seleccion.servicioId);
  const barbero =
    seleccion.barbero === CUALQUIERA ? null : (barberos.find((b) => b.id === seleccion.barbero) ?? null);

  if (catalogo.servicios.length === 0) {
    return (
      <p className="rounded-grupo bg-superficie p-5 text-cuerpo text-texto-2">
        Este salón todavía no tiene servicios para reservar en línea. Escríbele al {catalogo.telefono}.
      </p>
    );
  }

  const completa = servicio !== null && seleccion.hora !== null;

  return (
    <div className={cn("flex flex-col gap-8", completa && "pb-36")}>
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
                  onClick={() => actualizar(cambiarServicio(seleccion, s.id, catalogo))}
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

      {servicio && (
        <section aria-label="Barbero" className="flex flex-col gap-2">
          <h2 className="px-4 text-rotulo font-medium text-texto-2">Barbero</h2>
          <div
            role="radiogroup"
            aria-label="Barbero"
            className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:-mx-8 md:px-8"
          >
            <OpcionBarbero
              nombre="Cualquiera"
              marca="?"
              elegido={seleccion.barbero === CUALQUIERA}
              alElegir={() => actualizar(cambiarBarbero(seleccion, CUALQUIERA))}
            />
            {barberos.map((b) => (
              <OpcionBarbero
                key={b.id}
                nombre={b.nombre}
                marca={iniciales(b.nombre)}
                elegido={seleccion.barbero === b.id}
                alElegir={() => actualizar(cambiarBarbero(seleccion, b.id))}
              />
            ))}
          </div>
        </section>
      )}

      {servicio && (
        <section aria-label="Fecha" className="flex flex-col gap-2">
          <h2 className="px-4 text-rotulo font-medium text-texto-2">Fecha</h2>
          <div
            role="radiogroup"
            aria-label="Fecha"
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:-mx-8 md:px-8"
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
                  onClick={() => actualizar(cambiarFecha(seleccion, fecha, catalogo))}
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
      )}

      {servicio && (
        <Horas
          slug={catalogo.slug}
          seleccion={seleccion}
          alElegir={(hora) => actualizar(cambiarHora(seleccion, hora))}
        />
      )}

      {completa && servicio && seleccion.hora && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-separador bg-fondo/80 backdrop-blur-[20px]">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-8">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-cuerpo font-semibold">
                {formatoFechaMedia(seleccion.fecha)} · {formatoHora(seleccion.hora)}
              </span>
              <span className="truncate text-rotulo text-texto-2">
                {servicio.nombre}
                {barbero ? ` con ${barbero.nombre}` : ""} · {formatoDuracion(servicio.duracionMinutos)}
              </span>
              <span className="text-rotulo font-medium">{formatoDinero(servicio.precio)}</span>
            </div>
            <Boton comoHijo>
              <Link href={`/s/${catalogo.slug}/reservar?${aParametros(seleccion).toString()}`}>Reservar</Link>
            </Boton>
          </div>
        </div>
      )}
    </div>
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

function Horas({
  slug,
  seleccion,
  alElegir,
}: {
  slug: string;
  seleccion: Seleccion;
  alElegir: (hora: string) => void;
}) {
  const estilistaId = seleccion.barbero === CUALQUIERA ? null : seleccion.barbero;
  const servicioId = seleccion.servicioId;
  // La clave no incluye la hora: elegir una hora no vuelve a pedir la disponibilidad.
  const disponibilidad = useQuery({
    queryKey: ["disponibilidad", slug, servicioId, estilistaId, seleccion.fecha],
    queryFn: ({ signal }) =>
      consultarDisponibilidad(
        slug,
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
                onClick={() => alElegir(hora)}
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
