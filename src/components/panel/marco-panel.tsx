"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { obtenerMiSalon } from "@/api/auth";
import { puedeVer, seccionesDe } from "@/lib/navegacion-panel";
import { iniciales } from "@/lib/texto";
import { cn } from "@/lib/utils";
import { useSesion } from "@/sesion/proveedor-sesion";

/**
 * Esqueleto del panel (SPEC-WEB §5.6): menú lateral en escritorio (≥ 1024 px)
 * y barra de pestañas en celular. Las secciones dependen del rol (S8).
 */
export function MarcoPanel({ children }: { children: ReactNode }) {
  const { usuario, salir } = useSesion();
  const ruta = usePathname();
  const secciones = seccionesDe(usuario.rol);
  const esDueno = usuario.rol === "DUENO";
  const salon = useQuery({ queryKey: ["salon"], queryFn: obtenerMiSalon, enabled: esDueno });

  const nombreSalon = salon.data?.nombre ?? (esDueno ? "" : usuario.nombre);
  const activa = (destino: string) => ruta === destino || ruta.startsWith(`${destino}/`);

  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-separador bg-superficie lg:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <div
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-control bg-texto text-cuerpo font-bold text-fondo"
          >
            {nombreSalon ? iniciales(nombreSalon) : ""}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-cuerpo font-semibold">{nombreSalon || " "}</span>
            <span className="text-nota text-texto-2">
              {esDueno
                ? salon.data
                  ? `Plan ${salon.data.plan === "PRO" ? "Pro" : "Gratis"}`
                  : " "
                : "Estilista"}
            </span>
          </div>
        </div>
        <nav aria-label="Panel" className="flex flex-1 flex-col gap-0.5 px-3">
          {secciones.map((seccion) => (
            <Link
              key={seccion.ruta}
              href={seccion.ruta}
              aria-current={activa(seccion.ruta) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-control px-3 text-cuerpo",
                activa(seccion.ruta)
                  ? "bg-acento-suave font-semibold text-acento"
                  : "text-texto hover:bg-fondo",
              )}
            >
              {seccion.titulo}
            </Link>
          ))}
        </nav>
        <div className="border-t border-separador p-3">
          <p className="truncate px-3 pb-2 text-nota text-texto-2">{usuario.nombre}</p>
          <button
            type="button"
            onClick={() => void salir()}
            className="flex min-h-11 w-full items-center rounded-control px-3 text-cuerpo text-peligro hover:bg-fondo"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {puedeVer(usuario.rol, ruta) ? (
          children
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <h1 className="text-seccion font-bold">No tienes acceso a esta sección</h1>
            <Link href="/panel/agenda" className="text-cuerpo font-semibold text-acento">
              Ir a la agenda
            </Link>
          </div>
        )}
      </div>

      <nav
        aria-label="Panel"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-separador bg-fondo/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px] lg:hidden"
      >
        {[...secciones.filter((s) => s.enPestanas), { ruta: "/panel/mas", titulo: "Más" }].map((pestana) => (
          <Link
            key={pestana.ruta}
            href={pestana.ruta}
            aria-current={activa(pestana.ruta) ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 items-center justify-center text-rotulo",
              activa(pestana.ruta) ? "font-semibold text-acento" : "text-texto-2",
            )}
          >
            {pestana.titulo}
          </Link>
        ))}
      </nav>
    </div>
  );
}
