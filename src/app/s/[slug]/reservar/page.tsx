import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { catalogoEnCache } from "@/api/catalogo-servidor";
import { FormularioReserva } from "@/components/salon/formulario-reserva";

export const metadata: Metadata = { title: "Tus datos", robots: { index: false } };

/** Tus datos y confirmar (SPEC-WEB §5.2). */
export default function PaginaReservar({ params }: PageProps<"/s/[slug]/reservar">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo font-bold">Tus datos</h1>
      <Suspense
        fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-grupo bg-superficie" />}
      >
        <Contenido params={params} />
      </Suspense>
    </div>
  );
}

async function Contenido({ params }: Pick<PageProps<"/s/[slug]/reservar">, "params">) {
  const { slug } = await params;
  const catalogo = await catalogoEnCache(slug);
  if (!catalogo) notFound();
  return (
    <>
      <p className="-mt-4 text-cuerpo text-texto-2">
        <Link href={`/s/${slug}`} className="text-acento">
          {catalogo.nombre}
        </Link>
      </p>
      <FormularioReserva catalogo={catalogo} />
    </>
  );
}
