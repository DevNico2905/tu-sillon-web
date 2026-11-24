"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorApi } from "@/api/cliente";
import { enviarChat } from "@/api/publico";
import type { TurnoChat } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Hoja } from "@/components/ui/hoja";
import { useCuentaRegresiva } from "@/hooks/use-cuenta-regresiva";
import { formatoTelefono } from "@/lib/formato";
import { guardarDatosChat, leerDatosChat, type DatosChat } from "@/lib/sesion-navegador";
import { cn } from "@/lib/utils";
import { esquemaDatosChat, MAXIMO_MENSAJE_CHAT, MAXIMO_TURNOS_CHAT } from "@/lib/validacion";

interface Turno extends TurnoChat {
  escalado?: boolean;
}

/** Botón de chat de la cabecera y su hoja (SPEC-WEB §5.4). */
export function ChatSalon({
  slug,
  salonNombre,
  telefono,
}: {
  slug: string;
  salonNombre: string;
  telefono: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const [datos, setDatos] = useState<DatosChat | null>(null);

  const abrir = () => {
    // El nombre y el contacto se recuerdan durante la sesión del navegador.
    setDatos((actuales) => actuales ?? leerDatosChat());
    setAbierta(true);
  };

  const irAHoras = () => {
    setAbierta(false);
    document.getElementById("paso-hora")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex min-h-11 shrink-0 items-center rounded-full bg-superficie px-4 text-cuerpo font-semibold text-acento"
      >
        Preguntar
      </button>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo={`Pregúntale a ${salonNombre}`}>
        {datos ? (
          <Conversacion slug={slug} datos={datos} telefono={telefono} alVerHoras={irAHoras} />
        ) : (
          <FormularioDatos
            alListo={(nuevos) => {
              guardarDatosChat(nuevos);
              setDatos(nuevos);
            }}
          />
        )}
      </Hoja>
    </>
  );
}

function FormularioDatos({ alListo }: { alListo: (datos: DatosChat) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosChat>({
    resolver: zodResolver(esquemaDatosChat),
    defaultValues: { nombre: "", contacto: "" },
  });

  return (
    <form onSubmit={handleSubmit(alListo)} className="flex flex-col gap-4 p-5" noValidate>
      <p className="text-cuerpo text-texto-2">
        Antes de empezar, dinos cómo te llamas y cómo te contactamos si hace falta.
      </p>
      <div className="overflow-hidden rounded-grupo bg-superficie">
        <Campo id="chat-nombre" etiqueta="Tu nombre" error={errors.nombre?.message}>
          <Entrada id="chat-nombre" autoComplete="given-name" {...register("nombre")} />
        </Campo>
        <Campo id="chat-contacto" etiqueta="Celular o correo" error={errors.contacto?.message}>
          <Entrada id="chat-contacto" autoComplete="tel" {...register("contacto")} />
        </Campo>
      </div>
      <Boton type="submit" ancho="completo">
        Empezar a chatear
      </Boton>
    </form>
  );
}

function mensajeDeError(error: unknown, telefono: string): string {
  if (!(error instanceof ErrorApi)) return "Algo falló. Intenta de nuevo.";
  if (error.codigo === 402) {
    return `El asistente no está disponible. Escríbele al salón al ${formatoTelefono(telefono)}.`;
  }
  if (error.codigo === 502 || error.codigo === 503) {
    return "El asistente no está disponible en este momento. Intenta en un rato.";
  }
  return error.message;
}

function Conversacion({
  slug,
  datos,
  telefono,
  alVerHoras,
}: {
  slug: string;
  datos: DatosChat;
  telefono: string;
  alVerHoras: () => void;
}) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cuenta = useCuentaRegresiva();
  const final = useRef<HTMLDivElement>(null);

  const envio = useMutation({
    mutationFn: (historial: TurnoChat[]) =>
      enviarChat(slug, { clienteNombre: datos.nombre, clienteContacto: datos.contacto, historial }),
  });

  useEffect(() => {
    final.current?.scrollIntoView({ block: "end" });
  }, [turnos, envio.isPending]);

  const lleno = turnos.length + 1 > MAXIMO_TURNOS_CHAT;

  const enviar = () => {
    const mensaje = texto.trim();
    if (!mensaje || envio.isPending || cuenta.restante > 0 || lleno) return;
    const historial: TurnoChat[] = [
      ...turnos.map(({ rol, texto: t }) => ({ rol, texto: t })),
      { rol: "CLIENTE", texto: mensaje },
    ];
    setTurnos((previos) => [...previos, { rol: "CLIENTE", texto: mensaje }]);
    setTexto("");
    setError(null);
    envio.mutate(historial, {
      onSuccess: (respuesta) => {
        setTurnos((previos) => [
          ...previos,
          { rol: "ASISTENTE", texto: respuesta.respuesta, escalado: respuesta.escalado },
        ]);
      },
      onError: (fallo) => {
        // El mensaje no llegó: se quita de la conversación y vuelve al campo para reenviarlo.
        setTurnos((previos) => previos.slice(0, -1));
        setTexto(mensaje);
        setError(mensajeDeError(fallo, telefono));
        if (fallo instanceof ErrorApi && fallo.codigo === 429 && fallo.reintentarEn) {
          cuenta.iniciar(fallo.reintentarEn);
        }
      },
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-64 flex-1 flex-col gap-2 overflow-y-auto p-5" aria-live="polite">
        {turnos.length === 0 && (
          <p className="text-cuerpo text-texto-2">
            Hola, {datos.nombre}. Pregunta por servicios, precios u horarios.
          </p>
        )}
        {turnos.map((turno, indice) => (
          <div
            key={indice}
            className={cn("flex flex-col gap-1", turno.rol === "CLIENTE" ? "items-end" : "items-start")}
          >
            <p
              className={cn(
                "max-w-[85%] rounded-grupo px-4 py-2 text-cuerpo whitespace-pre-wrap",
                turno.rol === "CLIENTE" ? "bg-acento text-white" : "bg-superficie-2",
              )}
            >
              {turno.texto}
            </p>
            {turno.escalado && <p className="px-2 text-nota text-texto-2">Le pasamos tu mensaje al equipo</p>}
            {turno.rol === "ASISTENTE" && /reserv/i.test(turno.texto) && (
              <Boton variante="texto" onClick={alVerHoras} className="text-rotulo">
                Ver horas libres
              </Boton>
            )}
          </div>
        ))}
        {envio.isPending && (
          <div
            aria-label="El asistente está escribiendo"
            className="flex gap-1 self-start rounded-grupo bg-superficie-2 px-4 py-3"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2 animate-pulse rounded-full bg-texto-2"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={final} />
      </div>

      <div className="border-t border-separador p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error && (
          <p role="alert" className="px-2 pb-2 text-rotulo text-peligro">
            {cuenta.restante > 0
              ? `Muchos intentos seguidos. Intenta de nuevo en ${cuenta.restante} s.`
              : error}
          </p>
        )}
        {lleno ? (
          <p className="px-2 py-2 text-cuerpo text-texto-2">
            Para seguir, escríbele al salón directamente al {formatoTelefono(telefono)}.
          </p>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              enviar();
            }}
          >
            <label htmlFor="chat-mensaje" className="sr-only">
              Tu mensaje
            </label>
            <textarea
              id="chat-mensaje"
              rows={1}
              value={texto}
              maxLength={MAXIMO_MENSAJE_CHAT}
              onChange={(evento) => setTexto(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === "Enter" && !evento.shiftKey) {
                  evento.preventDefault();
                  enviar();
                }
              }}
              placeholder="Escribe tu pregunta"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-control bg-superficie px-4 py-2.5 text-cuerpo outline-none"
            />
            <Boton type="submit" disabled={!texto.trim() || envio.isPending || cuenta.restante > 0}>
              Enviar
            </Boton>
          </form>
        )}
      </div>
    </div>
  );
}
