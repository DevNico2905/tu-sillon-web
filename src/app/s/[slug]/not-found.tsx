import Link from "next/link";
import { Boton } from "@/components/ui/boton";

export default function SalonNoEncontrado() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-titulo font-bold">Este salón no existe o cambió de enlace.</h1>
      <p className="max-w-sm text-cuerpo text-texto-2">
        Revisa el enlace que te compartieron o pídele al salón uno nuevo.
      </p>
      <Boton variante="secundario" comoHijo>
        <Link href="/">Ir al inicio</Link>
      </Boton>
    </div>
  );
}
