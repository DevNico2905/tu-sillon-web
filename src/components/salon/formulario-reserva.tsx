"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorApi } from "@/api/cliente";
import { reservar } from "@/api/publico";
import type { Catalogo } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada } from "@/components/ui/campo";
import { FilaDato, Grupo } from "@/components/ui/grupo";
import { useCuentaRegresiva } from "@/hooks/use-cuenta-regresiva";
import {
  formatoDinero,
  formatoDuracion,
  formatoFechaMedia,
  formatoHora,
  hoyEnBogota,
  telefonoParaEnviar,
} from "@/lib/formato";
import { guardarReserva } from "@/lib/sesion-navegador";
import { aParametros, CUALQUIERA, inicioDeCita, leerSeleccion } from "@/lib/seleccion";
import { CAMPOS_RESERVA, esquemaDatosReserva, type DatosReserva } from "@/lib/validacion";

/** Tus datos y confirmar (SPEC-WEB §5.2). */
export function FormularioReserva({ catalogo }: { catalogo: Catalogo }) {
  const parametros = useSearchParams();
  const router = useRouter();
  const clienteQuery = useQueryClient();
  const cuenta = useCuentaRegresiva();
  const [conflicto, setConflicto] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const seleccion = leerSeleccion(parametros, catalogo, hoyEnBogota());
  const servicio = catalogo.servicios.find((s) => s.id === seleccion.servicioId);
  const barbero =
    seleccion.barbero === CUALQUIERA ? null : catalogo.estilistas.find((e) => e.id === seleccion.barbero);
  const volver = `/s/${catalogo.slug}?${aParametros(seleccion).toString()}`;
  const volverSinHora = `/s/${catalogo.slug}?${aParametros({ ...seleccion, hora: null }).toString()}`;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DatosReserva>({
    resolver: zodResolver(esquemaDatosReserva),
    defaultValues: { nombre: "", celular: "", nota: "" },
  });

  const envio = useMutation({
    mutationFn: (datos: DatosReserva) =>
      reservar(catalogo.slug, {
        clienteNombre: datos.nombre,
        clienteTelefono: telefonoParaEnviar(datos.celular),
        servicioId: seleccion.servicioId ?? 0,
        estilistaId: seleccion.barbero === CUALQUIERA ? undefined : seleccion.barbero,
        inicio: inicioDeCita(seleccion.fecha, seleccion.hora ?? ""),
        nota: datos.nota || undefined,
      }),
    onSuccess: (cita, datos) => {
      guardarReserva({
        slug: catalogo.slug,
        citaId: cita.id,
        clienteNombre: datos.nombre,
        salonNombre: catalogo.nombre,
        direccion: catalogo.direccion,
        ciudad: catalogo.ciudad,
        servicio: cita.servicioNombre,
        estilista: cita.estilistaNombre,
        inicio: cita.inicio,
        fin: cita.fin,
      });
      void clienteQuery.invalidateQueries({ queryKey: ["disponibilidad", catalogo.slug] });
      router.push(`/s/${catalogo.slug}/reserva-enviada`);
    },
    onError: (fallo) => {
      if (!(fallo instanceof ErrorApi)) {
        setErrorGeneral("Algo falló. Intenta de nuevo.");
        return;
      }
      if (fallo.codigo === 409) {
        // La hora ya no está: se recarga la disponibilidad para elegir otra.
        void clienteQuery.invalidateQueries({ queryKey: ["disponibilidad", catalogo.slug] });
        setConflicto(fallo.message);
        return;
      }
      if (fallo.codigo === 400 && Object.keys(fallo.campos).length > 0) {
        for (const [campoApi, mensaje] of Object.entries(fallo.campos)) {
          const campo = CAMPOS_RESERVA[campoApi];
          if (campo) setError(campo, { message: mensaje.charAt(0).toUpperCase() + mensaje.slice(1) });
        }
        return;
      }
      if (fallo.codigo === 429 && fallo.reintentarEn) cuenta.iniciar(fallo.reintentarEn);
      setErrorGeneral(fallo.message);
    },
  });

  if (!servicio || !seleccion.hora) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-grupo bg-superficie p-5">
        <p className="text-cuerpo">Primero elige el servicio, la fecha y la hora.</p>
        <Boton comoHijo variante="secundario">
          <Link href={volver}>Elegir</Link>
        </Boton>
      </div>
    );
  }

  const enviar = handleSubmit((datos) => {
    if (cuenta.restante > 0) return;
    setConflicto(null);
    setErrorGeneral(null);
    envio.mutate(datos);
  });

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-8">
      <Grupo rotulo="Tu reserva">
        <dl>
          <FilaDato etiqueta="Servicio">{servicio.nombre}</FilaDato>
          <FilaDato etiqueta="Barbero">{barbero?.nombre ?? "Cualquiera disponible"}</FilaDato>
          <FilaDato etiqueta="Cuándo">
            {formatoFechaMedia(seleccion.fecha)} · {formatoHora(seleccion.hora)}
          </FilaDato>
          <FilaDato etiqueta="Duración">{formatoDuracion(servicio.duracionMinutos)}</FilaDato>
          <FilaDato etiqueta="Valor">{formatoDinero(servicio.precio)}</FilaDato>
        </dl>
      </Grupo>

      <Grupo rotulo="Tus datos">
        <Campo id="nombre" etiqueta="Nombre" error={errors.nombre?.message}>
          <Entrada
            id="nombre"
            autoComplete="name"
            aria-invalid={Boolean(errors.nombre)}
            aria-describedby={errors.nombre ? "nombre-error" : undefined}
            {...register("nombre")}
          />
        </Campo>
        <Campo id="celular" etiqueta="Celular" error={errors.celular?.message}>
          <div className="flex items-center gap-2">
            <span className="text-destacado text-texto-2">+57</span>
            <Entrada
              id="celular"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="300 123 4567"
              aria-invalid={Boolean(errors.celular)}
              aria-describedby={errors.celular ? "celular-error" : undefined}
              {...register("celular")}
            />
          </div>
        </Campo>
        <Campo id="nota" etiqueta="Nota (opcional)" error={errors.nota?.message}>
          <AreaTexto
            id="nota"
            maxLength={300}
            placeholder="Algo que el salón deba saber"
            {...register("nota")}
          />
        </Campo>
      </Grupo>

      {conflicto && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-grupo bg-aviso-fondo p-4 text-aviso"
        >
          <p className="text-cuerpo font-medium">{conflicto}</p>
          <Boton comoHijo variante="secundario">
            <Link href={volverSinHora}>Elegir otra hora</Link>
          </Boton>
        </div>
      )}
      {errorGeneral && (
        <p role="alert" className="text-cuerpo text-peligro">
          {cuenta.restante > 0
            ? `Muchos intentos seguidos. Intenta de nuevo en ${cuenta.restante} s.`
            : errorGeneral}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Boton type="submit" ancho="completo" disabled={envio.isPending || envio.isSuccess}>
          {envio.isPending || envio.isSuccess ? "Reservando…" : "Confirmar reserva"}
        </Boton>
        <p className="text-center text-nota text-texto-2">
          Tu reserva queda pendiente hasta que {catalogo.nombre} la confirme. Pagas en el salón.
        </p>
        <Boton comoHijo variante="texto" className="self-center">
          <Link href={volver}>Cambiar la selección</Link>
        </Boton>
      </div>
    </form>
  );
}
