import type { Metadata } from "next";
import { Equipo } from "@/components/gestion/equipo";

export const metadata: Metadata = { title: "Equipo" };

export default function Pagina() {
  return <Equipo />;
}
