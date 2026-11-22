"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorApi } from "@/api/cliente";

let clienteNavegador: QueryClient | undefined;

function crearCliente() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Un 4xx no se arregla reintentando: solo se reintentan la red y los 5xx.
        retry: (intentos, error) =>
          intentos < 2 && (!(error instanceof ErrorApi) || error.codigo === 0 || error.codigo >= 500),
      },
    },
  });
}

// Un cliente nuevo por render en el servidor; uno solo en el navegador.
function obtenerCliente() {
  if (typeof window === "undefined") return crearCliente();
  clienteNavegador ??= crearCliente();
  return clienteNavegador;
}

export function Proveedores({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={obtenerCliente()}>{children}</QueryClientProvider>;
}
