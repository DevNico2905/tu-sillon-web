"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch, type Control, type FieldValues, type Path } from "react-hook-form";
import { actualizarEstilista, crearEstilista } from "@/api/gestion";
import { ErrorApi } from "@/api/cliente";
import type { Estilista, Servicio } from "@/api/tipos";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Hoja } from "@/components/ui/hoja";
import { Interruptor } from "@/components/ui/interruptor";
import { useCopiar } from "@/hooks/use-copiar";
import { formatoDuracion } from "@/lib/formato";
import {
  esquemaEditarEstilista,
  esquemaNuevoEstilista,
  sugerirContrasena,
  textoAcceso,
  type DatosEditarEstilista,
  type DatosNuevoEstilista,
} from "@/lib/gestion";

interface Acceso {
  nombre: string;
  email: string;
  password: string;
}

/**
 * Agregar o editar a alguien del equipo (R43). Al crear, o al cambiar la
 * contraseña, la hoja termina mostrando el acceso para enviárselo.
 */
export function HojaEstilista({
  estilista,
  servicios,
  alCerrar,
}: {
  estilista: Estilista | "nuevo" | null;
  servicios: Servicio[];
  alCerrar: () => void;
}) {
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const cerrar = () => {
    setAcceso(null);
    alCerrar();
  };
  const titulo = acceso ? "Acceso listo" : estilista === "nuevo" ? "Agregar persona" : "Editar persona";

  return (
    <Hoja abierta={estilista !== null} alCerrar={cerrar} titulo={titulo}>
      {acceso ? (
        <PanelAcceso acceso={acceso} alTerminar={cerrar} />
      ) : estilista === "nuevo" ? (
        <FormularioNuevo servicios={servicios} alGuardar={setAcceso} />
      ) : estilista ? (
        <FormularioEditar
          key={estilista.id}
          estilista={estilista}
          servicios={servicios}
          alGuardar={(datos) => (datos ? setAcceso(datos) : cerrar())}
        />
      ) : null}
    </Hoja>
  );
}

function useInvalidarEquipo() {
  const clienteQuery = useQueryClient();
  return () => {
    void clienteQuery.invalidateQueries({ queryKey: ["estilistas"] });
    void clienteQuery.invalidateQueries({ queryKey: ["catalogo"] });
  };
}

function FormularioNuevo({
  servicios,
  alGuardar,
}: {
  servicios: Servicio[];
  alGuardar: (acceso: Acceso) => void;
}) {
  const invalidar = useInvalidarEquipo();
  const [error, setError] = useState<ErrorApi | Error | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError: marcarError,
    formState: { errors },
  } = useForm<DatosNuevoEstilista>({
    resolver: zodResolver(esquemaNuevoEstilista),
    defaultValues: { nombre: "", email: "", password: sugerirContrasena(), servicioIds: [] },
  });

  const guardar = useMutation({
    mutationFn: (datos: DatosNuevoEstilista) => crearEstilista(datos),
    onSuccess: (creado, datos) => {
      invalidar();
      alGuardar({ nombre: creado.nombre, email: creado.email, password: datos.password });
    },
    onError: (fallo) => {
      if (fallo instanceof ErrorApi && fallo.codigo === 409) {
        marcarError("email", { message: "Ya hay una cuenta con ese correo. Usa otro." });
        return;
      }
      if (marcarCampos(fallo, marcarError)) return;
      setError(fallo);
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
          <Campo id="estilista-nombre" etiqueta="Nombre" error={errors.nombre?.message}>
            <Entrada id="estilista-nombre" autoComplete="off" {...register("nombre")} />
          </Campo>
          <Campo
            id="estilista-email"
            etiqueta="Correo"
            error={errors.email?.message}
            ayuda="Con este correo entra a ver su agenda. No se puede cambiar después."
          >
            <Entrada
              id="estilista-email"
              type="email"
              autoComplete="off"
              autoCapitalize="none"
              inputMode="email"
              {...register("email")}
            />
          </Campo>
          <Campo
            id="estilista-password"
            etiqueta="Contraseña"
            error={errors.password?.message}
            ayuda="Te sugerimos una segura. Al guardar la puedes copiar para enviársela."
          >
            <div className="flex items-center gap-2">
              <Entrada
                id="estilista-password"
                autoComplete="off"
                spellCheck={false}
                {...register("password")}
              />
              <Boton
                type="button"
                variante="texto"
                onClick={() => setValue("password", sugerirContrasena(), { shouldValidate: true })}
              >
                Otra
              </Boton>
            </div>
          </Campo>
        </div>
        <ServiciosOfrecidos
          control={control}
          nombre="servicioIds"
          servicios={servicios}
          error={errors.servicioIds?.message}
        />
      </div>
      <PieFormulario error={error} pendiente={guardar.isPending} texto="Agregar al equipo" />
    </form>
  );
}

function FormularioEditar({
  estilista,
  servicios,
  alGuardar,
}: {
  estilista: Estilista;
  servicios: Servicio[];
  alGuardar: (acceso: Acceso | null) => void;
}) {
  const invalidar = useInvalidarEquipo();
  const [error, setError] = useState<ErrorApi | Error | null>(null);
  const [cambiarContrasena, setCambiarContrasena] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError: marcarError,
    formState: { errors },
  } = useForm<DatosEditarEstilista>({
    resolver: zodResolver(esquemaEditarEstilista),
    defaultValues: {
      nombre: estilista.nombre,
      servicioIds: estilista.servicioIds,
      activo: estilista.activo,
      password: "",
    },
  });
  const activo = useWatch({ control, name: "activo" });

  const guardar = useMutation({
    mutationFn: (datos: DatosEditarEstilista) =>
      actualizarEstilista(estilista.id, { ...datos, password: datos.password || undefined }),
    onSuccess: (guardado, datos) => {
      invalidar();
      alGuardar(
        datos.password ? { nombre: guardado.nombre, email: guardado.email, password: datos.password } : null,
      );
    },
    onError: (fallo) => {
      if (marcarCampos(fallo, marcarError)) return;
      setError(fallo);
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
          <Campo id="estilista-nombre" etiqueta="Nombre" error={errors.nombre?.message}>
            <Entrada id="estilista-nombre" autoComplete="off" {...register("nombre")} />
          </Campo>
          <Campo id="estilista-email" etiqueta="Correo" ayuda="El correo no se puede cambiar.">
            <Entrada id="estilista-email" value={estilista.email} readOnly className="text-texto-2" />
          </Campo>
          {cambiarContrasena ? (
            <Campo
              id="estilista-password"
              etiqueta="Contraseña nueva"
              error={errors.password?.message}
              ayuda="Al guardar se cierran sus sesiones abiertas y podrás copiar el acceso nuevo."
            >
              <div className="flex items-center gap-2">
                <Entrada
                  id="estilista-password"
                  autoComplete="off"
                  spellCheck={false}
                  {...register("password")}
                />
                <Boton
                  type="button"
                  variante="texto"
                  onClick={() => {
                    setCambiarContrasena(false);
                    setValue("password", "");
                  }}
                >
                  Cancelar
                </Boton>
              </div>
            </Campo>
          ) : (
            <div className="px-4 py-2">
              <Boton
                type="button"
                variante="texto"
                className="-ml-2"
                onClick={() => {
                  setCambiarContrasena(true);
                  setValue("password", sugerirContrasena());
                }}
              >
                Asignar contraseña nueva
              </Boton>
            </div>
          )}
        </div>
        <ServiciosOfrecidos
          control={control}
          nombre="servicioIds"
          servicios={servicios}
          error={errors.servicioIds?.message}
        />
        <div className="overflow-hidden rounded-grupo bg-superficie">
          <Controller
            control={control}
            name="activo"
            render={({ field }) => (
              <Interruptor
                id="estilista-activo"
                etiqueta="Activo"
                ayuda={
                  field.value
                    ? "Recibe reservas y puede entrar a su agenda."
                    : "No recibe reservas ni puede entrar. Sus citas pasadas se conservan."
                }
                activo={field.value}
                alCambiar={field.onChange}
              />
            )}
          />
        </div>
        {estilista.activo && !activo && (
          <p className="px-4 text-nota text-texto-2">
            Si tiene citas pendientes o confirmadas, primero cancélalas desde la agenda.
          </p>
        )}
      </div>
      <PieFormulario error={error} pendiente={guardar.isPending} texto="Guardar cambios" />
    </form>
  );
}

/** Casillas de servicios: los activos, más los desactivados que la persona ya tenía. */
function ServiciosOfrecidos<T extends FieldValues>({
  control,
  nombre,
  servicios,
  error,
}: {
  control: Control<T>;
  nombre: Path<T>;
  servicios: Servicio[];
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={nombre}
      render={({ field }) => {
        const elegidos = field.value as number[];
        const visibles = servicios
          .filter((s) => s.activo || elegidos.includes(s.id))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        const alternar = (id: number) =>
          field.onChange(elegidos.includes(id) ? elegidos.filter((x) => x !== id) : [...elegidos, id]);
        return (
          <fieldset className="flex flex-col gap-2">
            <legend className="px-4 pb-2 text-rotulo font-medium text-texto-2">Servicios que ofrece</legend>
            <div className="overflow-hidden rounded-grupo bg-superficie">
              {visibles.map((servicio) => (
                <label
                  key={servicio.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-separador px-4 py-3 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={elegidos.includes(servicio.id)}
                    onChange={() => alternar(servicio.id)}
                    className="size-5 accent-[var(--acento)]"
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="text-cuerpo">{servicio.nombre}</span>
                    <span className="text-rotulo text-texto-2">
                      {formatoDuracion(servicio.duracionMinutos)}
                      {!servicio.activo && " · desactivado"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {error && (
              <p role="alert" className="px-4 text-nota text-peligro">
                {error}
              </p>
            )}
          </fieldset>
        );
      }}
    />
  );
}

/** Errores 400 por campo del backend. Devuelve true si marcó alguno. */
function marcarCampos(
  fallo: Error,
  marcar: (campo: "nombre" | "servicioIds" | "password", error: { message: string }) => void,
): boolean {
  if (!(fallo instanceof ErrorApi) || fallo.codigo !== 400) return false;
  let marco = false;
  for (const [campo, mensaje] of Object.entries(fallo.campos)) {
    const base = campo.split("[")[0];
    if (base === "nombre" || base === "servicioIds" || base === "password") {
      marcar(base, { message: mensaje.charAt(0).toUpperCase() + mensaje.slice(1) });
      marco = true;
    }
  }
  return marco;
}

function PieFormulario({
  error,
  pendiente,
  texto,
}: {
  error: Error | null;
  pendiente: boolean;
  texto: string;
}) {
  const sinCupo = error instanceof ErrorApi && error.codigo === 402;
  return (
    <div className="flex flex-col gap-2 border-t border-separador p-4">
      {error && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-rotulo text-peligro">{error.message}</p>
          {sinCupo && (
            <Boton comoHijo variante="secundario">
              <Link href="/panel/plan">Ver planes</Link>
            </Boton>
          )}
        </div>
      )}
      <Boton type="submit" ancho="completo" disabled={pendiente}>
        {pendiente ? "Guardando…" : texto}
      </Boton>
    </div>
  );
}

function PanelAcceso({ acceso, alTerminar }: { acceso: Acceso; alTerminar: () => void }) {
  const { copiado, copiar } = useCopiar();
  const mensaje = textoAcceso({ ...acceso, urlEntrar: `${window.location.origin}/entrar` });
  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-col gap-4 overflow-y-auto p-5">
        <p className="text-cuerpo">
          Envíale este acceso a {acceso.nombre.split(" ")[0]}. La contraseña no se vuelve a mostrar.
        </p>
        <pre className="rounded-grupo bg-superficie p-4 font-sans text-cuerpo whitespace-pre-wrap">
          {mensaje}
        </pre>
      </div>
      <div className="flex flex-col gap-2 border-t border-separador p-4">
        <div className="grid grid-cols-2 gap-2">
          <Boton variante="secundario" onClick={() => void copiar(mensaje)}>
            {copiado ? "Copiado" : "Copiar acceso"}
          </Boton>
          <Boton comoHijo variante="secundario">
            <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </Boton>
        </div>
        <Boton ancho="completo" onClick={alTerminar}>
          Listo
        </Boton>
      </div>
    </div>
  );
}
