import type { Metadata } from "next";
import { Suspense } from "react";
import { Agenda } from "@/components/agenda/agenda";
import { Bienvenida } from "@/components/panel/bienvenida";

export const metadata: Metadata = { title: "Agenda" };

/** Agenda del día (SPEC-WEB §5.6). La fecha vive en la URL: ?fecha=2026-11-23. */
export default function PaginaAgenda() {
  return (
    <Suspense>
      <Bienvenida />
      <Agenda />
    </Suspense>
  );
}
