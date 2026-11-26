"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { obtenerMiSalon } from "@/api/auth";
import { ErrorApi } from "@/api/cliente";
import { actualizarDatosSalon, actualizarHorario } from "@/api/gestion";
import type { Salon } from "@/api/tipos";
import { CabeceraPanel } from "@/components/panel/pantalla-pronto";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada, clasesControl } from "@/components/ui/campo";
import { Grupo } from "@/components/ui/grupo";
import { Interruptor } from "@/components/ui/interruptor";
import { useCopiar } from "@/hooks/use-copiar";
import {
  INTERVALOS,
  esquemaDatosSalon,
  esquemaHorario,
  horaCorta,
  type DatosHorario,
  type DatosSalon,
} from "@/lib/gestion";
import { CargandoLista, FalloCarga } from "./estados";

/** Configuración del salón (SPEC-WEB §5.7): enlace público, datos (R44) y horario. */
export function Configuracion() {
  const salon = useQuery({ queryKey: ["salon"], queryFn: obtenerMiSalon });

  return (
    <>
      <CabeceraPanel titulo="Configuración" />
      <div className="flex max-w-3xl flex-col gap-8 px-5 pb-10 md:px-8">
        {salon.isPending && <CargandoLista filas={4} />}
        {salon.isError && (
          <FalloCarga mensaje={salon.error.message} alReintentar={() => void salon.refetch()} />
        )}
        {salon.data && (
          <>
            <EnlacePublico slug={salon.data.slug} />
            <FormularioDatos salon={salon.data} />
            <FormularioHorario salon={salon.data} />
          </>
        )}
      </div>
    </>
  );
}

function useGuardarSalon() {
  const clienteQuery = useQueryClient();
  return (actualizado: Salon) => {
    clienteQuery.setQueryData(["salon"], actualizado);
    void clienteQuery.invalidateQueries({ queryKey: ["catalogo"] });
  };
}

function EnlacePublico({ slug }: { slug: string }) {
  const { copiado, copiar } = useCopiar();
  const url = typeof window === "undefined" ? `/s/${slug}` : `${window.location.origin}/s/${slug}`;
  return (
    <Grupo rotulo="Tu página de reservas">
      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="text-cuerpo font-medium break-all">{url}</p>
        <p className="text-nota text-texto-2">
          Compártela en tu Instagram, en WhatsApp o en un QR. Esta dirección no cambia aunque cambies el
          nombre del salón.
        </p>
        <div className="flex gap-2">
          <Boton variante="secundario" onClick={() => void copiar(url)}>
            {copiado ? "Copiado" : "Copiar enlace"}
          </Boton>
          <Boton comoHijo variante="texto">
            <a href={`/s/${slug}`} target="_blank" rel="noreferrer">
              Abrir
            </a>
          </Boton>
        </div>
      </div>
    </Grupo>
  );
}

const CAMPOS_DATOS: Record<string, keyof DatosSalon> = {
  nombre: "nombre",
  ciudad: "ciudad",
  direccion: "direccion",
  telefono: "telefono",
};

function FormularioDatos({ salon }: { salon: Salon }) {
  const guardado = useGuardarSalon();
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError: marcarError,
    formState: { errors, isDirty },
  } = useForm<DatosSalon>({
    resolver: zodResolver(esquemaDatosSalon),
    defaultValues: {
      nombre: salon.nombre,
      ciudad: salon.ciudad,
      direccion: salon.direccion,
      telefono: salon.telefono,
    },
  });

  const guardar = useMutation({
    mutationFn: actualizarDatosSalon,
    onSuccess: (actualizado) => {
      guardado(actualizado);
      reset({
        nombre: actualizado.nombre,
        ciudad: actualizado.ciudad,
        direccion: actualizado.direccion,
        telefono: actualizado.telefono,
      });
      setEstado({ tipo: "ok", texto: "Datos guardados" });
    },
    onError: (fallo) => {
      if (fallo instanceof ErrorApi && fallo.codigo === 400 && Object.keys(fallo.campos).length > 0) {
        for (const [campoApi, mensaje] of Object.entries(fallo.campos)) {
          const campo = CAMPOS_DATOS[campoApi];
          if (campo) marcarError(campo, { message: mensaje.charAt(0).toUpperCase() + mensaje.slice(1) });
        }
        return;
      }
      setEstado({ tipo: "error", texto: fallo.message });
    },
  });

  return (
    <form
      noValidate
      aria-label="Datos del salón"
      onSubmit={handleSubmit((datos) => {
        setEstado(null);
        guardar.mutate(datos);
      })}
      className="flex flex-col gap-3"
    >
      <Grupo rotulo="Datos del salón">
        <Campo id="salon-nombre" etiqueta="Nombre" error={errors.nombre?.message}>
          <Entrada id="salon-nombre" autoComplete="organization" {...register("nombre")} />
        </Campo>
        <Campo id="salon-ciudad" etiqueta="Ciudad" error={errors.ciudad?.message}>
          <Entrada id="salon-ciudad" autoComplete="address-level2" {...register("ciudad")} />
        </Campo>
        <Campo id="salon-direccion" etiqueta="Dirección" error={errors.direccion?.message}>
          <Entrada id="salon-direccion" autoComplete="street-address" {...register("direccion")} />
        </Campo>
        <Campo id="salon-telefono" etiqueta="Teléfono" error={errors.telefono?.message}>
          <Entrada id="salon-telefono" type="tel" inputMode="tel" {...register("telefono")} />
        </Campo>
      </Grupo>
      <PieSeccion estado={estado} pendiente={guardar.isPending} sinCambios={!isDirty} />
    </form>
  );
}

function FormularioHorario({ salon }: { salon: Salon }) {
  const guardado = useGuardarSalon();
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const actual = salon.configuracion;
  const intervalos = INTERVALOS.includes(actual.intervaloMinutos as (typeof INTERVALOS)[number])
    ? [...INTERVALOS]
    : [...INTERVALOS, actual.intervaloMinutos].sort((a, b) => a - b);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DatosHorario>({
    resolver: zodResolver(esquemaHorario),
    defaultValues: {
      horaApertura: horaCorta(actual.horaApertura),
      horaCierre: horaCorta(actual.horaCierre),
      intervaloMinutos: actual.intervaloMinutos,
      abreDomingos: actual.abreDomingos,
    },
  });

  const guardar = useMutation({
    mutationFn: (datos: DatosHorario) =>
      actualizarHorario({
        ...datos,
        horaApertura: `${datos.horaApertura}:00`,
        horaCierre: `${datos.horaCierre}:00`,
      }),
    onSuccess: (actualizado, datos) => {
      guardado(actualizado);
      reset(datos);
      setEstado({ tipo: "ok", texto: "Horario guardado" });
    },
    onError: (fallo) => setEstado({ tipo: "error", texto: fallo.message }),
  });

  return (
    <form
      noValidate
      aria-label="Horario"
      onSubmit={handleSubmit((datos) => {
        setEstado(null);
        guardar.mutate(datos);
      })}
      className="flex flex-col gap-3"
    >
      <Grupo rotulo="Horario">
        <div className="grid grid-cols-2">
          <Campo id="horario-apertura" etiqueta="Abre" error={errors.horaApertura?.message}>
            <Entrada id="horario-apertura" type="time" step={900} {...register("horaApertura")} />
          </Campo>
          <Campo id="horario-cierre" etiqueta="Cierra" error={errors.horaCierre?.message}>
            <Entrada id="horario-cierre" type="time" step={900} {...register("horaCierre")} />
          </Campo>
        </div>
        <Campo
          id="horario-intervalo"
          etiqueta="Horarios cada"
          ayuda="Cada cuánto empiezan las horas que ven tus clientes al reservar."
        >
          <select
            id="horario-intervalo"
            className={`${clasesControl} min-h-8`}
            {...register("intervaloMinutos", { valueAsNumber: true })}
          >
            {intervalos.map((minutos) => (
              <option key={minutos} value={minutos}>
                {minutos} minutos
              </option>
            ))}
          </select>
        </Campo>
        <Controller
          control={control}
          name="abreDomingos"
          render={({ field }) => (
            <Interruptor
              id="horario-domingos"
              etiqueta="Abre los domingos"
              activo={field.value}
              alCambiar={field.onChange}
            />
          )}
        />
      </Grupo>
      <p className="px-4 text-nota text-texto-2">
        El cambio aplica a las reservas nuevas. Las citas que ya están agendadas no se mueven.
      </p>
      <PieSeccion estado={estado} pendiente={guardar.isPending} sinCambios={!isDirty} />
    </form>
  );
}

function PieSeccion({
  estado,
  pendiente,
  sinCambios,
}: {
  estado: { tipo: "ok" | "error"; texto: string } | null;
  pendiente: boolean;
  sinCambios: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-1">
      <Boton type="submit" disabled={pendiente || sinCambios}>
        {pendiente ? "Guardando…" : "Guardar"}
      </Boton>
      {estado && (
        <p
          role={estado.tipo === "error" ? "alert" : "status"}
          className={estado.tipo === "error" ? "text-rotulo text-peligro" : "text-rotulo text-exito"}
        >
          {estado.texto}
        </p>
      )}
    </div>
  );
}
