import type { Metadata } from "next";
import { Configuracion } from "@/components/gestion/configuracion";

export const metadata: Metadata = { title: "Configuración" };

export default function Pagina() {
  return <Configuracion />;
}
