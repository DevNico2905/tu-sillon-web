# SPEC-WEB · Sillón (frontend)

Frontend de Sillón: la página pública de cada salón y el panel del dueño y del estilista. Consume la API de [`tu-sillon`](https://github.com/DevNico2905/tu-sillon).

Esta SPEC es la fuente de verdad del front. Las reglas de negocio viven en el `SPEC.md` del backend: el front **no** las duplica ni las reinterpreta, solo las presenta. Si una pantalla necesita algo que la API no da, se propone un cambio al backend; nunca se calcula "por fuera" una regla de negocio.

**Diseño de referencia:** [Sillón · Exploración de estilo](https://claude.ai/artifact/GerTt8RqzZYxfUuU2xH7ie), dirección 4 (minimalista) y sus pantallas de flujo.

> **Modelo de negocio en revisión (22 nov 2026).** Los planes, los créditos de IA y la pasarela de pagos van a cambiar: créditos fuera del lenguaje comercial, plan gratis limitado por funciones, precios en COP y una pasarela local en lugar de Stripe. Las pantallas que dependen de eso (Equipo con el límite del plan, Plan y créditos, Resultado del pago y la cifra de créditos de la agenda) se rediseñan antes de su ticket. Ver el documento del proyecto `sillon-modelo-negocio.md`.

---

## 1. Usuarios y dispositivos

| Persona                    | Dispositivo principal                                    | Necesita                                                           |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Cliente final (sin cuenta) | Celular, llega por un enlace de WhatsApp o Instagram     | Reservar en pocos toques y preguntar sin llamar                    |
| Dueño (DUENO)              | Celular entre cliente y cliente; computador en recepción | Ver el día de un vistazo, confirmar reservas, administrar el salón |
| Estilista (ESTILISTA)      | Solo celular                                             | Ver sus citas y marcarlas COMPLETADA o NO_ASISTIO                  |
| Administrador (ADMIN)      | Computador                                               | Fuera de alcance en esta versión (ver §9)                          |

**Regla general: se diseña primero para celular (390 px) y se amplía a escritorio.**

## 2. Stack

| Pieza              | Elección                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router), React, **TypeScript estricto** (`strict: true`, sin `any`)                               |
| Estilos            | Tailwind CSS con los tokens de §4 como variables CSS                                                              |
| Componentes        | shadcn/ui, adaptado a los tokens (los componentes viven en el repo)                                               |
| Datos del servidor | TanStack Query                                                                                                    |
| Formularios        | React Hook Form + Zod                                                                                             |
| Tipos de la API    | `openapi-typescript`, generados desde `/v3/api-docs` del backend                                                  |
| Tests              | Vitest + Testing Library (unidad y componentes) · Playwright (flujos completos)                                   |
| Calidad            | ESLint, Prettier, `tsc --noEmit` y tests en el CI de cada PR                                                      |
| Despliegue         | Vercel                                                                                                            |
| Dominios           | Front: `sillon.nick-bern.com` · API: `api.sillon.nick-bern.com` (mismo _sitio_: requisito de la cookie de sesión) |

## 3. Arquitectura

### 3.1 Rutas

| Ruta                        | Quién            | Render                                                     | Pantalla                             |
| --------------------------- | ---------------- | ---------------------------------------------------------- | ------------------------------------ |
| `/s/[slug]`                 | Público          | Servidor (catálogo) + cliente (selección y disponibilidad) | Página del salón y reserva           |
| `/s/[slug]/reservar`        | Público          | Cliente                                                    | Tus datos y confirmar                |
| `/s/[slug]/reserva-enviada` | Público          | Cliente                                                    | Confirmación                         |
| `/entrar`                   | Público          | Cliente                                                    | Inicio de sesión                     |
| `/registro`                 | Público          | Cliente                                                    | Crear el salón y la cuenta del dueño |
| `/panel`                    | DUENO, ESTILISTA | Cliente                                                    | Redirige a `/panel/agenda`           |
| `/panel/agenda`             | DUENO, ESTILISTA | Cliente                                                    | Agenda del día                       |
| `/panel/solicitudes`        | DUENO            | Cliente                                                    | Bandeja del chatbot                  |
| `/panel/servicios`          | DUENO            | Cliente                                                    | Catálogo                             |
| `/panel/equipo`             | DUENO            | Cliente                                                    | Estilistas                           |
| `/panel/clientes`           | DUENO            | Cliente                                                    | Lista de clientes (solo lectura)     |
| `/panel/plan`               | DUENO            | Cliente                                                    | Plan y pagos                         |
| `/panel/configuracion`      | DUENO            | Cliente                                                    | Horario y datos del salón            |
| `/panel/pago/resultado`     | DUENO            | Cliente                                                    | Vuelta desde la pasarela de pagos    |

- El chat **no** es una ruta: es una hoja que se abre sobre `/s/[slug]`.
- El catálogo de `/s/[slug]` se pide en el servidor con revalidación de 60 s. Es la vitrina del salón: carga rápido y tiene metadatos para buscadores y para la vista previa en WhatsApp (título, descripción, imagen genérica).
- Mientras no exista la página de inicio, `/` muestra el sistema de diseño (página de prueba del F0).

### 3.2 Capa de datos

- **Tipos:** `pnpm gen:api` genera `src/api/esquema.ts` desde `NEXT_PUBLIC_API_URL/v3/api-docs` y el archivo se versiona. Ningún tipo de la API se escribe a mano. Si el backend cambia un campo, el front deja de compilar. Swagger está apagado en el perfil `prod` del backend, así que se genera contra el backend local.
- **Cliente HTTP:** un único módulo `src/api/cliente.ts`. Todas las llamadas pasan por él y nunca se usa `fetch` directo en los componentes. El módulo:
  - agrega `Authorization: Bearer <access>` si hay sesión;
  - envía `credentials: 'include'` **solo** a `/api/auth/*`;
  - convierte toda respuesta de error en un `ErrorApi { codigo, mensaje, campos, reintentarEn? }` a partir del formato único del backend (`codigo`, `error`, `mensaje`, `fecha`) y de la cabecera `Retry-After`. Sin conexión, `codigo` es 0.
- **Server state:** TanStack Query, con una clave por recurso (`['salon']`, `['citas', fecha]`…). Toda mutación invalida lo que afecta.

### 3.3 Sesión

Implementa el diseño del backend (`docs/adr/0005`).

| Regla | Detalle                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1    | El **access token** vive solo en memoria (estado de React). Nunca en `localStorage`, `sessionStorage` ni en una cookie legible por JavaScript                   |
| S2    | Al abrir cualquier ruta de `/panel`, el front llama a `POST /api/auth/refresh`. 200: sesión restaurada. 401: redirige a `/entrar?volver=<ruta>`                 |
| S3    | **Un solo refresh en curso:** si varias peticiones reciben 401 a la vez, todas esperan la misma promesa de refresh y luego se reintentan **una vez**            |
| S4    | Si el refresh responde 401, se borra la sesión en memoria y se redirige a `/entrar` con el mensaje "Tu sesión terminó. Entra de nuevo."                         |
| S5    | Refresh preventivo: un minuto antes de que venza el access token (`expiraEnMinutos`), si la pestaña está visible                                                |
| S6    | Cerrar sesión: `POST /api/auth/logout`, borrar la sesión en memoria y la caché de TanStack Query, e ir a `/entrar`                                              |
| S7    | La protección de rutas es del lado del cliente: el middleware de Next no ve la cookie, porque es de la API. Ningún dato se muestra antes de tener la sesión     |
| S8    | El rol (`DUENO` o `ESTILISTA`) decide qué secciones del menú existen. Un estilista que escribe `/panel/equipo` en la barra ve "No tienes acceso a esta sección" |

### 3.4 Errores de la API

| Código          | Qué ve la persona                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400             | Mensajes junto a cada campo. El backend responde `"campo: mensaje; campo: mensaje"`: el cliente HTTP lo separa por campo                                                                                                                          |
| 401             | Ver S3–S4. En `/entrar`: "Correo o contraseña incorrectos."                                                                                                                                                                                       |
| 402             | Mensaje del backend y un botón "Ver planes" que lleva a `/panel/plan`                                                                                                                                                                             |
| 403             | "No tienes permiso para hacer esto."                                                                                                                                                                                                              |
| 404             | Página pública: "Este salón no existe o cambió de enlace." En el panel: el mensaje del backend                                                                                                                                                    |
| 409             | El mensaje del backend tal cual. Son reglas de negocio ya redactadas para personas, por ejemplo un horario ocupado                                                                                                                                |
| 429             | "Muchos intentos seguidos. Intenta de nuevo en N s.", con cuenta regresiva desde `Retry-After`. El botón queda activo, pero no envía hasta que termine la cuenta. Si la cabecera no llega, "Intenta de nuevo en un momento." sin cuenta regresiva |
| 502 o 503 en IA | "El asistente no está disponible en este momento. Intenta en un rato."                                                                                                                                                                            |
| Error de red    | "Sin conexión. Revisa tu internet e intenta de nuevo.", con botón para reintentar                                                                                                                                                                 |

Nunca se muestran códigos, nombres de excepciones ni texto técnico.

## 4. Sistema de diseño

### 4.1 Principios

1. **Menos es más:** blanco, gris y un acento. El color se usa solo para lo seleccionado, la acción principal y los estados de las citas.
2. **Jerarquía por tamaño y peso**, no por adornos. Nada de degradados, sombras decorativas ni emojis.
3. **Listas agrupadas** sobre tarjetas sueltas.
4. **Una acción principal por pantalla.**
5. **La página pública es la vitrina del salón:** el salón es protagonista y Sillón aparece solo en el pie ("Con Sillón").

### 4.2 Tokens

Definidos en `src/app/globals.css` y expuestos como utilidades de Tailwind (`bg-fondo`, `text-texto-2`, `border-separador`…).

| Token                           | Claro                 | Oscuro                | Uso                                                |
| ------------------------------- | --------------------- | --------------------- | -------------------------------------------------- |
| `--fondo`                       | `#F5F5F7`             | `#000000`             | Fondo de página                                    |
| `--superficie`                  | `#FFFFFF`             | `#1C1C1E`             | Tarjetas y listas                                  |
| `--superficie-2`                | `#E3E3E8`             | `#2C2C2E`             | Controles segmentados, burbujas del asistente      |
| `--texto`                       | `#1D1D1F`             | `#F5F5F7`             | Texto principal                                    |
| `--texto-2`                     | `#6E6E73`             | `#98989D`             | Texto secundario                                   |
| `--separador`                   | `#D2D2D7`             | `#38383A`             | Separadores de 0.5 px                              |
| `--acento`                      | `#2F6BFF`             | `#2F6BFF`             | Selección y acción principal (texto blanco encima) |
| `--acento-suave`                | acento al 12 %        | acento al 25 %        | Citas confirmadas                                  |
| `--exito`                       | `#1A7F37`             | `#30D158`             | "Abierto"                                          |
| `--aviso-fondo` / `--aviso`     | `#FFF4E0` / `#8A4B00` | `#3A2A10` / `#FFB340` | Por confirmar (con borde punteado)                 |
| `--peligro-fondo` / `--peligro` | `#FDECEC` / `#B42318` | `#3B1716` / `#FF6961` | No asistió, cancelar                               |
| `--completada`                  | `#EDEDF0`             | `#2C2C2E`             | Citas completadas                                  |
| `--ahora`                       | `#E5484D`             | `#FF453A`             | Línea de la hora actual                            |

- **Modo oscuro:** sigue `prefers-color-scheme`, sin interruptor en esta versión.
- **Contraste:** todo texto cumple 4.5:1 (WCAG AA) en ambos modos.

### 4.3 Tipografía, forma y espacio

- **Fuente:** Inter variable, servida desde el repo con `next/font/local` (no depende de Google Fonts al compilar). Espaciado de letras de −0.2 px. Pesos 400, 500, 600 y 700.
- **Escala** (utilidades `text-titulo-grande`, `text-titulo`, `text-seccion`, `text-destacado`, `text-cuerpo`, `text-rotulo`, `text-nota`):

  | Uso               | Tamaño y peso            |
  | ----------------- | ------------------------ |
  | Título grande     | 34 / 700                 |
  | Título            | 28 / 700                 |
  | Título de sección | 22 / 700                 |
  | Cuerpo destacado  | 17 / 500–600             |
  | Cuerpo            | 15–16 / 400              |
  | Rótulo de grupo   | 13 / 500, en `--texto-2` |
  | Nota              | 12 / 400                 |

- **Radios:** 16 px en grupos y tarjetas (`rounded-grupo`), 12 px en botones y celdas (`rounded-control`), píldora en etiquetas.
- **Espaciado:** de 4 en 4 px. Márgenes laterales de 20 px en celular y de 32 px en escritorio.
- **Toques:** toda área tocable mide al menos 44 × 44 px.
- **Barras fijas** (resumen de la reserva, pestañas): fondo translúcido con `backdrop-filter: blur(20px)` y separador superior.

### 4.4 Tono y formatos

- **Se le habla de tú:** "Elige tu hora", "Tus datos", "Reservar".
- Botones con verbo y en minúscula inicial: "Confirmar reserva", "Ver horas libres". Nunca "Aceptar" ni "Enviar" a secas.
- Sin "por favor", sin "exitosamente", sin signos de exclamación en los mensajes del sistema.

| Dato        | Formato                                                        | Ejemplo                     |
| ----------- | -------------------------------------------------------------- | --------------------------- |
| Dinero      | Pesos sin decimales, punto de miles                            | `$35.000`                   |
| Hora        | 12 horas, con `a. m.` o `p. m.`                                | `10:30 a. m.`, `2:00 p. m.` |
| Fecha corta | Día abreviado y número                                         | `Lun 23`                    |
| Fecha media | —                                                              | `Lun 23 de nov`             |
| Fecha larga | —                                                              | `Lunes 23 de noviembre`     |
| Duración    | —                                                              | `45 min`, `1 h 15 min`      |
| Teléfono    | Se muestra `+57 300 123 4567`; se envía solo con dígitos y `+` | —                           |

- Toda fecha y hora se interpreta en **America/Bogota**, sin importar la zona del dispositivo.
- Los formatos están en `src/lib/formato.ts`, implementados a mano y **no** con `Intl`. Hay que evitar el espacio duro invisible que inserta `Intl` (mismo problema que resolvió `FormatoColombia` en el backend).
- Las fechas de la API (`"2026-11-23"`, `"2026-11-23T10:30:00"`) ya vienen en hora de Bogotá y sin zona: se leen como texto, nunca con `new Date(texto)`.

### 4.5 Accesibilidad

- HTML semántico: `<button>`, `<a href>`, `<label>` en cada campo y `aria-label` en los botones que solo tienen ícono.
- Foco visible en todo control. La hoja del chat atrapa el foco y se cierra con Escape.
- Los estados de las citas **no** se distinguen solo por color: siempre llevan texto ("Por confirmar") o un patrón (borde punteado).
- `prefers-reduced-motion` desactiva las animaciones.

## 5. Pantallas

Cada pantalla define su estado de **carga** (esqueletos con la forma del contenido, nunca spinners a pantalla completa), su estado **vacío** y su estado de **error** (§3.4).

### 5.1 Página del salón · `/s/[slug]` (F1)

**Datos:** `GET /api/publico/salones/{slug}` (en el servidor) y `GET …/disponibilidad?servicioId&estilistaId&fecha` (en el cliente; `estilistaId` es opcional desde el B7).

**Cabecera:** monograma del salón (iniciales), nombre, "Barbería · ciudad", estado "Abierto" o "Cerrado" calculado con `horaApertura`, `horaCierre` y `abreDomingos` (B9), y un botón de chat.

**Flujo, en una sola página con la barra inferior fija:**

1. **Servicio:** lista agrupada con nombre, duración y precio; la selección se marca con un check. Si hay un solo servicio, queda elegido.
2. **Barbero:** avatares con iniciales. Solo aparecen los que ofrecen el servicio elegido (`estilistas[].servicioIds`). La primera opción es "Cualquiera" (B7): sin `estilistaId`, y la API asigna uno libre al reservar.
3. **Fecha:** los próximos 14 días en un carrusel horizontal; hoy es la primera opción. Los domingos se deshabilitan si `abreDomingos` es falso.
4. **Hora:** cuadrícula de 4 columnas. Si no hay horas: "No hay horas libres este día. Prueba otro."

- **Barra inferior:** aparece cuando hay servicio, barbero, fecha y hora. Muestra el resumen ("Lun 23 de nov · 10:30 a. m.", "Corte clásico con Mateo · 45 min", "$35.000") y el botón "Reservar". Con "Cualquiera", el resumen dice "Corte clásico · 45 min" y el barbero asignado aparece en la confirmación.
- **Cambios en la selección:** cambiar el servicio borra el barbero si este no lo ofrece; cambiar el servicio, el barbero o la fecha borra la hora.
- **La selección vive en la URL** (`?servicio=&barbero=&fecha=&hora=`). Así se puede compartir y "Atrás" funciona.

**Criterios:**

- [ ] Un slug que no existe muestra la página 404 del salón.
- [ ] Nunca se muestran correos ni teléfonos de los estilistas.
- [ ] La disponibilidad se vuelve a pedir al cambiar el servicio, el barbero o la fecha, y no al cambiar solo la hora.
- [ ] Con 390 px de ancho, toda la página se usa con una mano y sin scroll horizontal.

### 5.2 Tus datos · `/s/[slug]/reservar` (F1)

**Datos:** `POST /api/publico/salones/{slug}/reservas`.

- Muestra el resumen como lista agrupada (servicio, barbero, cuándo, valor).
- Campos: nombre (obligatorio, máximo 100), celular (obligatorio, de 7 a 30, con prefijo `+57` visible) y nota opcional (máximo 300). Zod aplica los mismos límites que el backend.
- Debajo del botón: "Tu reserva queda pendiente hasta que [salón] la confirme. Pagas en el salón."
- **409 por hora ocupada:** "Alguien acaba de tomar esa hora. Elige otra.", con un botón que vuelve a la hora con la disponibilidad recargada.
- Mientras se envía, el botón muestra "Reservando…" y no admite un segundo envío.

### 5.3 Reserva enviada · `/s/[slug]/reserva-enviada` (F1)

- Check grande con el acento, "Reserva enviada" y "[Nombre], [salón] confirmará tu cita pronto."
- Tarjeta con la fecha, la hora, el servicio, el barbero (el asignado, si se eligió "Cualquiera") y la dirección.
- **"Al calendario":** descarga un `.ics` generado en el front con la hora de Bogotá.
- **"Cómo llegar":** abre Google Maps con la dirección y la ciudad.
- Si se entra directo, sin una reserva en el estado de la sesión del navegador, redirige a `/s/[slug]`.

### 5.4 Chat · hoja sobre `/s/[slug]` (F1)

**Datos:** `POST /api/publico/salones/{slug}/chat` con `clienteNombre`, `clienteContacto` e `historial` (turnos con `rol` en mayúsculas: `CLIENTE` o `ASISTENTE`). El historial completo viaja en cada envío, con un máximo de 20 turnos y 500 caracteres por mensaje.

- Antes del primer mensaje pide nombre y contacto (el backend los exige). Se recuerdan durante la sesión del navegador.
- Burbujas del usuario a la derecha con el acento; las del asistente, a la izquierda en `--superficie-2`.
- Si la respuesta menciona reservar, aparece un botón "Ver horas libres" que cierra la hoja y lleva al paso de la hora.
- Si `escalado = true`: debajo de la respuesta, "Le pasamos tu mensaje al equipo".
- Mientras espera, se ven tres puntos animados. Con 402 (el salón no tiene IA disponible): "El asistente no está disponible. Escríbele al salón al [teléfono]."
- Al llegar a 20 turnos: "Para seguir, escríbele al salón directamente."

### 5.5 Entrar y registro · `/entrar`, `/registro` (F2)

- `/entrar`: correo y contraseña. Con 401: "Correo o contraseña incorrectos." Con 429: cuenta regresiva. Al entrar, va a `volver` o a `/panel/agenda`.
- `/registro`: en dos pasos.
  1. Tu salón: nombre, ciudad, dirección y teléfono.
  2. Tu cuenta: nombre, correo y contraseña (8 a 72 caracteres, con indicador de fortaleza).

  Al terminar va a `/panel/agenda`, con un aviso de bienvenida que lleva a crear servicios y equipo.

- Con 409 por correo repetido: "Ya existe una cuenta con ese correo. [Entrar]".

### 5.6 Agenda · `/panel/agenda` (F3)

**Datos:** `GET /api/citas?fecha=`, `PATCH /api/citas/{id}/estado`, `POST /api/citas`, `POST /api/citas/{id}/recordatorio`, `GET /api/salon` (horario y plan).

**Escritorio (≥ 1024 px):**

- **Menú lateral:** salón y plan, Agenda, Solicitudes (con la cantidad pendiente), Servicios, Equipo, Clientes, Plan, Configuración, Cerrar sesión.
- **Cabecera:** fecha larga, "Agenda", navegación anterior · hoy · siguiente, y "Nueva cita".
- **Cifras:**

  | Cifra              | Cómo se calcula                                                                        |
  | ------------------ | -------------------------------------------------------------------------------------- |
  | Citas hoy          | Todas las citas del día                                                                |
  | Por confirmar      | Citas PENDIENTE                                                                        |
  | Ingresos esperados | Suma del precio de las citas PENDIENTE, CONFIRMADA y COMPLETADA, calculada en el front |
  | Cuarta cifra       | Por definir con el modelo de negocio (los créditos de IA dejan de mostrarse al dueño)  |

- **Línea de tiempo:** una columna por estilista activo, de la apertura al cierre del salón, a 64 px por hora. Cada cita es un bloque con hora, cliente y servicio. Colores por estado (§4.2), y la línea de "ahora" si la fecha es hoy.
- **Panel de detalle de la cita seleccionada:**
  - estado y origen, cliente con teléfono (enlace `tel:`), servicio, hora, barbero, valor y nota;
  - las acciones permitidas **según la tabla de transiciones del backend**: de PENDIENTE se puede Confirmar o Cancelar; de CONFIRMADA, Completada, No asistió o Cancelar; los estados finales no tienen acciones;
  - "Redactar recordatorio", solo para citas PENDIENTE o CONFIRMADA.

**Celular:**

- Título "Hoy" (o la fecha), un control segmentado por barbero (Todos o cada uno) y la sección "Por confirmar" arriba con sus botones a mano.
- Debajo, la lista del día con la marca de la hora actual y una barra de pestañas: Agenda, Solicitudes, Equipo y Más.
- Tocar una cita abre su detalle como hoja, con las mismas acciones que en escritorio.

**Recordatorio:** se abre una hoja con el mensaje generado, el teléfono del cliente, "Copiar" y "Abrir WhatsApp" (`https://wa.me/<telefono>?text=<mensaje>`). En esta versión Sillón nunca envía nada solo; el envío automático por WhatsApp es una función futura del modelo de negocio.

**Estilista:** la misma agenda, solo con sus citas, sin cifras de ingresos y con dos acciones únicamente: "Completada" y "No asistió".

**Criterios:**

- [ ] Cambiar un estado actualiza la agenda sin recargar, y si la API responde 409, el bloque vuelve a su estado anterior.
- [ ] El estilista nunca ve ni puede disparar "Confirmar" o "Cancelar".
- [ ] "Nueva cita" reutiliza los componentes de selección de 5.1 y crea la cita CONFIRMADA (`POST /api/citas`).

### 5.7 Resto del panel (F4–F6)

| Pantalla           | Ticket | Contenido                                                                                                                                                                         |
| ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Servicios          | F4     | Lista agrupada; crear y editar en una hoja (nombre, descripción, duración de 15 a 480, precio > 0, activo)                                                                        |
| Equipo             | F4     | Estilistas con sus servicios. El mensaje de límite de plan se define con el modelo de negocio nuevo                                                                               |
| Configuración      | F4     | Horario (apertura, cierre, intervalo de 15 a 60, domingos)                                                                                                                        |
| Clientes           | F4     | Lista de solo lectura con búsqueda local                                                                                                                                          |
| Plan               | F5     | **En revisión.** Depende de los planes nuevos y de la pasarela local                                                                                                              |
| Resultado del pago | F5     | **En revisión.** El plan cambia cuando llega la confirmación de la pasarela, no al volver: la pantalla consulta `/api/salon` cada 2 s, hasta 30 s, y muestra "Activando tu plan…" |
| Solicitudes        | F6     | Bandeja del chatbot, de la más reciente a la más antigua, con motivo, mensajes y "Marcar como atendida"                                                                           |

## 6. Cambios requeridos en el backend

Van como tickets del repo `tu-sillon` **antes** del ticket del front que los necesita.

| Ticket  | Cambio                                                                                                                                                               | Lo necesita     | Estado                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------- |
| **B7**  | Disponibilidad y reserva con `estilistaId` opcional ("Cualquiera", R40)                                                                                              | F1              | Hecho                              |
| **B8**  | Tono de tú en todos los mensajes y prompts (R41)                                                                                                                     | F1              | Hecho                              |
| **B9**  | Horario estructurado en el catálogo público (R42)                                                                                                                    | F1              | Hecho                              |
| **B10** | Desplegar la API en `api.sillon.nick-bern.com` y agregar `https://sillon.nick-bern.com` a `CORS_ORIGENES`                                                            | F0 (producción) | En pausa hasta decidir la pasarela |
| **B11** | Exponer `Retry-After` por CORS (`setExposedHeaders`). Sin eso, el navegador no deja leer la cabecera desde otro origen y el 429 no puede mostrar la cuenta regresiva | F1, F2          | Pendiente                          |

## 7. Plan de tickets del front

| Ticket | Contenido                                                                                                                                                                                                                               | Depende de          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **F0** | Proyecto base: Next.js, TypeScript, Tailwind con tokens, shadcn/ui, Inter, cliente HTTP con `ErrorApi`, utilidades de formato, CI (lint, tipos, tests, build), despliegue en Vercel y página de prueba con los tokens en claro y oscuro | —                   |
| **F1** | Tipos generados de la API, página del salón, tus datos, confirmación y chat                                                                                                                                                             | F0, B7, B8, B9, B11 |
| **F2** | Entrar, registro, sesión (S1–S8) y el esqueleto del panel con su menú                                                                                                                                                                   | F0                  |
| **F3** | Agenda (escritorio y celular), detalle, cambios de estado, nueva cita y recordatorio                                                                                                                                                    | F2                  |
| **F4** | Servicios, equipo, configuración y clientes                                                                                                                                                                                             | F2                  |
| **F5** | Plan y resultado del pago (se rediseña con el modelo de negocio nuevo)                                                                                                                                                                  | F2, pasarela        |
| **F6** | Solicitudes y vista del estilista revisada                                                                                                                                                                                              | F3                  |

Cada ticket es una rama y un PR con el CI en verde, como en el backend.

## 8. Calidad

- **Rendimiento:** Lighthouse en celular de 90 o más en rendimiento y accesibilidad para `/s/[slug]`. El primer contenido visible, en menos de 2 s con 4G.
- **Tests:**
  - **Unidad:** formatos (dinero, horas, fechas), el cliente HTTP (mapeo de errores y refresh en paralelo) y los esquemas Zod.
  - **Componentes:** selección de la reserva y transiciones permitidas por estado.
  - **Playwright:** reservar de punta a punta y entrar → confirmar una cita → salir, contra la API local.
- **Sin secretos en el front:** solo variables `NEXT_PUBLIC_*` que pueden ser públicas, como la URL de la API.
- **Navegadores:** Safari iOS y Chrome Android de los últimos dos años, más los navegadores de escritorio actuales.

## 9. Fuera de alcance (esta versión)

- Panel del ADMIN.
- Color y logo propios por salón (requiere campos nuevos en el backend).
- Notificaciones push o por correo, y envío automático por WhatsApp (llega con el modelo de negocio nuevo).
- Interruptor manual de modo oscuro.
- Varios idiomas.
- Cerrar sesión en todos los dispositivos (requiere un endpoint nuevo).
