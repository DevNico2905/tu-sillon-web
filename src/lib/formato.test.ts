import { describe, expect, it } from "vitest";
import {
  formatoDinero,
  formatoDuracion,
  formatoFechaCorta,
  formatoFechaLarga,
  formatoFechaMedia,
  formatoHora,
  formatoTelefono,
  hoyEnBogota,
  sumarDias,
  telefonoParaEnviar,
} from "./formato";

describe("formatoDinero", () => {
  it.each([
    [35000, "$35.000"],
    [1500000, "$1.500.000"],
    [900, "$900"],
    [0, "$0"],
    [35000.6, "$35.001"],
    [-243349, "-$243.349"],
  ])("%d → %s", (valor, esperado) => {
    expect(formatoDinero(valor)).toBe(esperado);
  });
});

describe("formatoHora", () => {
  it.each([
    ["10:30:00", "10:30 a. m."],
    ["14:00", "2:00 p. m."],
    ["00:15", "12:15 a. m."],
    ["12:00", "12:00 p. m."],
    ["2026-11-23T19:45:00", "7:45 p. m."],
  ])("%s → %s", (valor, esperado) => {
    expect(formatoHora(valor)).toBe(esperado);
  });

  it("no usa espacios duros invisibles", () => {
    expect(formatoHora("10:30")).not.toMatch(/[  ]/);
  });
});

describe("fechas", () => {
  it("formatea las tres longitudes", () => {
    expect(formatoFechaCorta("2026-11-23")).toBe("Lun 23");
    expect(formatoFechaMedia("2026-11-23")).toBe("Lun 23 de nov");
    expect(formatoFechaLarga("2026-11-23")).toBe("Lunes 23 de noviembre");
  });

  it("acepta una fecha con hora y usa solo la fecha", () => {
    expect(formatoFechaLarga("2026-11-29T08:00:00")).toBe("Domingo 29 de noviembre");
  });

  it("hoy en Bogotá no depende de la zona del dispositivo", () => {
    // 22 nov a las 23:30 en Bogotá ya es 23 nov en UTC
    expect(hoyEnBogota(new Date("2026-11-23T04:30:00Z"))).toBe("2026-11-22");
    expect(hoyEnBogota(new Date("2026-11-23T05:00:00Z"))).toBe("2026-11-23");
  });

  it("suma días cruzando el mes", () => {
    expect(sumarDias("2026-11-30", 2)).toBe("2026-12-02");
  });
});

describe("formatoDuracion", () => {
  it.each([
    [45, "45 min"],
    [60, "1 h"],
    [75, "1 h 15 min"],
  ])("%d → %s", (minutos, esperado) => {
    expect(formatoDuracion(minutos)).toBe(esperado);
  });
});

describe("teléfonos", () => {
  it("agrega +57 a un celular colombiano", () => {
    expect(telefonoParaEnviar("300 123 4567")).toBe("+573001234567");
    expect(telefonoParaEnviar("+57 (300) 123-4567")).toBe("+573001234567");
  });

  it("muestra el formato colombiano", () => {
    expect(formatoTelefono("+573001234567")).toBe("+57 300 123 4567");
    expect(formatoTelefono("3001234567")).toBe("+57 300 123 4567");
  });

  it("deja tal cual un número que no reconoce", () => {
    expect(formatoTelefono("6041234")).toBe("6041234");
  });
});
