import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configurarToken, ErrorApi, peticion, separarCampos } from "./cliente";

const API = "http://localhost:8080";

function respuestaJson(status: number, cuerpo: unknown, cabeceras: Record<string, string> = {}) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json", ...cabeceras },
  });
}

describe("peticion", () => {
  const fetchFalso = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", API);
    vi.stubGlobal("fetch", fetchFalso);
    configurarToken(() => null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchFalso.mockReset();
  });

  it("arma la URL con la consulta y omite los valores vacíos", async () => {
    fetchFalso.mockResolvedValue(respuestaJson(200, []));
    await peticion("/api/publico/salones/barberia/disponibilidad", {
      consulta: { servicioId: 3, estilistaId: undefined, fecha: "2026-11-23" },
    });
    expect(fetchFalso.mock.calls[0][0]).toBe(
      `${API}/api/publico/salones/barberia/disponibilidad?servicioId=3&fecha=2026-11-23`,
    );
  });

  it("envía el token si hay sesión", async () => {
    configurarToken(() => "abc");
    fetchFalso.mockResolvedValue(respuestaJson(200, {}));
    await peticion("/api/salon");
    const cabeceras = fetchFalso.mock.calls[0][1]?.headers as Headers;
    expect(cabeceras.get("Authorization")).toBe("Bearer abc");
  });

  it("solo incluye credenciales en /api/auth/*", async () => {
    fetchFalso.mockImplementation(async () => respuestaJson(200, {}));
    await peticion("/api/auth/refresh", { metodo: "POST" });
    await peticion("/api/salon");
    expect(fetchFalso.mock.calls[0][1]?.credentials).toBe("include");
    expect(fetchFalso.mock.calls[1][1]?.credentials).toBe("omit");
  });

  it("convierte un 409 en ErrorApi con el mensaje del backend", async () => {
    fetchFalso.mockResolvedValue(
      respuestaJson(409, {
        codigo: 409,
        error: "Conflict",
        mensaje: "Ese horario ya está ocupado",
        fecha: "2026-11-22T10:00:00",
      }),
    );
    const error = await peticion("/api/citas").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).codigo).toBe(409);
    expect((error as ErrorApi).message).toBe("Ese horario ya está ocupado");
  });

  it("separa por campo los mensajes de un 400", async () => {
    fetchFalso.mockResolvedValue(
      respuestaJson(400, {
        codigo: 400,
        mensaje: "clienteNombre: es obligatorio; clienteTelefono: debe tener entre 7 y 30 caracteres",
      }),
    );
    const error = (await peticion("/api/x").catch((e: unknown) => e)) as ErrorApi;
    expect(error.campos).toEqual({
      clienteNombre: "es obligatorio",
      clienteTelefono: "debe tener entre 7 y 30 caracteres",
    });
  });

  it("lee Retry-After de un 429", async () => {
    fetchFalso.mockResolvedValue(
      respuestaJson(429, { mensaje: "Demasiadas peticiones" }, { "Retry-After": "42" }),
    );
    const error = (await peticion("/api/auth/login").catch((e: unknown) => e)) as ErrorApi;
    expect(error.codigo).toBe(429);
    expect(error.reintentarEn).toBe(42);
  });

  it("sin conexión responde código 0 y el mensaje de la SPEC", async () => {
    fetchFalso.mockRejectedValue(new TypeError("Failed to fetch"));
    const error = (await peticion("/api/salon").catch((e: unknown) => e)) as ErrorApi;
    expect(error.codigo).toBe(0);
    expect(error.message).toBe("Sin conexión. Revisa tu internet e intenta de nuevo.");
  });

  it("usa un mensaje por defecto si el error no trae cuerpo", async () => {
    fetchFalso.mockResolvedValue(new Response(null, { status: 403 }));
    const error = (await peticion("/api/salon").catch((e: unknown) => e)) as ErrorApi;
    expect(error.message).toBe("No tienes permiso para hacer esto.");
  });

  it("devuelve undefined en un 204", async () => {
    fetchFalso.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(peticion("/api/auth/logout", { metodo: "POST" })).resolves.toBeUndefined();
  });
});

describe("separarCampos", () => {
  it("ignora lo que no tiene forma de campo", () => {
    expect(separarCampos("Error inesperado del servidor")).toEqual({});
  });
});
