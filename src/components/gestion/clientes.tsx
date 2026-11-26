"use client";

import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { listarClientes } from "@/api/gestion";
import type { Cliente } from "@/api/tipos";
import { CabeceraPanel } from "@/components/panel/pantalla-pronto";
import { Grupo } from "@/components/ui/grupo";
import { enlaceWhatsapp } from "@/lib/agenda";
import { formatoTelefono, telefonoParaEnviar } from "@/lib/formato";
import { filtrarClientes } from "@/lib/gestion";
import { CargandoLista, FalloCarga, ListaVacia } from "./estados";

/** Clientes del salón (SPEC-WEB §5.7, R11): solo lectura, con búsqueda local. Nacen al agendar. */
export function Clientes() {
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listarClientes });
  const [busqueda, setBusqueda] = useState("");
  const consulta = useDeferredValue(busqueda);
  const visibles = filtrarClientes(clientes.data ?? [], consulta);
  const total = clientes.data?.length ?? 0;

  return (
    <>
      <CabeceraPanel titulo="Clientes">
        <p className="text-cuerpo text-texto-2">
          Cada persona que reserva en línea o que agendas desde el salón queda aquí.
        </p>
      </CabeceraPanel>

      <div className="flex max-w-3xl flex-col gap-4 px-5 pb-10 md:px-8">
        {clientes.isPending && <CargandoLista filas={5} />}
        {clientes.isError && (
          <FalloCarga mensaje={clientes.error.message} alReintentar={() => void clientes.refetch()} />
        )}
        {clientes.data && total === 0 && (
          <ListaVacia
            titulo="Todavía no tienes clientes"
            texto="Aparecen solos cuando alguien reserva en tu página o cuando creas una cita desde la agenda."
          />
        )}
        {total > 0 && (
          <>
            <label htmlFor="buscar-cliente" className="sr-only">
              Buscar cliente
            </label>
            <input
              id="buscar-cliente"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por nombre o celular"
              autoComplete="off"
              className="min-h-11 w-full rounded-control bg-superficie-2 px-4 text-destacado outline-none placeholder:text-texto-2"
            />
            <Grupo
              rotulo={
                consulta.trim()
                  ? `${visibles.length} de ${total}`
                  : `${total} ${total === 1 ? "cliente" : "clientes"}`
              }
            >
              {visibles.map((cliente) => (
                <FilaCliente key={cliente.id} cliente={cliente} />
              ))}
              {visibles.length === 0 && (
                <p className="px-4 py-4 text-cuerpo text-texto-2">Nadie coincide con “{consulta.trim()}”.</p>
              )}
            </Grupo>
          </>
        )}
      </div>
    </>
  );
}

function FilaCliente({ cliente }: { cliente: Cliente }) {
  const telefono = telefonoParaEnviar(cliente.telefono);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-separador px-4 py-3 last:border-0">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-cuerpo font-medium">{cliente.nombre}</span>
        <span className="text-rotulo text-texto-2">{formatoTelefono(cliente.telefono)}</span>
      </div>
      <div className="flex shrink-0 gap-1">
        <a
          href={`tel:${telefono}`}
          aria-label={`Llamar a ${cliente.nombre}`}
          className="flex min-h-11 items-center rounded-control px-3 text-rotulo font-semibold text-acento hover:bg-superficie-2"
        >
          Llamar
        </a>
        <a
          href={enlaceWhatsapp(telefono, "")}
          target="_blank"
          rel="noreferrer"
          aria-label={`Escribir por WhatsApp a ${cliente.nombre}`}
          className="flex min-h-11 items-center rounded-control px-3 text-rotulo font-semibold text-acento hover:bg-superficie-2"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
