"use client";

import { useState } from "react";

/** Copia al portapapeles y deja `copiado` en true durante 2 s para mostrar "Copiado". */
export function useCopiar() {
  const [copiado, setCopiado] = useState(false);
  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }
  return { copiado, copiar };
}
