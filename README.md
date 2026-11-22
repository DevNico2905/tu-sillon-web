# Sillón web

Frontend de **Sillón**, la agenda en línea para barberías y salones de belleza: la página pública de cada salón, donde los clientes reservan y preguntan, y el panel del dueño y del estilista.

La API vive en [`tu-sillon`](https://github.com/DevNico2905/tu-sillon).

- **Qué se construye y cómo se ve:** [`SPEC-WEB.md`](SPEC-WEB.md)
- **Convenciones para personas y asistentes de código:** [`AGENTS.md`](AGENTS.md)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind CSS 4 · shadcn/ui · TanStack Query · React Hook Form + Zod · Vitest · Vercel.

## Requisitos

- Node.js 22 o superior.
- pnpm 10 (`corepack enable` lo activa con la versión del `package.json`).
- El backend corriendo en local para generar los tipos y probar contra la API.

## Arrancar en local

```bash
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8080
pnpm dev                     # http://localhost:3000
```

Para que el navegador pueda llamar a la API, el backend debe tener `http://localhost:3000` en `CORS_ORIGENES`.

## Comandos

| Comando                         | Qué hace                                                           |
| ------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                      | Servidor de desarrollo                                             |
| `pnpm verificar`                | Lint, tipos, tests y build: lo mismo que corre el CI               |
| `pnpm test` / `pnpm test:watch` | Tests con Vitest                                                   |
| `pnpm format`                   | Formatea con Prettier                                              |
| `pnpm gen:api`                  | Genera `src/api/esquema.ts` desde `/v3/api-docs` del backend local |

## Flujo de trabajo

GitHub Flow, igual que el backend: una rama por ticket (`feat/…`, `fix/…`), un PR con el CI en verde y _squash and merge_ a `main`.
