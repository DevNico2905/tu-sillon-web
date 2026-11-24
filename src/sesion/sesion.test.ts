import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { peticion } from "@/api/cliente";
import type { RespuestaAuth } from "@/api/tipos";
import {
  borrarSesion,
  cerrarSesion,
  iniciarSesion,
  obtenerMotivoSalida,
  obtenerSesion,
  refrescarSesion,
} from "./sesion";

const API = "http://localhost:8080";

const AUTH: RespuestaAuth = {
  token: "access-1",
  tipo: "Bearer",
  expiraEnMinutos: 15,
  usuarioId: 1,
  nombre: "Dueño",
  rol: "DUENO",
  salonId: 9,
  salonSlug: "barberia-centro",
};

function respuestaJson(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

describe("sesión", () => {
  const fetchFalso = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", API);
    vi.stubGlobal("fetch", fetchFalso);
    borrarSesion("salida");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchFalso.mockReset();
  });

  it("guarda el token en memoria con su vencimiento", () => {
    iniciarSesion(AUTH, 1_000);
    expect(obtenerSesion()).toMatchObject({ token: "access-1", expiraEn: 1_000 + 15 * 60_000 });
    expect(obtenerSesion()?.usuario.rol).toBe("DUENO");
  });

  it("S3: varias peticiones en paralelo comparten un solo refresh", async () => {
    fetchFalso.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return respuestaJson(200, { ...AUTH, token: "access-2" });
    });
    const resultados = await Promise.all([refrescarSesion(), refrescarSesion(), refrescarSesion()]);
    expect(resultados).toEqual([true, true, true]);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(obtenerSesion()?.token).toBe("access-2");
  });

  it("S3: tres 401 a la vez terminan en un refresh y tres reintentos", async () => {
    iniciarSesion(AUTH);
    let refrescos = 0;
    fetchFalso.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/api/auth/refresh")) {
        refrescos++;
        await new Promise((r) => setTimeout(r, 10));
        return respuestaJson(200, { ...AUTH, token: "access-2" });
      }
      const autorizacion = (init?.headers as Headers).get("Authorization");
      return autorizacion === "Bearer access-2" ? respuestaJson(200, { ok: true }) : respuestaJson(401, {});
    });
    const respuestas = await Promise.all([peticion("/api/a"), peticion("/api/b"), peticion("/api/c")]);
    expect(respuestas).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refrescos).toBe(1);
  });

  it("S4: si el refresh responde 401, borra la sesión y marca que expiró", async () => {
    iniciarSesion(AUTH);
    fetchFalso.mockResolvedValue(respuestaJson(401, { mensaje: "Sesión inválida" }));
    await expect(refrescarSesion()).resolves.toBe(false);
    expect(obtenerSesion()).toBeNull();
    expect(obtenerMotivoSalida()).toBe("expirada");
  });

  it("un error de red en el refresh no borra la sesión", async () => {
    iniciarSesion(AUTH);
    fetchFalso.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(refrescarSesion()).rejects.toMatchObject({ codigo: 0 });
    expect(obtenerSesion()?.token).toBe("access-1");
  });

  it("S6: cerrar sesión llama al logout y borra la sesión aunque la API falle", async () => {
    iniciarSesion(AUTH);
    fetchFalso.mockRejectedValue(new TypeError("Failed to fetch"));
    await cerrarSesion();
    expect(String(fetchFalso.mock.calls[0][0])).toBe(`${API}/api/auth/logout`);
    expect(obtenerSesion()).toBeNull();
    expect(obtenerMotivoSalida()).toBe("salida");
  });
});
