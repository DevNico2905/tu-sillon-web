import { cacheLife } from "next/cache";
import { ErrorApi } from "./cliente";
import { obtenerCatalogo } from "./publico";
import type { Catalogo } from "./tipos";

/**
 * Catálogo del salón pedido en el servidor y guardado 60 s (SPEC-WEB §3.1).
 * Devuelve null si el salón no existe, para que la página muestre su 404.
 */
export async function catalogoEnCache(slug: string): Promise<Catalogo | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await obtenerCatalogo(slug);
  } catch (error) {
    if (error instanceof ErrorApi && error.codigo === 404) return null;
    throw error;
  }
}
