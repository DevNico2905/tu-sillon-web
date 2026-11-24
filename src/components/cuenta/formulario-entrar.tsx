"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { entrar } from "@/api/auth";
import { ErrorApi } from "@/api/cliente";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { useCuentaRegresiva } from "@/hooks/use-cuenta-regresiva";
import { destinoSeguro } from "@/lib/navegacion-panel";
import { esquemaEntrar, type DatosEntrar } from "@/lib/validacion";
import { iniciarSesion } from "@/sesion/sesion";

/** /entrar (SPEC-WEB §5.5). */
export function FormularioEntrar() {
  const parametros = useSearchParams();
  const router = useRouter();
  const cuenta = useCuentaRegresiva();
  const [error, setError] = useState<string | null>(null);
  const expirada = parametros.get("motivo") === "expirada";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosEntrar>({
    resolver: zodResolver(esquemaEntrar),
    defaultValues: { email: "", password: "" },
  });

  const envio = useMutation({
    mutationFn: entrar,
    onSuccess: (respuesta) => {
      iniciarSesion(respuesta);
      router.replace(destinoSeguro(parametros.get("volver")));
    },
    onError: (fallo) => {
      if (fallo instanceof ErrorApi && fallo.codigo === 401) {
        setError("Correo o contraseña incorrectos.");
        return;
      }
      if (fallo instanceof ErrorApi && fallo.codigo === 429 && fallo.reintentarEn) {
        cuenta.iniciar(fallo.reintentarEn);
      }
      setError(fallo.message);
    },
  });

  const enviar = handleSubmit((datos) => {
    if (cuenta.restante > 0) return;
    setError(null);
    envio.mutate({ email: datos.email, password: datos.password });
  });

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      {expirada && !error && (
        <p role="status" className="rounded-grupo bg-aviso-fondo p-4 text-cuerpo text-aviso">
          Tu sesión terminó. Entra de nuevo.
        </p>
      )}
      <div className="overflow-hidden rounded-grupo bg-superficie">
        <Campo id="email" etiqueta="Correo" error={errors.email?.message}>
          <Entrada id="email" type="email" autoComplete="email" inputMode="email" {...register("email")} />
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={errors.password?.message}>
          <Entrada id="password" type="password" autoComplete="current-password" {...register("password")} />
        </Campo>
      </div>
      {error && (
        <p role="alert" className="text-cuerpo text-peligro">
          {cuenta.restante > 0
            ? `Muchos intentos seguidos. Intenta de nuevo en ${cuenta.restante} s.`
            : error}
        </p>
      )}
      <Boton type="submit" ancho="completo" disabled={envio.isPending || envio.isSuccess}>
        {envio.isPending || envio.isSuccess ? "Entrando…" : "Entrar"}
      </Boton>
      <p className="text-center text-cuerpo text-texto-2">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-acento">
          Crea tu salón
        </Link>
      </p>
    </form>
  );
}
