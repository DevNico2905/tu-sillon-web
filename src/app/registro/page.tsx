import type { Metadata } from "next";
import { FormularioRegistro } from "@/components/cuenta/formulario-registro";
import { MarcoCuenta } from "@/components/cuenta/marco-cuenta";

export const metadata: Metadata = { title: "Crea tu salón" };

export default function PaginaRegistro() {
  return (
    <MarcoCuenta titulo="Crea tu salón">
      <FormularioRegistro />
    </MarcoCuenta>
  );
}
