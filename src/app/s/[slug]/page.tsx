import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { catalogoEnCache } from "@/api/catalogo-servidor";
import { CabeceraSalon, EsqueletoSalon } from "@/components/salon/cabecera-salon";
import { ReservaSalon } from "@/components/salon/reserva-salon";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const catalogo = await catalogoEnCache(slug);
  if (!catalogo) return { title: "Salón no encontrado" };
  const descripcion = `Reserva tu cita en ${catalogo.nombre}, ${catalogo.ciudad}. ${catalogo.horario}.`;
  return {
    title: catalogo.nombre,
    description: descripcion,
    openGraph: { title: catalogo.nombre, description: descripcion, type: "website", locale: "es_CO" },
  };
}

/** Página del salón (SPEC-WEB §5.1). El slug se resuelve al pedir la página, dentro de Suspense. */
export default function PaginaSalon({ params }: PageProps<"/s/[slug]">) {
  return (
    <Suspense fallback={<EsqueletoSalon />}>
      <ContenidoSalon params={params} />
    </Suspense>
  );
}

async function ContenidoSalon({ params }: Pick<PageProps<"/s/[slug]">, "params">) {
  const { slug } = await params;
  const catalogo = await catalogoEnCache(slug);
  if (!catalogo) notFound();
  return (
    <div className="flex flex-col gap-8">
      <CabeceraSalon catalogo={catalogo} />
      <ReservaSalon catalogo={catalogo} />
    </div>
  );
}
