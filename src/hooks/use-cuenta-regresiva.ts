"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Cuenta regresiva del 429 (SPEC-WEB §3.4). `iniciar(segundos)` la arranca y
 * `restante` dice cuántos segundos faltan (0 cuando ya se puede reintentar).
 */
export function useCuentaRegresiva() {
  const [hasta, setHasta] = useState<number | null>(null);
  // Arranca en 0: solo se usa cuando hay cuenta, y `iniciar` lo fija. Leer el reloj al renderizar
  // impediría prerenderizar las páginas que usan este hook.
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    if (hasta === null) return;
    const intervalo = window.setInterval(() => {
      const momento = Date.now();
      setAhora(momento);
      if (momento >= hasta) setHasta(null);
    }, 250);
    return () => window.clearInterval(intervalo);
  }, [hasta]);

  const iniciar = useCallback((segundos: number) => {
    const momento = Date.now();
    setAhora(momento);
    setHasta(momento + segundos * 1000);
  }, []);

  const restante = hasta === null ? 0 : Math.max(0, Math.ceil((hasta - ahora) / 1000));
  return { restante, iniciar };
}
