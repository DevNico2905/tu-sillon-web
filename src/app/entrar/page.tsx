import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioEntrar } from "@/components/cuenta/formulario-entrar";
import { MarcoCuenta } from "@/components/cuenta/marco-cuenta";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <MarcoCuenta titulo="Entrar">
      <Suspense>
        <FormularioEntrar />
      </Suspense>
    </MarcoCuenta>
  );
}
