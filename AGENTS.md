<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sillón web · instrucciones para asistentes de código

Este archivo lo leen Claude Code y asistentes similares (`CLAUDE.md` lo importa). También sirve como resumen de convenciones para personas.

## Contexto

Frontend de Sillón: la página pública de cada salón y el panel del dueño y del estilista.
`SPEC-WEB.md` es la fuente de verdad del front. Las reglas de negocio viven en el `SPEC.md` del backend ([`tu-sillon`](https://github.com/DevNico2905/tu-sillon)).
El front **presenta** reglas; nunca las calcula ni las reinterpreta. Si una pantalla necesita algo que la API no da, propón un ticket de backend.

## Stack

- Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, TypeScript estricto. Antes de usar una API de Next, léela en `node_modules/next/dist/docs/`.
- Tailwind CSS 4 con los tokens de `src/app/globals.css`. shadcn/ui como base de componentes.
- TanStack Query para datos del servidor; React Hook Form + Zod para formularios.
- Vitest + Testing Library para tests. pnpm como gestor de paquetes (nunca npm ni yarn).

## Estructura

- `src/app/`: rutas. Componentes de servidor por defecto; `"use client"` solo donde hay estado, efectos o eventos.
- `src/api/cliente.ts`: **el único** lugar que llama a `fetch`. Los componentes usan `peticion` a través de hooks de TanStack Query.
- `src/api/esquema.ts`: tipos generados con `pnpm gen:api`. Nunca lo edites a mano ni escribas tipos de la API a mano.
- `src/sesion/`: la sesión del panel. `sesion.ts` guarda el access token en memoria y coordina el refresh; `proveedor-sesion.tsx` protege `/panel`. Nadie más guarda ni lee el token.
- `src/lib/formato.ts`: dinero, horas, fechas, duraciones y teléfonos. Nunca formatees con `Intl`, `toLocaleString` ni `toLocaleDateString`.
- `src/components/ui/`: componentes base (shadcn/ui adaptados). `src/components/<dominio>/`: componentes de pantalla.
- Los tests van junto al archivo que prueban: `formato.ts` → `formato.test.ts`.

## Diseño

- Solo colores de los tokens: `bg-fondo`, `bg-superficie`, `text-texto-2`, `bg-acento`… Nunca un hexadecimal suelto ni la paleta de Tailwind (`bg-blue-600`, `text-gray-500`).
- Tipografía con la escala de la SPEC: `text-titulo-grande`, `text-titulo`, `text-seccion`, `text-destacado`, `text-cuerpo`, `text-rotulo`, `text-nota`.
- Primero celular (390 px); se amplía con `md:` y `lg:`. Toda área tocable mide al menos 44 px (`min-h-11`).
- Sin degradados, sombras decorativas ni emojis. Una acción principal por pantalla.
- Cada pantalla tiene estado de carga (esqueletos), vacío y error.

## Fechas y horas

- Todo es America/Bogota. "Hoy" sale de `hoyEnBogota()`, nunca de `new Date().toISOString()` ni de la zona del dispositivo.
- La API envía `"2026-11-23"` y `"2026-11-23T10:30:00"` en hora de Bogotá y sin zona. Léelas como texto; nunca con `new Date(texto)`.

## Sesión y seguridad

- El access token vive **solo en memoria**. Nunca en `localStorage`, `sessionStorage` ni en cookies legibles por JavaScript (SPEC-WEB S1).
- Solo las peticiones a `/api/auth/*` llevan `credentials: "include"`. Ya lo hace el cliente HTTP: no lo cambies.
- En el front solo existen variables `NEXT_PUBLIC_*`, y ninguna es un secreto. Nunca agregues llaves de Stripe, Gemini ni de ningún servicio.
- No leas ni escribas `.env.local` ni archivos `.env*` distintos de `.env.example`.
- Nunca muestres `error.codigo`, nombres de excepciones ni texto técnico a la persona. Usa `error.message` del `ErrorApi` o los textos de SPEC-WEB §3.4.

## Código

- Nombres de variables, funciones, componentes y archivos propios en español (`PaginaSalon`, `formatoDinero`). Los componentes que llegan de shadcn/ui conservan su nombre original.
- Todo texto para personas tutea: "Elige tu hora", "Intenta de nuevo". Nunca "usted", "por favor" ni "exitosamente".
- Sin `any`. Si un tipo no se puede expresar, usa `unknown` y valida.
- Sin dependencias nuevas sin justificarlo en el PR.

## Antes de cada PR

```bash
pnpm verificar   # lint, tipos, tests y build
pnpm format:check
```

- Nunca modifiques un test para que pase. Si un test falla, explica si la causa está en el test o en el código y espera la decisión.
- No hagas `git push`: Nick revisa el diff y sube.
