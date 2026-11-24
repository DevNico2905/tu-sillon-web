import { describe, expect, it } from "vitest";
import { estaAbierto, horaCorta, momentoEnBogota, normalizarHora, proximosDias } from "./horario";

const HORARIO = { horaApertura: "08:00:00", horaCierre: "19:00:00", abreDomingos: false };

// Bogotá = UTC−5: las 13:00 UTC son las 8:00 en Bogotá.
const enBogota = (fecha: string, hora: string) => new Date(`${fecha}T${hora}-05:00`);

describe("estaAbierto", () => {
  it("abre justo a la hora de apertura y cierra a la hora de cierre", () => {
    expect(estaAbierto(HORARIO, enBogota("2026-11-23", "07:59:59"))).toBe(false);
    expect(estaAbierto(HORARIO, enBogota("2026-11-23", "08:00:00"))).toBe(true);
    expect(estaAbierto(HORARIO, enBogota("2026-11-23", "18:59:00"))).toBe(true);
    expect(estaAbierto(HORARIO, enBogota("2026-11-23", "19:00:00"))).toBe(false);
  });

  it("el domingo está cerrado si el salón no abre domingos", () => {
    expect(estaAbierto(HORARIO, enBogota("2026-11-22", "10:00:00"))).toBe(false);
    expect(estaAbierto({ ...HORARIO, abreDomingos: true }, enBogota("2026-11-22", "10:00:00"))).toBe(true);
  });

  it("usa la hora de Bogotá aunque en UTC ya sea otro día", () => {
    // Martes 24 a las 00:30 UTC = lunes 23 a las 19:30 en Bogotá: ya cerró
    expect(momentoEnBogota(new Date("2026-11-24T00:30:00Z")).fecha).toBe("2026-11-23");
    expect(estaAbierto(HORARIO, new Date("2026-11-24T00:30:00Z"))).toBe(false);
  });
});

describe("proximosDias", () => {
  it("devuelve 14 días desde hoy y marca los domingos", () => {
    const dias = proximosDias(HORARIO, "2026-11-20");
    expect(dias).toHaveLength(14);
    expect(dias[0]).toEqual({ fecha: "2026-11-20", atiende: true });
    expect(dias[2]).toEqual({ fecha: "2026-11-22", atiende: false });
    expect(dias.filter((d) => !d.atiende)).toHaveLength(2);
  });
});

describe("horas", () => {
  it("normaliza y acorta", () => {
    expect(normalizarHora("8:00")).toBe("08:00:00");
    expect(horaCorta("10:30:00")).toBe("10:30");
  });
});
