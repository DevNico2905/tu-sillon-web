"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { cambiarEstadoCita, listarCitas } from "@/api/agenda";
import { obtenerCatalogo } from "@/api/publico";
import type { Catalogo, Cita, EstadoCita } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { Hoja } from "@/components/ui/hoja";
import { useAhora, useEsEscritorio } from "@/hooks/use-reloj";
import {
  ACCION_HACIA,
  accionesPermitidas,
  cifrasDelDia,
  ETIQUETA_ESTADO,
  horasDelDia,
  minutosDelDia,
  PIXELES_POR_HORA,
  posicionEnLinea,
} from "@/lib/agenda";
import {
  formatoDinero,
  formatoFechaLarga,
  formatoFechaMedia,
  formatoHora,
  hoyEnBogota,
  sumarDias,
} from "@/lib/formato";
import { momentoEnBogota } from "@/lib/horario";
import { primerNombre } from "@/lib/texto";
import { cn } from "@/lib/utils";
import { useSesion } from "@/sesion/proveedor-sesion";
import { DetalleCita } from "./detalle-cita";
import { ESTILO_ESTADO, ESTILO_ETIQUETA } from "./estilo-cita";
import { HojaNuevaCita } from "./hoja-nueva-cita";
import { HojaRecordatorio, useRecordatorio } from "./hoja-recordatorio";

type Columna = { id: number; nombre: string };

/** Agenda del día (SPEC-WEB §5.6): línea de tiempo en escritorio y lista en celular. */
export function Agenda() {
  const { usuario } = useSesion();
  const esDueno = usuario.rol === "DUENO";
  const parametros = useSearchParams();
  const ahora = useAhora();
  const esEscritorio = useEsEscritorio();
  const clienteQuery = useQueryClient();
  const hoy = ahora ? momentoEnBogota(ahora).fecha : hoyEnBogota();
  const pedida = parametros.get("fecha");
  const fecha = pedida && /^\d{4}-\d{2}-\d{2}$/.test(pedida) ? pedida : hoy;

  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [nuevaAbierta, setNuevaAbierta] = useState(false);
  const [filtro, setFiltro] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null);
  const recordatorio = useRecordatorio();

  const citas = useQuery({ queryKey: ["citas", fecha], queryFn: ({ signal }) => listarCitas(fecha, signal) });
  // Horario y equipo salen del catálogo público: sirve igual para el dueño y para el estilista.
  const catalogo = useQuery({
    queryKey: ["catalogo", usuario.salonSlug],
    queryFn: ({ signal }) => obtenerCatalogo(usuario.salonSlug, signal),
    staleTime: 5 * 60_000,
  });

  const cambio = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoCita }) => cambiarEstadoCita(id, estado),
    // Se ve el cambio al instante; si la API lo rechaza, la cita vuelve a su estado anterior.
    onMutate: async ({ id, estado }) => {
      await clienteQuery.cancelQueries({ queryKey: ["citas", fecha] });
      const anterior = clienteQuery.getQueryData<Cita[]>(["citas", fecha]);
      clienteQuery.setQueryData<Cita[]>(["citas", fecha], (lista) =>
        lista?.map((c) => (c.id === id ? { ...c, estado } : c)),
      );
      return { anterior };
    },
    onError: (fallo, _variables, contexto) => {
      if (contexto?.anterior) clienteQuery.setQueryData(["citas", fecha], contexto.anterior);
      setAviso({ texto: fallo.message, error: true });
    },
    onSuccess: (cita) =>
      setAviso({
        texto: `${cita.clienteNombre}: ${ETIQUETA_ESTADO[cita.estado].toLowerCase()}`,
        error: false,
      }),
    onSettled: () => void clienteQuery.invalidateQueries({ queryKey: ["citas", fecha] }),
  });

  const cambiarEstado = (cita: Cita, estado: EstadoCita) => {
    setAviso(null);
    cambio.mutate({ id: cita.id, estado });
  };

  const lista = citas.data ?? [];
  const seleccionada = lista.find((c) => c.id === seleccionadaId) ?? null;
  const visibles = filtro === null ? lista : lista.filter((c) => c.estilistaId === filtro);
  const columnas = columnasDe(lista, catalogo.data, esDueno, usuario.usuarioId, usuario.nombre);
  const enlaceFecha = (destino: string) =>
    destino === hoy ? "/panel/agenda" : `/panel/agenda?fecha=${destino}`;

  const detalle = seleccionada && (
    <DetalleCita
      cita={seleccionada}
      rol={usuario.rol}
      cambiando={cambio.isPending}
      alCambiarEstado={(estado) => cambiarEstado(seleccionada, estado)}
      alRecordar={() => recordatorio.abrir(seleccionada)}
    />
  );

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-8 md:px-8 lg:pt-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-rotulo font-medium text-texto-2">{formatoFechaLarga(fecha)}</p>
          <h1 className="text-titulo font-bold">
            {fecha === hoy ? "Hoy" : formatoFechaMedia(fecha)}
            <span className="sr-only"> · Agenda</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <nav aria-label="Cambiar de día" className="flex items-center rounded-control bg-superficie">
            <Link
              href={enlaceFecha(sumarDias(fecha, -1))}
              aria-label="Día anterior"
              className="flex min-h-11 min-w-11 items-center justify-center text-destacado"
            >
              ‹
            </Link>
            <Link
              href={enlaceFecha(hoy)}
              className={cn(
                "flex min-h-11 items-center px-3 text-rotulo font-semibold",
                fecha === hoy ? "text-texto-2" : "text-acento",
              )}
            >
              Hoy
            </Link>
            <Link
              href={enlaceFecha(sumarDias(fecha, 1))}
              aria-label="Día siguiente"
              className="flex min-h-11 min-w-11 items-center justify-center text-destacado"
            >
              ›
            </Link>
          </nav>
          {esDueno && catalogo.data && <Boton onClick={() => setNuevaAbierta(true)}>Nueva cita</Boton>}
        </div>
      </header>

      {aviso && (
        <div
          role={aviso.error ? "alert" : "status"}
          className={cn(
            "flex items-start justify-between gap-3 rounded-grupo p-4 text-cuerpo",
            aviso.error ? "bg-peligro-fondo text-peligro" : "bg-acento-suave",
          )}
        >
          <span>{aviso.texto}</span>
          <button
            type="button"
            onClick={() => setAviso(null)}
            className="text-rotulo font-semibold"
            aria-label="Cerrar aviso"
          >
            Cerrar
          </button>
        </div>
      )}

      {citas.isPending ? (
        <div aria-busy="true" aria-label="Cargando la agenda" className="flex animate-pulse flex-col gap-3">
          <div className="hidden h-20 rounded-grupo bg-superficie lg:block" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-grupo bg-superficie" />
          ))}
        </div>
      ) : citas.isError ? (
        <div className="flex flex-col items-start gap-3 rounded-grupo bg-superficie p-5">
          <p className="text-cuerpo">{citas.error.message}</p>
          <Boton variante="secundario" onClick={() => void citas.refetch()}>
            Intentar de nuevo
          </Boton>
        </div>
      ) : (
        <>
          {/* Escritorio: cifras, línea de tiempo y detalle al lado */}
          <div className="hidden flex-col gap-5 lg:flex">
            <Cifras citas={lista} esDueno={esDueno} />
            <div className="flex items-start gap-5">
              <div className="min-w-0 flex-1 overflow-x-auto rounded-grupo bg-superficie">
                {catalogo.data ? (
                  <LineaTiempo
                    citas={lista}
                    columnas={columnas}
                    catalogo={catalogo.data}
                    ahora={fecha === hoy ? ahora : null}
                    seleccionadaId={seleccionadaId}
                    alElegir={setSeleccionadaId}
                  />
                ) : (
                  <div className="h-96 animate-pulse" />
                )}
              </div>
              <aside aria-label="Detalle de la cita" className="sticky top-6 w-80 shrink-0">
                {detalle ?? (
                  <p className="rounded-grupo bg-superficie p-5 text-cuerpo text-texto-2">
                    {lista.length === 0 ? "No hay citas este día." : "Elige una cita para ver el detalle."}
                  </p>
                )}
              </aside>
            </div>
          </div>

          {/* Celular: filtro por barbero, por confirmar arriba y la lista del día */}
          <div className="flex flex-col gap-6 lg:hidden">
            {esDueno && columnas.length > 1 && (
              <div role="radiogroup" aria-label="Barbero" className="-mx-5 flex gap-1 overflow-x-auto px-5">
                {[{ id: null, nombre: "Todos" } as const, ...columnas].map((col) => (
                  <button
                    key={col.id ?? "todos"}
                    type="button"
                    role="radio"
                    aria-checked={filtro === col.id}
                    onClick={() => setFiltro(col.id)}
                    className={cn(
                      "min-h-9 shrink-0 rounded-full px-4 text-rotulo font-medium",
                      filtro === col.id ? "bg-texto text-fondo" : "bg-superficie-2",
                    )}
                  >
                    {col.id === null ? col.nombre : primerNombre(col.nombre)}
                  </button>
                ))}
              </div>
            )}
            <ListaDia
              citas={visibles}
              esDueno={esDueno}
              ahora={fecha === hoy ? ahora : null}
              cambiando={cambio.isPending}
              alElegir={setSeleccionadaId}
              alCambiarEstado={cambiarEstado}
            />
          </div>
        </>
      )}

      <Hoja
        abierta={!esEscritorio && seleccionada !== null}
        alCerrar={() => setSeleccionadaId(null)}
        titulo="Cita"
      >
        <div className="overflow-y-auto p-5">{!esEscritorio && detalle}</div>
      </Hoja>
      <HojaRecordatorio estado={recordatorio} />
      {esDueno && catalogo.data && (
        <HojaNuevaCita
          abierta={nuevaAbierta}
          alCerrar={() => setNuevaAbierta(false)}
          catalogo={catalogo.data}
          hoy={hoy}
          fecha={fecha < hoy ? hoy : fecha}
          alCrear={(cita) => {
            setNuevaAbierta(false);
            setAviso({
              texto: `Cita creada: ${cita.clienteNombre}, ${formatoFechaMedia(cita.inicio)} · ${formatoHora(cita.inicio)}`,
              error: false,
            });
            void clienteQuery.invalidateQueries({ queryKey: ["citas", cita.inicio.slice(0, 10)] });
          }}
        />
      )}
    </div>
  );
}

/** Una columna por estilista activo; se suman los que tengan citas aunque ya no estén en el catálogo. */
function columnasDe(
  citas: Cita[],
  catalogo: Catalogo | undefined,
  esDueno: boolean,
  usuarioId: number,
  nombre: string,
): Columna[] {
  if (!esDueno) return [{ id: usuarioId, nombre }];
  const columnas: Columna[] = (catalogo?.estilistas ?? []).map((e) => ({ id: e.id, nombre: e.nombre }));
  for (const cita of citas) {
    if (!columnas.some((c) => c.id === cita.estilistaId)) {
      columnas.push({ id: cita.estilistaId, nombre: cita.estilistaNombre });
    }
  }
  return columnas;
}

function Cifras({ citas, esDueno }: { citas: Cita[]; esDueno: boolean }) {
  const cifras = cifrasDelDia(citas);
  const tarjetas = [
    { titulo: "Citas", valor: String(cifras.citas) },
    { titulo: "Por confirmar", valor: String(cifras.porConfirmar) },
    ...(esDueno
      ? [
          { titulo: "Ingresos esperados", valor: formatoDinero(cifras.ingresosEsperados) },
          {
            titulo: "Completadas",
            valor: String(cifras.completadas),
            detalle: formatoDinero(cifras.valorCompletadas),
          },
        ]
      : [{ titulo: "Completadas", valor: String(cifras.completadas) }]),
  ];
  return (
    <dl className={cn("grid gap-3", esDueno ? "grid-cols-4" : "grid-cols-3")}>
      {tarjetas.map((t) => (
        <div key={t.titulo} className="flex flex-col gap-1 rounded-grupo bg-superficie p-4">
          <dt className="text-rotulo text-texto-2">{t.titulo}</dt>
          <dd className="flex items-baseline gap-2">
            <span className="text-titulo font-bold">{t.valor}</span>
            {"detalle" in t && t.detalle && <span className="text-rotulo text-texto-2">{t.detalle}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LineaTiempo({
  citas,
  columnas,
  catalogo,
  ahora,
  seleccionadaId,
  alElegir,
}: {
  citas: Cita[];
  columnas: Columna[];
  catalogo: Catalogo;
  ahora: Date | null;
  seleccionadaId: number | null;
  alElegir: (id: number) => void;
}) {
  // El día va de la apertura al cierre, ampliado si alguna cita queda por fuera.
  const enLinea = citas.filter((c) => c.estado !== "CANCELADA");
  const minimo = Math.min(
    minutosDelDia(catalogo.horaApertura),
    ...enLinea.map((c) => minutosDelDia(c.inicio)),
  );
  const maximo = Math.max(minutosDelDia(catalogo.horaCierre), ...enLinea.map((c) => minutosDelDia(c.fin)));
  const apertura = `${String(Math.floor(minimo / 60)).padStart(2, "0")}:00:00`;
  const horas = horasDelDia(apertura, `${String(Math.ceil(maximo / 60)).padStart(2, "0")}:00:00`);
  const alto = (horas.length - 1) * PIXELES_POR_HORA;
  const minutoAhora = ahora ? minutosDelDia(momentoEnBogota(ahora).hora) : null;
  const lineaAhora =
    minutoAhora !== null && minutoAhora >= minimo && minutoAhora <= horas[horas.length - 1] * 60
      ? ((minutoAhora - minutosDelDia(apertura)) * PIXELES_POR_HORA) / 60
      : null;

  return (
    <div className="min-w-fit p-4">
      <div className="flex">
        <div className="w-14 shrink-0" />
        {columnas.map((col) => (
          <div key={col.id} className="min-w-40 flex-1 px-1 pb-3 text-cuerpo font-semibold">
            {col.nombre}
          </div>
        ))}
      </div>
      <div className="relative flex" style={{ height: alto }}>
        <div className="relative w-14 shrink-0">
          {horas.map((h, i) => (
            <span
              key={h}
              className="absolute -translate-y-1/2 text-nota text-texto-2"
              style={{ top: i * PIXELES_POR_HORA }}
            >
              {formatoHora(`${h}:00`).replace(":00 ", " ")}
            </span>
          ))}
        </div>
        {horas.map((h, i) => (
          <div
            key={h}
            aria-hidden
            className="pointer-events-none absolute right-0 left-14 border-t border-separador"
            style={{ top: i * PIXELES_POR_HORA }}
          />
        ))}
        {columnas.map((col) => (
          <div key={col.id} className="relative min-w-40 flex-1 border-l border-separador">
            {enLinea
              .filter((c) => c.estilistaId === col.id)
              .map((cita) => {
                const { arriba, alto: altoBloque } = posicionEnLinea(cita.inicio, cita.fin, apertura);
                return (
                  <button
                    key={cita.id}
                    type="button"
                    onClick={() => alElegir(cita.id)}
                    aria-pressed={seleccionadaId === cita.id}
                    className={cn(
                      "absolute inset-x-1 overflow-hidden rounded-control px-2 text-left",
                      altoBloque >= 40 ? "py-1" : "flex items-center",
                      ESTILO_ESTADO[cita.estado],
                      seleccionadaId === cita.id && "ring-2 ring-acento",
                    )}
                    style={{ top: arriba, height: altoBloque }}
                  >
                    <span className="block truncate text-rotulo font-semibold">
                      {formatoHora(cita.inicio)} · {cita.clienteNombre}
                    </span>
                    {altoBloque >= 40 ? (
                      <span className="block truncate text-nota">
                        {cita.servicioNombre} · {ETIQUETA_ESTADO[cita.estado]}
                      </span>
                    ) : (
                      <span className="sr-only">{ETIQUETA_ESTADO[cita.estado]}</span>
                    )}
                  </button>
                );
              })}
          </div>
        ))}
        {lineaAhora !== null && (
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 left-12 flex items-center"
            style={{ top: lineaAhora }}
          >
            <span className="size-2 -translate-y-px rounded-full bg-ahora" />
            <span className="h-0.5 flex-1 bg-ahora" />
          </div>
        )}
      </div>
    </div>
  );
}

function ListaDia({
  citas,
  esDueno,
  ahora,
  cambiando,
  alElegir,
  alCambiarEstado,
}: {
  citas: Cita[];
  esDueno: boolean;
  ahora: Date | null;
  cambiando: boolean;
  alElegir: (id: number) => void;
  alCambiarEstado: (cita: Cita, estado: EstadoCita) => void;
}) {
  const porConfirmar = esDueno ? citas.filter((c) => c.estado === "PENDIENTE") : [];
  const resto = citas.filter((c) => !porConfirmar.includes(c));
  const horaAhora = ahora ? momentoEnBogota(ahora).hora : null;
  const indiceAhora = horaAhora === null ? -1 : resto.findIndex((c) => c.inicio.slice(11, 19) > horaAhora);

  if (citas.length === 0) {
    return <p className="rounded-grupo bg-superficie p-5 text-cuerpo text-texto-2">No hay citas este día.</p>;
  }

  return (
    <>
      {porConfirmar.length > 0 && (
        <section aria-label="Por confirmar" className="flex flex-col gap-2">
          <h2 className="px-4 text-rotulo font-medium text-texto-2">Por confirmar · {porConfirmar.length}</h2>
          <ul className="flex flex-col gap-2">
            {porConfirmar.map((cita) => (
              <li
                key={cita.id}
                className={cn("flex flex-col gap-3 rounded-grupo p-4", ESTILO_ESTADO.PENDIENTE)}
              >
                <button
                  type="button"
                  onClick={() => alElegir(cita.id)}
                  className="flex flex-col text-left text-texto"
                >
                  <span className="text-destacado font-semibold">
                    {formatoHora(cita.inicio)} · {cita.clienteNombre}
                  </span>
                  <span className="text-rotulo text-texto-2">
                    {cita.servicioNombre} con {cita.estilistaNombre}
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {accionesPermitidas(cita.estado, "DUENO").map((destino) => (
                    <Boton
                      key={destino}
                      variante={destino === "CANCELADA" ? "peligro" : "principal"}
                      disabled={cambiando}
                      onClick={() => alCambiarEstado(cita, destino)}
                    >
                      {ACCION_HACIA[destino]}
                    </Boton>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Citas del día" className="flex flex-col gap-2">
        <h2 className="px-4 text-rotulo font-medium text-texto-2">Del día</h2>
        <ul className="overflow-hidden rounded-grupo bg-superficie">
          {resto.map((cita, indice) => (
            <li key={cita.id} className="border-b border-separador last:border-0">
              {indice === indiceAhora && <MarcaAhora />}
              <button
                type="button"
                onClick={() => alElegir(cita.id)}
                className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="w-20 shrink-0 text-rotulo font-semibold">{formatoHora(cita.inicio)}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate text-destacado font-medium",
                      cita.estado === "CANCELADA" && "line-through",
                    )}
                  >
                    {cita.clienteNombre}
                  </span>
                  <span className="truncate text-rotulo text-texto-2">
                    {cita.servicioNombre} · {primerNombre(cita.estilistaNombre)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-nota font-semibold",
                    ESTILO_ETIQUETA[cita.estado],
                  )}
                >
                  {ETIQUETA_ESTADO[cita.estado]}
                </span>
              </button>
            </li>
          ))}
          {indiceAhora === -1 && horaAhora !== null && resto.length > 0 && (
            <li>
              <MarcaAhora />
            </li>
          )}
        </ul>
      </section>
    </>
  );
}

function MarcaAhora() {
  return (
    <div aria-label="Ahora" className="flex items-center gap-2 px-4">
      <span className="text-nota font-semibold text-ahora">Ahora</span>
      <span className="h-0.5 flex-1 bg-ahora" />
    </div>
  );
}
