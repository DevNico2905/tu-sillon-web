import type { Metadata } from "next";
import { Clientes } from "@/components/gestion/clientes";

export const metadata: Metadata = { title: "Clientes" };

export default function Pagina() {
  return <Clientes />;
}
