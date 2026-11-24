"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { registrar } from "@/api/auth";
import { ErrorApi } from "@/api/cliente";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { useCuentaRegresiva } from "@/hooks/use-cuenta-regresiva";
import { telefonoParaEnviar } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { CAMPOS_REGISTRO, esquemaRegistro, fortalezaContrasena, type DatosRegistro } from "@/lib/validacion";
import { iniciarSesion } from "@/sesion/sesion";

const PASO_SALON = ["salonNombre", "ciudad", "direccion", "telefono"] as const;

/** /registro en dos pasos: tu salón y tu cuenta (SPEC-WEB §5.5). */
export function FormularioRegistro() {
  const router = useRouter();
  const cuenta = useCuentaRegresiva();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [correoRepetido, setCorreoRepetido] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setError: marcarError,
    control,
    formState: { errors },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    mode: "onTouched",
    defaultValues: {
      salonNombre: "",
      ciudad: "",
      direccion: "",
      telefono: "",
      nombre: "",
      email: "",
      password: "",
    },
  });
  const contrasena = useWatch({ control, name: "password" });
  const fortaleza = fortalezaContrasena(contrasena);

  const envio = useMutation({
    mutationFn: (datos: DatosRegistro) =>
      registrar({ ...datos, telefono: telefonoParaEnviar(datos.telefono) }),
    onSuccess: (respuesta) => {
      iniciarSesion(respuesta);
      router.replace("/panel/agenda?bienvenida=1");
    },
    onError: (fallo) => {
      if (!(fallo instanceof ErrorApi)) {
        setError("Algo falló. Intenta de nuevo.");
        return;
      }
      if (fallo.codigo === 409) {
        setCorreoRepetido(true);
        return;
      }
      if (fallo.codigo === 400 && Object.keys(fallo.campos).length > 0) {
        let volverAlPaso1 = false;
        for (const [campoApi, mensaje] of Object.entries(fallo.campos)) {
          const campo = CAMPOS_REGISTRO[campoApi];
          if (!campo) continue;
          marcarError(campo, { message: mensaje.charAt(0).toUpperCase() + mensaje.slice(1) });
          if ((PASO_SALON as readonly string[]).includes(campo)) volverAlPaso1 = true;
        }
        if (volverAlPaso1) setPaso(1);
        return;
      }
      if (fallo.codigo === 429 && fallo.reintentarEn) cuenta.iniciar(fallo.reintentarEn);
      setError(fallo.message);
    },
  });

  const continuar = async () => {
    if (await trigger(PASO_SALON)) setPaso(2);
  };

  const enviar = handleSubmit((datos) => {
    if (cuenta.restante > 0) return;
    setError(null);
    setCorreoRepetido(false);
    envio.mutate(datos);
  });

  return (
    <form
      onSubmit={(evento) => {
        if (paso === 1) {
          evento.preventDefault();
          void continuar();
          return;
        }
        void enviar(evento);
      }}
      noValidate
      className="flex flex-col gap-6"
    >
      <p className="text-rotulo font-medium text-texto-2">
        Paso {paso} de 2 · {paso === 1 ? "Tu salón" : "Tu cuenta"}
      </p>

      <div className={cn("overflow-hidden rounded-grupo bg-superficie", paso !== 1 && "hidden")}>
        <Campo id="salonNombre" etiqueta="Nombre del salón" error={errors.salonNombre?.message}>
          <Entrada id="salonNombre" autoComplete="organization" {...register("salonNombre")} />
        </Campo>
        <Campo id="ciudad" etiqueta="Ciudad" error={errors.ciudad?.message}>
          <Entrada id="ciudad" autoComplete="address-level2" {...register("ciudad")} />
        </Campo>
        <Campo id="direccion" etiqueta="Dirección" error={errors.direccion?.message}>
          <Entrada id="direccion" autoComplete="street-address" {...register("direccion")} />
        </Campo>
        <Campo id="telefono" etiqueta="Teléfono del salón" error={errors.telefono?.message}>
          <div className="flex items-center gap-2">
            <span className="text-destacado text-texto-2">+57</span>
            <Entrada
              id="telefono"
              type="tel"
              inputMode="tel"
              placeholder="300 123 4567"
              {...register("telefono")}
            />
          </div>
        </Campo>
      </div>

      <div className={cn("overflow-hidden rounded-grupo bg-superficie", paso !== 2 && "hidden")}>
        <Campo id="nombre" etiqueta="Tu nombre" error={errors.nombre?.message}>
          <Entrada id="nombre" autoComplete="name" {...register("nombre")} />
        </Campo>
        <Campo id="email" etiqueta="Correo" error={errors.email?.message}>
          <Entrada id="email" type="email" autoComplete="email" inputMode="email" {...register("email")} />
        </Campo>
        <Campo
          id="password"
          etiqueta="Contraseña"
          error={errors.password?.message}
          ayuda="De 8 a 72 caracteres. Mejor si mezclas letras, números y signos."
        >
          <Entrada id="password" type="password" autoComplete="new-password" {...register("password")} />
          {contrasena && (
            <div className="flex items-center gap-2 pt-1" aria-live="polite">
              <div className="flex flex-1 gap-1" aria-hidden>
                {[1, 2, 3].map((nivel) => (
                  <span
                    key={nivel}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      fortaleza.nivel >= nivel
                        ? fortaleza.nivel === 1
                          ? "bg-peligro"
                          : fortaleza.nivel === 2
                            ? "bg-aviso"
                            : "bg-exito"
                        : "bg-superficie-2",
                    )}
                  />
                ))}
              </div>
              <span className="text-nota text-texto-2">{fortaleza.texto}</span>
            </div>
          )}
        </Campo>
      </div>

      {correoRepetido && (
        <p role="alert" className="text-cuerpo text-peligro">
          Ya existe una cuenta con ese correo.{" "}
          <Link href="/entrar" className="font-semibold text-acento">
            Entrar
          </Link>
        </p>
      )}
      {error && (
        <p role="alert" className="text-cuerpo text-peligro">
          {cuenta.restante > 0
            ? `Muchos intentos seguidos. Intenta de nuevo en ${cuenta.restante} s.`
            : error}
        </p>
      )}

      {paso === 1 ? (
        <Boton type="submit" ancho="completo">
          Continuar
        </Boton>
      ) : (
        <div className="flex flex-col gap-3">
          <Boton type="submit" ancho="completo" disabled={envio.isPending || envio.isSuccess}>
            {envio.isPending || envio.isSuccess ? "Creando tu salón…" : "Crear mi salón"}
          </Boton>
          <Boton type="button" variante="texto" className="self-center" onClick={() => setPaso(1)}>
            Volver a los datos del salón
          </Boton>
        </div>
      )}

      <p className="text-center text-cuerpo text-texto-2">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="font-semibold text-acento">
          Entrar
        </Link>
      </p>
    </form>
  );
}
