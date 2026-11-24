import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("no confunde el tamaño de texto propio con un color", () => {
    expect(cn("text-acento", "text-rotulo")).toBe("text-acento text-rotulo");
    expect(cn("text-destacado", "text-white")).toBe("text-destacado text-white");
  });

  it("resuelve conflictos reales", () => {
    expect(cn("text-cuerpo", "text-nota")).toBe("text-nota");
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
