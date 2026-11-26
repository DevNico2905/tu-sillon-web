import { describe, expect, it } from "vitest";
import type { Cliente } from "@/api/tipos";
import {
  esquemaEditarEstilista,
  esquemaHorario,
  esquemaServicio,
  filtrarClientes,
  leerPesos,
  sugerirContrasena,
  textoAcceso,
} from "./gestion";

const clientes: Cliente[] = [
  { id: 1, nombre: "Pedro Gómez", telefono: "+573001112233" },
  { id: 2, nombre: "María López", telefono: "3104445566" },
  { id: 3, nombre: "Ana Ruiz", telefono: "+573207778899" },
];

describe("filtrarClientes", () => {
  it("sin búsqueda devuelve todos en orden alfabético", () => {
    expect(filtrarClientes(clientes, "  ").map((c) => c.nombre)).toEqual([
      "Ana Ruiz",
      "María López",
      "Pedro Gómez",
    ]);
  });

  it("busca por nombre sin importar tildes ni mayúsculas", () => {
    expect(filtrarClientes(clientes, "maria").map((c) => c.id)).toEqual([2]);
    expect(filtrarClientes(clientes, "GÓMEZ").map((c) => c.id)).toEqual([1]);
  });

  it("busca por teléfono con o sin +57 y con espacios", () => {
    expect(filtrarClientes(clientes, "310 444").map((c) => c.id)).toEqual([2]);
    expect(filtrarClientes(clientes, "+57 320").map((c) => c.id)).toEqual([3]);
  });

  it("menos de 3 dígitos no busca en teléfonos", () => {
    expect(filtrarClientes(clientes, "30")).toEqual([]);
  });
});

describe("leerPesos", () => {
  it("ignora puntos, signo y espacios", () => {
    expect(leerPesos("$35.000")).toBe(35000);
    expect(leerPesos("35 000")).toBe(35000);
    expect(leerPesos("")).toBe(0);
  });
});

describe("esquemas", () => {
  const servicio = { nombre: "Corte", descripcion: "", duracionMinutos: 30, precio: "30.000", activo: true };

  it("servicio: duración de 15 a 480 y precio mayor que cero", () => {
    expect(esquemaServicio.safeParse(servicio).success).toBe(true);
    expect(esquemaServicio.safeParse({ ...servicio, duracionMinutos: 10 }).success).toBe(false);
    expect(esquemaServicio.safeParse({ ...servicio, duracionMinutos: 500 }).success).toBe(false);
    expect(esquemaServicio.safeParse({ ...servicio, precio: "0" }).success).toBe(false);
  });

  it("editar estilista: contraseña vacía o de 8 a 72", () => {
    const base = { nombre: "Laura", servicioIds: [1], activo: true };
    expect(esquemaEditarEstilista.safeParse({ ...base, password: "" }).success).toBe(true);
    expect(esquemaEditarEstilista.safeParse({ ...base, password: "corta" }).success).toBe(false);
    expect(esquemaEditarEstilista.safeParse({ ...base, password: "larga1234" }).success).toBe(true);
    expect(esquemaEditarEstilista.safeParse({ ...base, servicioIds: [], password: "" }).success).toBe(false);
  });

  it("horario: el cierre va después de la apertura", () => {
    const horario = { horaApertura: "09:00", horaCierre: "19:00", intervaloMinutos: 30, abreDomingos: false };
    expect(esquemaHorario.safeParse(horario).success).toBe(true);
    const alReves = esquemaHorario.safeParse({ ...horario, horaCierre: "08:00" });
    expect(alReves.success).toBe(false);
    expect(alReves.error?.issues[0].path).toEqual(["horaCierre"]);
  });
});

describe("sugerirContrasena", () => {
  it("12 caracteres, empieza en mayúscula, con dígitos y sin caracteres confusos", () => {
    const valor = sugerirContrasena(() => new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
    expect(valor).toBe("Abc5efg9jkm5");
    for (let i = 0; i < 50; i++) {
      const aleatoria = sugerirContrasena();
      expect(aleatoria).toHaveLength(12);
      expect(aleatoria).toMatch(/^[A-Z][a-z0-9]+$/);
      expect(aleatoria).not.toMatch(/[01ilo]/);
    }
  });
});

describe("textoAcceso", () => {
  it("arma el mensaje con el primer nombre", () => {
    expect(
      textoAcceso({
        nombre: "Laura Marín",
        email: "laura@navaja.co",
        password: "Abc5efg9jkm5",
        urlEntrar: "https://sillon.nick-bern.com/entrar",
      }),
    ).toBe(
      "Hola Laura, este es tu acceso a la agenda en Sillón:\nhttps://sillon.nick-bern.com/entrar\nCorreo: laura@navaja.co\nContraseña: Abc5efg9jkm5",
    );
  });
});
