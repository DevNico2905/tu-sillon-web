"use client";

import { useSyncExternalStore } from "react";

function suscribirMinuto(avisar: () => void) {
  const intervalo = window.setInterval(avisar, 30_000);
  return () => window.clearInterval(intervalo);
}
const minutoActual = () => Math.floor(Date.now() / 60_000);
const sinValor = () => null;

/**
 * Minuto actual (ms redondeados al minuto) que se actualiza solo. En el servidor
 * vale null: la hora real solo se conoce en el navegador.
 */
export function useAhora(): Date | null {
  const minuto = useSyncExternalStore(suscribirMinuto, minutoActual, sinValor);
  return minuto === null ? null : new Date(minuto * 60_000);
}

const CONSULTA_ESCRITORIO = "(min-width: 1024px)";

function suscribirAncho(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_ESCRITORIO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

/** true con 1024 px o más (el corte `lg:` de Tailwind). En el servidor, false. */
export function useEsEscritorio(): boolean {
  return useSyncExternalStore(
    suscribirAncho,
    () => window.matchMedia(CONSULTA_ESCRITORIO).matches,
    () => false,
  );
}
