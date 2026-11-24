import { describe, expect, it } from "vitest";
import { crearIcs, enlaceMapa, escaparIcs } from "./calendario";

describe("crearIcs", () => {
  const ics = crearIcs(
    {
      id: 42,
      inicio: "2026-11-23T10:30:00",
      fin: "2026-11-23T11:15:00",
      titulo: "Corte clásico en Barbería Centro",
      lugar: "Calle 50 # 45-20, Rionegro",
    },
    new Date("2026-11-22T15:00:00Z"),
  );

  it("usa la hora de Bogotá con su zona", () => {
    expect(ics).toContain("DTSTART;TZID=America/Bogota:20261123T103000");
    expect(ics).toContain("DTEND;TZID=America/Bogota:20261123T111500");
    expect(ics).toContain("TZOFFSETTO:-0500");
  });

  it("escapa las comas del lugar y usa saltos CRLF", () => {
    expect(ics).toContain("LOCATION:Calle 50 # 45-20\\, Rionegro");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });

  it("tiene un UID estable por cita", () => {
    expect(ics).toContain("UID:cita-42@sillon.nick-bern.com");
    expect(ics).toContain("DTSTAMP:20261122T150000Z");
  });
});

describe("utilidades", () => {
  it("escapa punto y coma, barra invertida y saltos", () => {
    expect(escaparIcs("a;b\\c\nd")).toBe("a\\;b\\\\c\\nd");
  });

  it("arma el enlace de Google Maps", () => {
    expect(enlaceMapa("Calle 50 # 45-20", "Rionegro")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Calle%2050%20%23%2045-20%2C%20Rionegro",
    );
  });
});
