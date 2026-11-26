import type { Metadata } from "next";
import { Servicios } from "@/components/gestion/servicios";

export const metadata: Metadata = { title: "Servicios" };

export default function Pagina() {
  return <Servicios />;
}
