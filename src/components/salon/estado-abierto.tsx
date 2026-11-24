"use client";

import { useSyncExternalStore } from "react";
import { estaAbierto, type HorarioSalon } from "@/lib/horario";

// Se recalcula cada minuto. En el servidor no hay "ahora" confiable: no se muestra nada.
function suscribir(avisar: () => void) {
  const intervalo = window.setInterval(avisar, 60_000);
  return () => window.clearInterval(intervalo);
}
const minutoActual = () => Math.floor(Date.now() / 60_000);
const sinHora = () => null;

/** "Abierto" o "Cerrado" según la hora de Bogotá (SPEC-WEB §5.1). */
export function EstadoAbierto({ horario }: { horario: HorarioSalon }) {
  const minuto = useSyncExternalStore(suscribir, minutoActual, sinHora);
  if (minuto === null) return null;
  const abierto = estaAbierto(horario, new Date(minuto * 60_000));
  return (
    <span className={abierto ? "font-medium text-exito" : "font-medium text-texto-2"}>
      {abierto ? "Abierto" : "Cerrado"}
    </span>
  );
}
