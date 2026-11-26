"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { crearCita } from "@/api/agenda";
import { ErrorApi } from "@/api/cliente";
import type { Catalogo, Cita } from "@/api/tipos";
import {
  SelectorBarbero,
  SelectorFecha,
  SelectorHora,
  SelectorServicio,
} from "@/components/reserva/selectores";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada } from "@/components/ui/campo";
import { Hoja } from "@/components/ui/hoja";
import { formatoFechaMedia, formatoHora, telefonoParaEnviar } from "@/lib/formato";
import { CUALQUIERA, inicioDeCita, leerSeleccion, type Seleccion } from "@/lib/seleccion";
import { CAMPOS_RESERVA, esquemaDatosReserva, type DatosReserva } from "@/lib/validacion";

/**
 * "Nueva cita" del panel (SPEC-WEB §5.6): los mismos selectores de la página
 * pública, con la selección en el estado de la hoja. La cita nace CONFIRMADA.
 */
export function HojaNuevaCita({
  abierta,
  alCerrar,
  catalogo,
  hoy,
  fecha,
  alCrear,
}: {
  abierta: boolean;
  alCerrar: () => void;
  catalogo: Catalogo;
  hoy: string;
  fecha: string;
  alCrear: (cita: Cita) => void;
}) {
  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo="Nueva cita" className="md:max-w-xl">
      {abierta && <Formulario catalogo={catalogo} hoy={hoy} fecha={fecha} alCrear={alCrear} />}
    </Hoja>
  );
}

function Formulario({
  catalogo,
  hoy,
  fecha,
  alCrear,
}: {
  catalogo: Catalogo;
  hoy: string;
  fecha: string;
  alCrear: (cita: Cita) => void;
}) {
  const clienteQuery = useQueryClient();
  const [seleccion, setSeleccion] = useState<Seleccion>(() =>
    leerSeleccion(new URLSearchParams({ fecha }), catalogo, hoy),
  );
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError: marcarError,
    formState: { errors },
  } = useForm<DatosReserva>({
    resolver: zodResolver(esquemaDatosReserva),
    defaultValues: { nombre: "", celular: "", nota: "" },
  });

  const envio = useMutation({
    mutationFn: (datos: DatosReserva) =>
      crearCita({
        clienteNombre: datos.nombre,
        clienteTelefono: telefonoParaEnviar(datos.celular),
        servicioId: seleccion.servicioId ?? 0,
        estilistaId: seleccion.barbero === CUALQUIERA ? undefined : seleccion.barbero,
        inicio: inicioDeCita(seleccion.fecha, seleccion.hora ?? ""),
        nota: datos.nota || undefined,
      }),
    onSuccess: (cita) => {
      void clienteQuery.invalidateQueries({ queryKey: ["disponibilidad", catalogo.slug] });
      alCrear(cita);
    },
    onError: (fallo) => {
      if (fallo instanceof ErrorApi && fallo.codigo === 400 && Object.keys(fallo.campos).length > 0) {
        for (const [campoApi, mensaje] of Object.entries(fallo.campos)) {
          const campo = CAMPOS_RESERVA[campoApi];
          if (campo) marcarError(campo, { message: mensaje.charAt(0).toUpperCase() + mensaje.slice(1) });
        }
        return;
      }
      if (fallo instanceof ErrorApi && fallo.codigo === 409) {
        void clienteQuery.invalidateQueries({ queryKey: ["disponibilidad", catalogo.slug] });
        setSeleccion((actual) => ({ ...actual, hora: null }));
      }
      setError(fallo.message);
    },
  });

  const completa = seleccion.servicioId !== null && seleccion.hora !== null;
  const props = { catalogo, seleccion, alCambiar: setSeleccion };

  return (
    <form
      noValidate
      onSubmit={handleSubmit((datos) => {
        setError(null);
        envio.mutate(datos);
      })}
      className="flex min-h-0 flex-col"
    >
      <div className="flex flex-col gap-6 overflow-y-auto p-5">
        <div className="overflow-hidden rounded-grupo bg-superficie">
          <Campo id="nueva-nombre" etiqueta="Cliente" error={errors.nombre?.message}>
            <Entrada id="nueva-nombre" autoComplete="off" {...register("nombre")} />
          </Campo>
          <Campo id="nueva-celular" etiqueta="Celular" error={errors.celular?.message}>
            <div className="flex items-center gap-2">
              <span className="text-destacado text-texto-2">+57</span>
              <Entrada
                id="nueva-celular"
                type="tel"
                inputMode="tel"
                placeholder="300 123 4567"
                {...register("celular")}
              />
            </div>
          </Campo>
        </div>
        <SelectorServicio {...props} />
        {seleccion.servicioId !== null && <SelectorBarbero {...props} enHoja />}
        {seleccion.servicioId !== null && <SelectorFecha {...props} hoy={hoy} enHoja />}
        {seleccion.servicioId !== null && <SelectorHora {...props} />}
        <div className="overflow-hidden rounded-grupo bg-superficie">
          <Campo id="nueva-nota" etiqueta="Nota (opcional)" error={errors.nota?.message}>
            <AreaTexto id="nueva-nota" maxLength={300} {...register("nota")} />
          </Campo>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-separador p-4">
        {error && (
          <p role="alert" className="text-rotulo text-peligro">
            {error}
          </p>
        )}
        <Boton type="submit" ancho="completo" disabled={!completa || envio.isPending}>
          {envio.isPending
            ? "Creando…"
            : completa && seleccion.hora
              ? `Crear cita · ${formatoFechaMedia(seleccion.fecha)}, ${formatoHora(seleccion.hora)}`
              : "Elige servicio y hora"}
        </Boton>
      </div>
    </form>
  );
}
