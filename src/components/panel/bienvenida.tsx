"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSesion } from "@/sesion/proveedor-sesion";
import { primerNombre } from "@/lib/texto";

/** Aviso después del registro (SPEC-WEB §5.5): lleva a crear servicios y equipo. */
export function Bienvenida() {
  const parametros = useSearchParams();
  const { usuario } = useSesion();
  if (parametros.get("bienvenida") !== "1" || usuario.rol !== "DUENO") return null;
  return (
    <div className="px-5 pt-6 md:px-8">
      <div className="flex flex-col gap-2 rounded-grupo bg-acento-suave p-5">
        <p className="text-destacado font-semibold">
          Te damos la bienvenida a Sillón, {primerNombre(usuario.nombre)}
        </p>
        <p className="text-cuerpo text-texto-2">
          Para recibir reservas, crea tus servicios y agrega a tu equipo. Tu página pública ya existe en{" "}
          <Link href={`/s/${usuario.salonSlug}`} className="font-semibold text-acento">
            /s/{usuario.salonSlug}
          </Link>
          .
        </p>
        <div className="flex gap-4 pt-1">
          <Link href="/panel/servicios" className="text-cuerpo font-semibold text-acento">
            Crear servicios
          </Link>
          <Link href="/panel/equipo" className="text-cuerpo font-semibold text-acento">
            Agregar equipo
          </Link>
        </div>
      </div>
    </div>
  );
}
