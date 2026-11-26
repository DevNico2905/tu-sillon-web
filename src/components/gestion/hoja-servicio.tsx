"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { actualizarServicio, crearServicio } from "@/api/gestion";
import { ErrorApi } from "@/api/cliente";
import type { Servicio } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada } from "@/components/ui/campo";
import { Hoja } from "@/components/ui/hoja";
import { Interruptor } from "@/components/ui/interruptor";
import { formatoDinero } from "@/lib/formato";
import { esquemaServicio, leerPesos, type DatosServicio } from "@/lib/gestion";

const CAMPOS_API: Record<string, keyof DatosServicio> = {
  nombre: "nombre",
  descripcion: "descripcion",
  duracionMinutos: "duracionMinutos",
  precio: "precio",
};

/** Crear o editar un servicio. `servicio` = "nuevo" abre el formulario vacío. */
export function HojaServicio({
  servicio,
  alCerrar,
}: {
  servicio: Servicio | "nuevo" | null;
  alCerrar: () => void;
}) {
  return (
    <Hoja
      abierta={servicio !== null}
      alCerrar={alCerrar}
      titulo={servicio === "nuevo" ? "Nuevo servicio" : "Editar servicio"}
    >
      {servicio !== null && (
        <Formulario
          key={servicio === "nuevo" ? "nuevo" : servicio.id}
          servicio={servicio === "nuevo" ? null : servicio}
          alTerminar={alCerrar}
        />
      )}
    </Hoja>
  );
}

function Formulario({ servicio, alTerminar }: { servicio: Servicio | null; alTerminar: () => void }) {
  const clienteQuery = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError: marcarError,
    formState: { errors },
  } = useForm<DatosServicio>({
    resolver: zodResolver(esquemaServicio),
    defaultValues: {
      nombre: servicio?.nombre ?? "",
      descripcion: servicio?.descripcion ?? "",
      duracionMinutos: servicio?.duracionMinutos ?? 30,
      precio: servicio ? formatoDinero(servicio.precio) : "",
      activo: servicio?.activo ?? true,
    },
  });

  const guardar = useMutation({
    mutationFn: (datos: DatosServicio) => {
      const solicitud = {
        nombre: datos.nombre,
        descripcion: datos.descripcion || undefined,
        duracionMinutos: datos.duracionMinutos,
        precio: leerPesos(datos.precio),
        activo: datos.activo,
      };
      return servicio ? actualizarServicio(servicio.id, solicitud) : crearServicio(solicitud);
    },
    onSuccess: () => {
      void clienteQuery.invalidateQueries({ queryKey: ["servicios"] });
      void clienteQuery.invalidateQueries({ queryKey: ["catalogo"] });
      alTerminar();
    },
    onError: (fallo) => {
      if (fallo instanceof ErrorApi && fallo.codigo === 400 && Object.keys(fallo.campos).length > 0) {
        for (const [campoApi, mensaje] of Object.entries(fallo.campos)) {
          const campo = CAMPOS_API[campoApi];
          if (campo) marcarError(campo, { message: mensaje.charAt(0).toUpperCase() + mensaje.slice(1) });
        }
        return;
      }
      setError(fallo.message);
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((datos) => {
        setError(null);
        guardar.mutate(datos);
      })}
      className="flex min-h-0 flex-col"
    >
      <div className="flex flex-col gap-6 overflow-y-auto p-5">
        <div className="overflow-hidden rounded-grupo bg-superficie">
          <Campo id="servicio-nombre" etiqueta="Nombre" error={errors.nombre?.message}>
            <Entrada
              id="servicio-nombre"
              autoComplete="off"
              placeholder="Corte clásico"
              {...register("nombre")}
            />
          </Campo>
          <Campo
            id="servicio-descripcion"
            etiqueta="Descripción (opcional)"
            error={errors.descripcion?.message}
            ayuda="Se muestra en tu página debajo del nombre."
          >
            <AreaTexto id="servicio-descripcion" maxLength={300} {...register("descripcion")} />
          </Campo>
        </div>
        <div className="overflow-hidden rounded-grupo bg-superficie">
          <Campo id="servicio-duracion" etiqueta="Duración" error={errors.duracionMinutos?.message}>
            <div className="flex items-center gap-2">
              <Entrada
                id="servicio-duracion"
                type="number"
                inputMode="numeric"
                min={15}
                max={480}
                step={5}
                {...register("duracionMinutos", { valueAsNumber: true })}
              />
              <span className="text-destacado text-texto-2">min</span>
            </div>
          </Campo>
          <Campo id="servicio-precio" etiqueta="Precio" error={errors.precio?.message}>
            <Controller
              control={control}
              name="precio"
              render={({ field }) => (
                <Entrada
                  id="servicio-precio"
                  inputMode="numeric"
                  placeholder="$30.000"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(evento) => {
                    const pesos = leerPesos(evento.target.value);
                    field.onChange(pesos > 0 ? formatoDinero(pesos) : "");
                  }}
                />
              )}
            />
          </Campo>
        </div>
        {servicio && (
          <div className="overflow-hidden rounded-grupo bg-superficie">
            <Controller
              control={control}
              name="activo"
              render={({ field }) => (
                <Interruptor
                  id="servicio-activo"
                  etiqueta="Activo"
                  ayuda={
                    field.value
                      ? "Aparece en tu página y se puede reservar."
                      : "No aparece en tu página. Las citas que ya tiene se mantienen."
                  }
                  activo={field.value}
                  alCambiar={field.onChange}
                />
              )}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-separador p-4">
        {error && (
          <p role="alert" className="text-rotulo text-peligro">
            {error}
          </p>
        )}
        <Boton type="submit" ancho="completo" disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando…" : servicio ? "Guardar cambios" : "Crear servicio"}
        </Boton>
      </div>
    </form>
  );
}
