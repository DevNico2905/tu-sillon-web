"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { listarEstilistas, listarServicios } from "@/api/gestion";
import type { Estilista } from "@/api/tipos";
import { CabeceraPanel } from "@/components/panel/pantalla-pronto";
import { Boton } from "@/components/ui/boton";
import { Grupo } from "@/components/ui/grupo";
import { iniciales } from "@/lib/texto";
import { CargandoLista, FalloCarga, ListaVacia } from "./estados";
import { HojaEstilista } from "./hoja-estilista";

/** Equipo del salón (SPEC-WEB §5.7, R43): activos arriba, desactivados abajo. */
export function Equipo() {
  const estilistas = useQuery({ queryKey: ["estilistas"], queryFn: listarEstilistas });
  const servicios = useQuery({ queryKey: ["servicios"], queryFn: listarServicios });
  const [editando, setEditando] = useState<Estilista | "nuevo" | null>(null);

  const ordenados = [...(estilistas.data ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const activos = ordenados.filter((e) => e.activo);
  const inactivos = ordenados.filter((e) => !e.activo);
  const sinServicios = servicios.data?.filter((s) => s.activo).length === 0;
  const listo = estilistas.data && servicios.data;

  return (
    <>
      <CabeceraPanel
        titulo="Equipo"
        accion={listo && !sinServicios && <Boton onClick={() => setEditando("nuevo")}>Agregar persona</Boton>}
      >
        <p className="text-cuerpo text-texto-2">
          Quienes atienden en tu salón. Cada persona entra con su correo y ve solo su agenda.
        </p>
      </CabeceraPanel>

      <div className="flex max-w-3xl flex-col gap-6 px-5 pb-10 md:px-8">
        {(estilistas.isPending || servicios.isPending) && <CargandoLista />}
        {estilistas.isError && (
          <FalloCarga mensaje={estilistas.error.message} alReintentar={() => void estilistas.refetch()} />
        )}
        {servicios.isError && (
          <FalloCarga mensaje={servicios.error.message} alReintentar={() => void servicios.refetch()} />
        )}
        {listo && sinServicios && (
          <ListaVacia
            titulo="Primero crea un servicio"
            texto="Cada persona del equipo ofrece al menos un servicio. Crea los tuyos y vuelve aquí."
          >
            <Boton comoHijo variante="secundario">
              <Link href="/panel/servicios">Ir a servicios</Link>
            </Boton>
          </ListaVacia>
        )}
        {listo && !sinServicios && estilistas.data.length === 0 && (
          <ListaVacia
            titulo="Todavía no hay nadie en tu equipo"
            texto="Agrega a tus barberos para que reciban reservas y vean su agenda."
          >
            <Boton onClick={() => setEditando("nuevo")}>Agregar persona</Boton>
          </ListaVacia>
        )}
        {activos.length > 0 && (
          <Grupo rotulo={`Activos · ${activos.length}`}>
            {activos.map((estilista) => (
              <FilaEstilista key={estilista.id} estilista={estilista} alElegir={setEditando} />
            ))}
          </Grupo>
        )}
        {inactivos.length > 0 && (
          <Grupo rotulo={`Desactivados · ${inactivos.length}`}>
            {inactivos.map((estilista) => (
              <FilaEstilista key={estilista.id} estilista={estilista} alElegir={setEditando} />
            ))}
          </Grupo>
        )}
      </div>

      {servicios.data && (
        <HojaEstilista estilista={editando} servicios={servicios.data} alCerrar={() => setEditando(null)} />
      )}
    </>
  );
}

function FilaEstilista({ estilista, alElegir }: { estilista: Estilista; alElegir: (e: Estilista) => void }) {
  return (
    <button
      type="button"
      onClick={() => alElegir(estilista)}
      className="flex w-full items-center gap-3 border-b border-separador px-4 py-3 text-left last:border-0 hover:bg-superficie-2/50"
    >
      <span
        aria-hidden
        className={
          estilista.activo
            ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-acento-suave text-rotulo font-semibold text-acento"
            : "flex size-10 shrink-0 items-center justify-center rounded-full bg-superficie-2 text-rotulo font-semibold text-texto-2"
        }
      >
        {iniciales(estilista.nombre)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={estilista.activo ? "text-cuerpo font-medium" : "text-cuerpo font-medium text-texto-2"}
        >
          {estilista.nombre}
        </span>
        <span className="truncate text-rotulo text-texto-2">{estilista.email}</span>
        <span className="truncate text-rotulo text-texto-2">{estilista.servicios.join(" · ")}</span>
      </span>
      <span aria-hidden className="text-texto-2">
        ›
      </span>
    </button>
  );
}
