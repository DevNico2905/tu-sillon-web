import { describe, expect, it } from "vitest";
import { destinoSeguro, puedeVer, seccionesDe } from "./navegacion-panel";

describe("navegación del panel", () => {
  it("S8: el estilista solo ve la agenda", () => {
    expect(seccionesDe("ESTILISTA").map((s) => s.titulo)).toEqual(["Agenda"]);
    expect(puedeVer("ESTILISTA", "/panel/equipo")).toBe(false);
    expect(puedeVer("DUENO", "/panel/equipo")).toBe(true);
  });

  it("solo vuelve a rutas del panel", () => {
    expect(destinoSeguro("/panel/servicios")).toBe("/panel/servicios");
    expect(destinoSeguro("https://malo.com")).toBe("/panel/agenda");
    expect(destinoSeguro("//malo.com/panel")).toBe("/panel/agenda");
    expect(destinoSeguro(null)).toBe("/panel/agenda");
  });
});
