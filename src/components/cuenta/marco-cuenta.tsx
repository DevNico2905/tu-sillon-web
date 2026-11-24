import Link from "next/link";
import type { ReactNode } from "react";

/** Marco de /entrar y /registro: columna angosta centrada con la marca arriba. */
export function MarcoCuenta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-10 md:py-16">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-rotulo font-semibold text-texto-2">
          Sillón
        </Link>
        <h1 className="text-titulo-grande font-bold">{titulo}</h1>
      </header>
      {children}
    </main>
  );
}
