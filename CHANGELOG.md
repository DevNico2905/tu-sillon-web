# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Agregado

- **F1 · Página pública del salón:** `/s/[slug]` con servicio, barbero (incluido "Cualquiera"), fecha y hora en la URL; `/s/[slug]/reservar` con validación y manejo de 400, 409 y 429; `/s/[slug]/reserva-enviada` con archivo .ics y enlace a Google Maps; chat en una hoja con nombre y contacto, escalamiento y límite de 20 turnos; 404 y error del salón. Tipos generados de la API en `src/api/esquema.ts`.
- **F0 · Proyecto base:** Next.js 16 con TypeScript estricto, Tailwind CSS 4 con los tokens de SPEC-WEB §4 (claro y oscuro), Inter servida desde el repo, botón base al estilo de shadcn/ui, TanStack Query, cliente HTTP único con `ErrorApi`, formatos para Colombia, tests con Vitest, CI en GitHub Actions, Dependabot y página de prueba del sistema de diseño en `/`.
- `SPEC-WEB.md` y `AGENTS.md` versionados.
