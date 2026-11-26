"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import type { Catalogo } from "@/api/tipos";
import {
  SelectorBarbero,
  SelectorFecha,
  SelectorHora,
  SelectorServicio,
} from "@/components/reserva/selectores";
import { Boton } from "@/components/ui/boton";
import { formatoDinero, formatoDuracion, formatoFechaMedia, formatoHora, hoyEnBogota } from "@/lib/formato";
import { aParametros, barberosDelServicio, CUALQUIERA, leerSeleccion, type Seleccion } from "@/lib/seleccion";
import { cn } from "@/lib/utils";

// "Hoy" se calcula en el navegador; en el servidor se usa la fecha del render.
const sinSuscripcion = () => () => {};

/** Paso a paso de la reserva en una sola página (SPEC-WEB §5.1). La selección vive en la URL. */
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
  const barbero =
    seleccion.barbero === CUALQUIERA
      ? null
      : (barberosDelServicio(catalogo, seleccion.servicioId).find((b) => b.id === seleccion.barbero) ?? null);

  if (catalogo.servicios.length === 0) {
    return (
      <p className="rounded-grupo bg-superficie p-5 text-cuerpo text-texto-2">
        Este salón todavía no tiene servicios para reservar en línea. Escríbele al {catalogo.telefono}.
      </p>
    );
  }

  const completa = servicio !== null && seleccion.hora !== null;
  const props = { catalogo, seleccion, alCambiar: actualizar };

  return (
    <div className={cn("flex flex-col gap-8", completa && "pb-36")}>
      <SelectorServicio {...props} />
      {servicio && <SelectorBarbero {...props} />}
      {servicio && <SelectorFecha {...props} hoy={hoy} />}
      {servicio && <SelectorHora {...props} />}

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
