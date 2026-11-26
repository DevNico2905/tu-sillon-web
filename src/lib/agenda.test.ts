import { describe, expect, it } from "vitest";
import type { Cita } from "@/api/tipos";
import {
  accionesPermitidas,
  cifrasDelDia,
  enlaceWhatsapp,
  horasDelDia,
  minutosDelDia,
  posicionEnLinea,
  puedeRecordar,
} from "./agenda";

function cita(id: number, estado: Cita["estado"], precio: number): Cita {
  return {
    id,
    estado,
    precio,
    inicio: "2026-11-23T10:00:00",
    fin: "2026-11-23T10:45:00",
    origen: "SALON",
    servicioId: 1,
    servicioNombre: "Corte",
    estilistaId: 10,
    estilistaNombre: "Mateo",
    clienteNombre: "Ana",
    clienteTelefono: "+573001234567",
    nota: null,
    fechaCreacion: "2026-11-20T10:00:00",
    fechaActualizacion: "2026-11-20T10:00:00",
  };
}

describe("acciones", () => {
  it("el dueño sigue la tabla de transiciones del backend", () => {
    expect(accionesPermitidas("PENDIENTE", "DUENO")).toEqual(["CONFIRMADA", "CANCELADA"]);
    expect(accionesPermitidas("CONFIRMADA", "DUENO")).toEqual(["COMPLETADA", "NO_ASISTIO", "CANCELADA"]);
    expect(accionesPermitidas("COMPLETADA", "DUENO")).toEqual([]);
  });

  it("el estilista nunca ve confirmar ni cancelar", () => {
    expect(accionesPermitidas("PENDIENTE", "ESTILISTA")).toEqual([]);
    expect(accionesPermitidas("CONFIRMADA", "ESTILISTA")).toEqual(["COMPLETADA", "NO_ASISTIO"]);
  });

  it("recordatorio solo para el dueño y citas en pie", () => {
    expect(puedeRecordar("CONFIRMADA", "DUENO")).toBe(true);
    expect(puedeRecordar("CANCELADA", "DUENO")).toBe(false);
    expect(puedeRecordar("CONFIRMADA", "ESTILISTA")).toBe(false);
  });
});

describe("cifrasDelDia", () => {
  it("suma ingresos esperados de pendientes, confirmadas y completadas", () => {
    const cifras = cifrasDelDia([
      cita(1, "PENDIENTE", 35000),
      cita(2, "CONFIRMADA", 20000),
      cita(3, "COMPLETADA", 50000),
      cita(4, "CANCELADA", 99000),
      cita(5, "NO_ASISTIO", 99000),
    ]);
    expect(cifras).toEqual({
      citas: 5,
      porConfirmar: 1,
      ingresosEsperados: 105000,
      completadas: 1,
      valorCompletadas: 50000,
    });
  });
});

describe("línea de tiempo", () => {
  it("convierte horas a minutos", () => {
    expect(minutosDelDia("2026-11-23T10:30:00")).toBe(630);
    expect(minutosDelDia("8:00")).toBe(480);
  });

  it("ubica un bloque a 64 px por hora desde la apertura", () => {
    expect(posicionEnLinea("2026-11-23T10:30:00", "2026-11-23T11:15:00", "08:00:00")).toEqual({
      arriba: 160,
      alto: 48,
    });
  });

  it("un bloque muy corto tiene un alto mínimo legible", () => {
    expect(posicionEnLinea("2026-11-23T10:00:00", "2026-11-23T10:10:00", "08:00:00").alto).toBe(22);
  });

  it("marca las horas en punto entre apertura y cierre", () => {
    expect(horasDelDia("08:00:00", "19:00:00")).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });
});

describe("enlaceWhatsapp", () => {
  it("usa solo dígitos y codifica el mensaje", () => {
    expect(enlaceWhatsapp("+57 300 123 4567", "Hola, Ana: tu cita es mañana")).toBe(
      "https://wa.me/573001234567?text=Hola%2C%20Ana%3A%20tu%20cita%20es%20ma%C3%B1ana",
    );
  });
});
