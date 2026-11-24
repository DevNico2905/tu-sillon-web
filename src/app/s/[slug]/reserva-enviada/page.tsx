import type { Metadata } from "next";
import { Suspense } from "react";
import { ReservaEnviada } from "@/components/salon/reserva-enviada";

export const metadata: Metadata = { title: "Reserva enviada", robots: { index: false } };

/** Confirmación (SPEC-WEB §5.3). Todo se lee en el navegador: no hay nada que prerenderizar. */
export default function PaginaReservaEnviada({ params }: PageProps<"/s/[slug]/reserva-enviada">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-grupo bg-superficie" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: Pick<PageProps<"/s/[slug]/reserva-enviada">, "params">) {
  const { slug } = await params;
  return <ReservaEnviada slug={slug} />;
}
