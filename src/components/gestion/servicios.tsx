"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listarServicios } from "@/api/gestion";
import type { Servicio } from "@/api/tipos";
import { CabeceraPanel } from "@/components/panel/pantalla-pronto";
import { Boton } from "@/components/ui/boton";
import { Grupo } from "@/components/ui/grupo";
import { formatoDinero, formatoDuracion } from "@/lib/formato";
import { CargandoLista, FalloCarga, ListaVacia } from "./estados";
import { HojaServicio } from "./hoja-servicio";

/** Servicios del salón (SPEC-WEB §5.7): activos arriba, desactivados abajo. Nada se borra. */
export function Servicios() {
  const servicios = useQuery({ queryKey: ["servicios"], queryFn: listarServicios });
  const [editando, setEditando] = useState<Servicio | "nuevo" | null>(null);

  const ordenados = [...(servicios.data ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const activos = ordenados.filter((s) => s.activo);
  const inactivos = ordenados.filter((s) => !s.activo);

  return (
    <>
      <CabeceraPanel
        titulo="Servicios"
        accion={servicios.data && <Boton onClick={() => setEditando("nuevo")}>Nuevo servicio</Boton>}
      >
        <p className="text-cuerpo text-texto-2">
          Lo que tus clientes pueden reservar, con su duración y su precio.
        </p>
      </CabeceraPanel>

      <div className="flex max-w-3xl flex-col gap-6 px-5 pb-10 md:px-8">
        {servicios.isPending && <CargandoLista />}
        {servicios.isError && (
          <FalloCarga mensaje={servicios.error.message} alReintentar={() => void servicios.refetch()} />
        )}
        {servicios.data?.length === 0 && (
          <ListaVacia
            titulo="Todavía no tienes servicios"
            texto="Crea el primero para que tus clientes puedan reservar en línea."
          >
            <Boton onClick={() => setEditando("nuevo")}>Crear servicio</Boton>
          </ListaVacia>
        )}
        {activos.length > 0 && (
          <Grupo rotulo={`Activos · ${activos.length}`}>
            {activos.map((servicio) => (
              <FilaServicio key={servicio.id} servicio={servicio} alElegir={setEditando} />
            ))}
          </Grupo>
        )}
        {inactivos.length > 0 && (
          <Grupo rotulo={`Desactivados · ${inactivos.length}`}>
            {inactivos.map((servicio) => (
              <FilaServicio key={servicio.id} servicio={servicio} alElegir={setEditando} />
            ))}
          </Grupo>
        )}
        {inactivos.length > 0 && (
          <p className="px-4 text-nota text-texto-2">
            Los desactivados no aparecen en tu página ni se pueden reservar. Sus citas pasadas se conservan.
          </p>
        )}
      </div>

      <HojaServicio servicio={editando} alCerrar={() => setEditando(null)} />
    </>
  );
}

function FilaServicio({ servicio, alElegir }: { servicio: Servicio; alElegir: (s: Servicio) => void }) {
  return (
    <button
      type="button"
      onClick={() => alElegir(servicio)}
      className="flex w-full items-center justify-between gap-4 border-b border-separador px-4 py-3 text-left last:border-0 hover:bg-superficie-2/50"
    >
      <span className="flex min-w-0 flex-col">
        <span
          className={servicio.activo ? "text-cuerpo font-medium" : "text-cuerpo font-medium text-texto-2"}
        >
          {servicio.nombre}
        </span>
        <span className="truncate text-rotulo text-texto-2">
          {formatoDuracion(servicio.duracionMinutos)}
          {servicio.descripcion ? ` · ${servicio.descripcion}` : ""}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-cuerpo font-semibold">{formatoDinero(servicio.precio)}</span>
        <span aria-hidden className="text-texto-2">
          ›
        </span>
      </span>
    </button>
  );
}
