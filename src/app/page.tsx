import type { Metadata } from "next";
import { Boton } from "@/components/ui/boton";
import {
  formatoDinero,
  formatoDuracion,
  formatoFechaCorta,
  formatoFechaLarga,
  formatoFechaMedia,
  formatoHora,
  formatoTelefono,
} from "@/lib/formato";

export const metadata: Metadata = { title: "Sistema de diseño" };

/*
 * Página de prueba del F0: muestra los tokens, la tipografía y los formatos.
 * Cambia el modo del sistema operativo (claro/oscuro) para ver los dos temas.
 * Se reemplaza cuando exista la página de inicio.
 */

const COLORES = [
  ["fondo", "bg-fondo"],
  ["superficie", "bg-superficie"],
  ["superficie-2", "bg-superficie-2"],
  ["texto", "bg-texto"],
  ["texto-2", "bg-texto-2"],
  ["separador", "bg-separador"],
  ["acento", "bg-acento"],
  ["acento-suave", "bg-acento-suave"],
  ["exito", "bg-exito"],
  ["aviso", "bg-aviso"],
  ["peligro", "bg-peligro"],
  ["completada", "bg-completada"],
  ["ahora", "bg-ahora"],
] as const;

const ESCALA = [
  ["Título grande · 34", "text-titulo-grande font-bold"],
  ["Título · 28", "text-titulo font-bold"],
  ["Sección · 22", "text-seccion font-bold"],
  ["Destacado · 17", "text-destacado font-semibold"],
  ["Cuerpo · 15", "text-cuerpo"],
  ["Rótulo · 13", "text-rotulo font-medium text-texto-2"],
  ["Nota · 12", "text-nota text-texto-2"],
] as const;

const FORMATOS = [
  ["Dinero", formatoDinero(35000)],
  ["Hora", `${formatoHora("10:30")} · ${formatoHora("14:00")}`],
  ["Fecha corta", formatoFechaCorta("2026-11-23")],
  ["Fecha media", formatoFechaMedia("2026-11-23")],
  ["Fecha larga", formatoFechaLarga("2026-11-23")],
  ["Duración", `${formatoDuracion(45)} · ${formatoDuracion(75)}`],
  ["Teléfono", formatoTelefono("3001234567")],
] as const;

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-4 text-rotulo font-medium text-texto-2">{titulo}</h2>
      <div className="overflow-hidden rounded-grupo bg-superficie">{children}</div>
    </section>
  );
}

export default function PaginaSistema() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10 md:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-rotulo font-medium text-texto-2">Sillón · F0</p>
        <h1 className="text-titulo-grande font-bold">Sistema de diseño</h1>
        <p className="text-cuerpo text-texto-2">
          Tokens, tipografía y formatos de SPEC-WEB §4. Cambia tu sistema a modo oscuro para ver el otro tema.
        </p>
      </header>

      <Grupo titulo="Colores">
        <ul className="grid grid-cols-2 sm:grid-cols-3">
          {COLORES.map(([nombre, clase]) => (
            <li key={nombre} className="flex items-center gap-3 border-b border-separador p-4">
              <span className={`size-8 shrink-0 rounded-full border border-separador ${clase}`} />
              <span className="text-rotulo">{nombre}</span>
            </li>
          ))}
        </ul>
      </Grupo>

      <Grupo titulo="Tipografía">
        <ul>
          {ESCALA.map(([texto, clase]) => (
            <li key={texto} className={`border-b border-separador px-4 py-3 last:border-0 ${clase}`}>
              {texto}
            </li>
          ))}
        </ul>
      </Grupo>

      <Grupo titulo="Estados de una cita">
        <div className="flex flex-col gap-2 p-4">
          <div className="rounded-control border border-dashed border-aviso bg-aviso-fondo px-3 py-2 text-cuerpo text-aviso">
            10:30 a. m. · Por confirmar
          </div>
          <div className="rounded-control bg-acento-suave px-3 py-2 text-cuerpo">
            11:15 a. m. · Confirmada
          </div>
          <div className="rounded-control bg-completada px-3 py-2 text-cuerpo text-texto-2">
            9:00 a. m. · Completada
          </div>
          <div className="rounded-control bg-peligro-fondo px-3 py-2 text-cuerpo text-peligro">
            8:00 a. m. · No asistió
          </div>
        </div>
      </Grupo>

      <Grupo titulo="Botones">
        <div className="flex flex-col gap-3 p-4">
          <Boton ancho="completo">Confirmar reserva</Boton>
          <Boton variante="secundario" ancho="completo">
            Ver horas libres
          </Boton>
          <div className="flex justify-between">
            <Boton variante="texto">Cambiar</Boton>
            <Boton variante="peligro">Cancelar cita</Boton>
          </div>
        </div>
      </Grupo>

      <Grupo titulo="Formatos (Colombia)">
        <dl>
          {FORMATOS.map(([nombre, valor]) => (
            <div
              key={nombre}
              className="flex justify-between border-b border-separador px-4 py-3 last:border-0"
            >
              <dt className="text-cuerpo text-texto-2">{nombre}</dt>
              <dd className="text-cuerpo font-medium">{valor}</dd>
            </div>
          ))}
        </dl>
      </Grupo>

      <footer className="text-center text-nota text-texto-2">Con Sillón</footer>
    </main>
  );
}
