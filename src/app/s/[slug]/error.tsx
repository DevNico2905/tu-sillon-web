"use client";

import { Boton } from "@/components/ui/boton";

/** Error inesperado al cargar el salón (red caída, API sin responder). SPEC-WEB §3.4. */
export default function ErrorSalon({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-titulo font-bold">No pudimos cargar el salón.</h1>
      <p className="max-w-sm text-cuerpo text-texto-2">Revisa tu internet e intenta de nuevo.</p>
      <Boton onClick={() => retry()}>Intentar de nuevo</Boton>
    </div>
  );
}
