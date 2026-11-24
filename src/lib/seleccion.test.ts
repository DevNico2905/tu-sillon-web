import { describe, expect, it } from "vitest";
import type { Catalogo } from "@/api/tipos";
import {
  aParametros,
  barberosDelServicio,
  cambiarBarbero,
  cambiarFecha,
  cambiarServicio,
  CUALQUIERA,
  inicioDeCita,
  leerSeleccion,
} from "./seleccion";

const CATALOGO: Catalogo = {
  nombre: "Barbería Centro",
  slug: "barberia-centro",
  ciudad: "Rionegro",
  direccion: "Calle 50 # 45-20",
  telefono: "3001234567",
  horario: "Lunes a sábado, de 8:00 a. m. a 7:00 p. m.",
  horaApertura: "08:00:00",
  horaCierre: "19:00:00",
  abreDomingos: false,
  servicios: [
    { id: 1, nombre: "Corte clásico", descripcion: null, duracionMinutos: 45, precio: 35000, activo: true },
    { id: 2, nombre: "Barba", descripcion: "Perfilado", duracionMinutos: 30, precio: 20000, activo: true },
  ],
  estilistas: [
    { id: 10, nombre: "Mateo", servicioIds: [1, 2] },
    { id: 11, nombre: "Sara", servicioIds: [1] },
  ],
};

const HOY = "2026-11-20"; // viernes
const leer = (consulta: string) => leerSeleccion(new URLSearchParams(consulta), CATALOGO, HOY);

describe("leerSeleccion", () => {
  it("sin parámetros: sin servicio, cualquier barbero y el primer día abierto", () => {
    expect(leer("")).toEqual({ servicioId: null, barbero: CUALQUIERA, fecha: HOY, hora: null });
  });

  it("lee una selección completa", () => {
    expect(leer("servicio=1&barbero=11&fecha=2026-11-23&hora=10:30")).toEqual({
      servicioId: 1,
      barbero: 11,
      fecha: "2026-11-23",
      hora: "10:30",
    });
  });

  it("descarta un barbero que no ofrece el servicio", () => {
    expect(leer("servicio=2&barbero=11").barbero).toBe(CUALQUIERA);
  });

  it("descarta un domingo cerrado y una fecha fuera de los 14 días", () => {
    expect(leer("fecha=2026-11-22").fecha).toBe(HOY);
    expect(leer("fecha=2027-01-01").fecha).toBe(HOY);
  });

  it("descarta servicios inexistentes y horas mal formadas", () => {
    expect(leer("servicio=99&hora=10:30")).toMatchObject({ servicioId: null, hora: null });
    expect(leer("servicio=1&hora=tarde").hora).toBeNull();
  });

  it("elige solo el servicio si el salón tiene uno", () => {
    const unico = { ...CATALOGO, servicios: [CATALOGO.servicios[0]] };
    expect(leerSeleccion(new URLSearchParams(""), unico, HOY).servicioId).toBe(1);
  });
});

describe("cambios", () => {
  const base = leer("servicio=1&barbero=11&fecha=2026-11-23&hora=10:30");

  it("cambiar a un servicio que el barbero no ofrece lo pasa a cualquiera y borra la hora", () => {
    expect(cambiarServicio(base, 2, CATALOGO)).toMatchObject({
      servicioId: 2,
      barbero: CUALQUIERA,
      hora: null,
    });
  });

  it("cambiar de barbero o de fecha borra la hora", () => {
    expect(cambiarBarbero(base, 10).hora).toBeNull();
    expect(cambiarFecha(base, "2026-11-24", CATALOGO).hora).toBeNull();
  });

  it("no deja elegir un día cerrado", () => {
    expect(cambiarFecha(base, "2026-11-22", CATALOGO)).toBe(base);
  });
});

describe("utilidades", () => {
  it("la URL omite cualquiera", () => {
    expect(aParametros(leer("servicio=1&fecha=2026-11-23")).toString()).toBe("servicio=1&fecha=2026-11-23");
  });

  it("filtra barberos por servicio", () => {
    expect(barberosDelServicio(CATALOGO, 2).map((e) => e.nombre)).toEqual(["Mateo"]);
  });

  it("arma el inicio en hora local", () => {
    expect(inicioDeCita("2026-11-23", "10:30")).toBe("2026-11-23T10:30:00");
  });
});
