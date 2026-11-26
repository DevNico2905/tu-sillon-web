# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Agregado

- **F4 · Gestión del salón:** `/panel/servicios` (crear, editar y desactivar, con el precio formateado al escribir), `/panel/equipo` (agregar con contraseña sugerida, editar servicios, desactivar y asignar contraseña nueva, con el acceso listo para copiar o enviar por WhatsApp; 402 y 409 del backend), `/panel/configuracion` (enlace público, datos del salón y horario) y `/panel/clientes` (búsqueda local por nombre o celular, llamar y WhatsApp). Usa B12 y B13.
- **F3 · Agenda:** `/panel/agenda` con cifras del día, línea de tiempo por estilista con la hora actual y panel de detalle en escritorio; filtro por barbero, "Por confirmar" arriba y hoja de detalle en celular. Cambios de estado con actualización inmediata y vuelta atrás si la API responde 409; "Nueva cita" con los selectores de la página pública; recordatorio redactado por la IA para copiar o abrir en WhatsApp. La fecha vive en la URL (`?fecha=`).
- **F2 · Sesión y panel:** `/entrar` y `/registro` en dos pasos (con indicador de fortaleza de la contraseña); sesión en memoria con refresh por cookie httpOnly, un solo refresh compartido cuando varias peticiones reciben 401, reintento único, refresh preventivo y cierre de sesión (S1–S8); esqueleto de `/panel` con menú lateral en escritorio y pestañas en celular según el rol, y pantallas "Pronto" para F3–F6.
- **F1 · Página pública del salón:** `/s/[slug]` con servicio, barbero (incluido "Cualquiera"), fecha y hora en la URL; `/s/[slug]/reservar` con validación y manejo de 400, 409 y 429; `/s/[slug]/reserva-enviada` con archivo .ics y enlace a Google Maps; chat en una hoja con nombre y contacto, escalamiento y límite de 20 turnos; 404 y error del salón. Tipos generados de la API en `src/api/esquema.ts`.
- **F0 · Proyecto base:** Next.js 16 con TypeScript estricto, Tailwind CSS 4 con los tokens de SPEC-WEB §4 (claro y oscuro), Inter servida desde el repo, botón base al estilo de shadcn/ui, TanStack Query, cliente HTTP único con `ErrorApi`, formatos para Colombia, tests con Vitest, CI en GitHub Actions, Dependabot y página de prueba del sistema de diseño en `/`.
- `SPEC-WEB.md` y `AGENTS.md` versionados.
