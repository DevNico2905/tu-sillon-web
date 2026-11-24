import { describe, expect, it } from "vitest";
import { esquemaDatosChat, esquemaDatosReserva, esquemaRegistro, fortalezaContrasena } from "./validacion";

describe("esquemaDatosReserva", () => {
  it("acepta datos válidos y recorta espacios", () => {
    const resultado = esquemaDatosReserva.parse({ nombre: "  Ana  ", celular: "300 123 4567", nota: "" });
    expect(resultado.nombre).toBe("Ana");
  });

  it("exige nombre y celular", () => {
    const resultado = esquemaDatosReserva.safeParse({ nombre: " ", celular: "", nota: "" });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues.map((i) => i.path[0])).toEqual(["nombre", "celular"]);
  });

  it("rechaza un celular de menos de 7 dígitos y una nota larga", () => {
    expect(esquemaDatosReserva.safeParse({ nombre: "Ana", celular: "12345", nota: "" }).success).toBe(false);
    expect(
      esquemaDatosReserva.safeParse({ nombre: "Ana", celular: "3001234567", nota: "x".repeat(301) }).success,
    ).toBe(false);
  });
});

describe("esquemaDatosChat", () => {
  it("limita el contacto a 120 caracteres", () => {
    expect(esquemaDatosChat.safeParse({ nombre: "Ana", contacto: "a".repeat(121) }).success).toBe(false);
    expect(esquemaDatosChat.safeParse({ nombre: "Ana", contacto: "ana@correo.co" }).success).toBe(true);
  });
});

describe("registro", () => {
  const valido = {
    salonNombre: "Barbería Centro",
    ciudad: "Rionegro",
    direccion: "Calle 50",
    telefono: "3001234567",
    nombre: "Nick",
    email: "nick@correo.co",
    password: "clave-segura-123",
  };

  it("acepta un registro completo", () => {
    expect(esquemaRegistro.safeParse(valido).success).toBe(true);
  });

  it("rechaza correo inválido y contraseña corta o de más de 72", () => {
    expect(esquemaRegistro.safeParse({ ...valido, email: "nick" }).success).toBe(false);
    expect(esquemaRegistro.safeParse({ ...valido, password: "corta" }).success).toBe(false);
    expect(esquemaRegistro.safeParse({ ...valido, password: "x".repeat(73) }).success).toBe(false);
  });
});

describe("fortalezaContrasena", () => {
  it.each([
    ["abc", 0],
    ["abcdefgh", 1],
    ["abcdefgh12", 1],
    ["Abcdefgh12", 2],
    ["Abcdefgh12!x", 3],
  ] as const)("%s → nivel %d", (contrasena, nivel) => {
    expect(fortalezaContrasena(contrasena).nivel).toBe(nivel);
  });
});
