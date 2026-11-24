import type { ReactNode } from "react";

/** Marco de las páginas públicas del salón: columna angosta, primero celular (SPEC-WEB §4.3). */
export default function LayoutSalon({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-6 md:px-8 md:py-10">
        {children}
      </main>
      <footer className="pb-6 text-center text-nota text-texto-2">Con Sillón</footer>
    </div>
  );
}
