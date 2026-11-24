"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Usuario } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { cerrarSesion, obtenerMotivoSalida, obtenerSesion, refrescarSesion, suscribirSesion } from "./sesion";

interface ContextoSesion {
  usuario: Usuario;
  salir: () => Promise<void>;
}

const Contexto = createContext<ContextoSesion | null>(null);

/** Usuario de la sesión. Solo existe dentro de /panel, debajo de ProveedorSesion. */
export function useSesion(): ContextoSesion {
  const valor = use(Contexto);
  if (!valor) throw new Error("useSesion se usa dentro de ProveedorSesion");
  return valor;
}

const sinSesionEnServidor = () => null;

/** Un minuto antes de que venza el access token se pide uno nuevo (S5). */
const ANTICIPO_MS = 60_000;

/**
 * Protege /panel (S2, S4, S5, S7). No muestra nada del panel hasta tener sesión:
 * el middleware de Next no ve la cookie del refresh porque es de la API.
 */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const sesion = useSyncExternalStore(suscribirSesion, obtenerSesion, sinSesionEnServidor);
  const router = useRouter();
  const ruta = usePathname();
  const clienteQuery = useQueryClient();
  const [sinConexion, setSinConexion] = useState(false);
  const [intento, setIntento] = useState(0);

  const irAEntrar = useCallback(
    (expirada: boolean) => {
      const parametros = new URLSearchParams({ volver: ruta });
      if (expirada) parametros.set("motivo", "expirada");
      router.replace(`/entrar?${parametros.toString()}`);
    },
    [router, ruta],
  );

  // S2: sin sesión en memoria (recarga o enlace directo), se intenta restaurar con la cookie.
  // S4: si la sesión se pierde estando en el panel, se vuelve a /entrar.
  useEffect(() => {
    if (sesion) return;
    const motivo = obtenerMotivoSalida();
    if (motivo) {
      clienteQuery.clear();
      irAEntrar(motivo === "expirada");
      return;
    }
    let vigente = true;
    refrescarSesion()
      .then((ok) => {
        if (vigente && !ok) irAEntrar(false);
      })
      .catch(() => {
        if (vigente) setSinConexion(true);
      });
    return () => {
      vigente = false;
    };
  }, [sesion, irAEntrar, clienteQuery, intento]);

  // S5: refresh preventivo, solo con la pestaña visible.
  const expiraEn = sesion?.expiraEn;
  useEffect(() => {
    if (!expiraEn) return;
    const refrescarSiToca = () => {
      if (document.visibilityState === "visible" && Date.now() >= expiraEn - ANTICIPO_MS) {
        void refrescarSesion().catch(() => undefined);
      }
    };
    const temporizador = window.setTimeout(refrescarSiToca, Math.max(0, expiraEn - ANTICIPO_MS - Date.now()));
    document.addEventListener("visibilitychange", refrescarSiToca);
    return () => {
      window.clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", refrescarSiToca);
    };
  }, [expiraEn]);

  // S6: cerrar sesión borra el token, la caché de datos y vuelve a /entrar.
  const salir = useCallback(async () => {
    await cerrarSesion();
    clienteQuery.clear();
    router.replace("/entrar");
  }, [clienteQuery, router]);

  if (!sesion) {
    if (sinConexion) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-cuerpo">Sin conexión. Revisa tu internet e intenta de nuevo.</p>
          <Boton
            onClick={() => {
              setSinConexion(false);
              setIntento((n) => n + 1);
            }}
          >
            Intentar de nuevo
          </Boton>
        </div>
      );
    }
    return (
      <div
        aria-busy="true"
        aria-label="Abriendo tu panel"
        className="flex flex-1 items-center justify-center p-8"
      >
        <div className="size-8 animate-pulse rounded-full bg-superficie-2" />
      </div>
    );
  }

  return <Contexto value={{ usuario: sesion.usuario, salir }}>{children}</Contexto>;
}
