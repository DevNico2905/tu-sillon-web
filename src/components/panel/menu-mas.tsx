"use client";

import Link from "next/link";
import { seccionesDe } from "@/lib/navegacion-panel";
import { useSesion } from "@/sesion/proveedor-sesion";
import { CabeceraPanel } from "./pantalla-pronto";

/** Pestaña "Más" del celular: las secciones que no caben en la barra y cerrar sesión. */
export function MenuMas() {
  const { usuario, salir } = useSesion();
  const resto = seccionesDe(usuario.rol).filter((s) => !s.enPestanas);
  return (
    <>
      <CabeceraPanel titulo="Más">
        <p className="text-cuerpo text-texto-2">{usuario.nombre}</p>
      </CabeceraPanel>
      <div className="flex flex-col gap-6 px-5 md:px-8">
        {resto.length > 0 && (
          <ul className="overflow-hidden rounded-grupo bg-superficie">
            {resto.map((seccion) => (
              <li key={seccion.ruta} className="border-b border-separador last:border-0">
                <Link href={seccion.ruta} className="flex min-h-12 items-center px-4 text-destacado">
                  {seccion.titulo}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => void salir()}
          className="min-h-12 rounded-grupo bg-superficie px-4 text-left text-destacado text-peligro"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
