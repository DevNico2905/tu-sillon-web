// Pruebas de punta a punta del F3 (agenda) contra el backend real (local).
//
// Requisitos:
//   1. Backend en http://localhost:8080 con http://localhost:3000 en CORS_ORIGENES.
//   2. Front en modo producción en http://localhost:3000:
//        NEXT_PUBLIC_API_URL=http://localhost:8080 pnpm build && pnpm start
//   3. Playwright instalado (ya lo está desde el F2).
//
// Uso:
//   node scripts/probar-f3.mjs
//   VER=1 node scripts/probar-f3.mjs      # abre el navegador para ver cada paso
//
// Prepara sus datos por la API: un salón nuevo, un servicio, una estilista y tres citas
// en el próximo día que el salón abre (mañana, o el lunes si mañana es domingo).
// Límites del B4 que usa: 1 registro (máx. 3 por hora), 3 inicios de sesión (máx. 5 por minuto)
// y 2 reservas públicas (máx. 5 cada 10 minutos). Si chocas con uno, reinicia el backend.

import { chromium } from "playwright";

const FRONT = process.env.FRONT ?? "http://localhost:3000";
const API = process.env.API ?? "http://localhost:8080";
const S = Date.now();
const CLAVE = "Clave-Segura-2026";
const DUENO = { email: `dueno-f3-${S}@prueba.co`, password: CLAVE };
const ESTILISTA = { email: `estilista-f3-${S}@prueba.co`, password: CLAVE };

let fallas = 0;
function revisar(condicion, descripcion) {
  console.log(`${condicion ? "OK   " : "FALLA"} ${descripcion}`);
  if (!condicion) fallas++;
}

async function api(ruta, { metodo = "GET", cuerpo, token } = {}) {
  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();
  if (!respuesta.ok) throw new Error(`${metodo} ${ruta} → ${respuesta.status} ${texto}`);
  return texto ? JSON.parse(texto) : null;
}

/** Próximo día que abre un salón con el horario por defecto (cerrado los domingos), en hora de Bogotá. */
function proximoDiaAbierto() {
  const bogota = new Date(Date.now() - 5 * 3600 * 1000);
  bogota.setUTCDate(bogota.getUTCDate() + 1);
  if (bogota.getUTCDay() === 0) bogota.setUTCDate(bogota.getUTCDate() + 1);
  return bogota.toISOString().slice(0, 10);
}

async function entrar(pagina, cuenta, fecha) {
  await pagina.goto(`${FRONT}/entrar?volver=${encodeURIComponent(`/panel/agenda?fecha=${fecha}`)}`);
  await pagina.fill("#email", cuenta.email);
  await pagina.fill("#password", cuenta.password);
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await pagina.waitForURL(/\/panel\/agenda/);
}

const FECHA = proximoDiaAbierto();
const navegador = await chromium.launch({ headless: !process.env.VER, slowMo: process.env.VER ? 250 : 0 });

try {
  console.log(`\n— Preparar datos por la API (citas del ${FECHA})`);
  const registro = await api("/api/auth/registro", {
    metodo: "POST",
    cuerpo: {
      salonNombre: `Prueba F3 ${S}`,
      ciudad: "Rionegro",
      direccion: "Calle 1 # 2-3",
      telefono: "+573001112233",
      nombre: "Dueño F3",
      ...DUENO,
    },
  });
  const { token, salonSlug: slug } = registro;
  const servicio = await api("/api/servicios", {
    metodo: "POST",
    token,
    cuerpo: { nombre: "Corte clásico", duracionMinutos: 45, precio: 35000 },
  });
  const estilista = await api("/api/estilistas", {
    metodo: "POST",
    token,
    cuerpo: { nombre: "Sara Prueba", ...ESTILISTA, servicioIds: [servicio.id] },
  });
  const reservar = (hora, nombre) =>
    api(`/api/publico/salones/${slug}/reservas`, {
      metodo: "POST",
      cuerpo: {
        clienteNombre: nombre,
        clienteTelefono: "+573001234567",
        servicioId: servicio.id,
        estilistaId: estilista.id,
        inicio: `${FECHA}T${hora}:00`,
      },
    });
  await reservar("10:00", "Ana Pendiente");
  await reservar("11:00", "Luis Pendiente");
  await api("/api/citas", {
    metodo: "POST",
    token,
    cuerpo: {
      clienteNombre: "Pedro Confirmado",
      clienteTelefono: "+573009876543",
      servicioId: servicio.id,
      estilistaId: estilista.id,
      inicio: `${FECHA}T15:00:00`,
    },
  });
  revisar(true, `salón ${slug}: 1 servicio, 1 estilista, 2 reservas en línea y 1 cita del salón`);

  // ---------- Dueño en escritorio ----------
  console.log("\n— Dueño en escritorio");
  const escritorio = await navegador.newContext({ viewport: { width: 1366, height: 900 } });
  const pg = await escritorio.newPage();
  await entrar(pg, DUENO, FECHA);
  await pg.getByText("Ana Pendiente").first().waitFor();
  const cifras = (await pg.locator("dl").first().innerText()).replace(/\s+/g, " ");
  revisar(
    /Citas 3/.test(cifras) && /Por confirmar 2/.test(cifras) && /\$105\.000/.test(cifras),
    `cifras: ${cifras}`,
  );

  const detalle = pg.locator('aside[aria-label="Detalle de la cita"]');
  await pg.locator("button:visible", { hasText: "Ana Pendiente" }).first().click();
  await detalle.getByRole("button", { name: "Confirmar" }).click();
  await pg.getByText("Ana Pendiente: confirmada").waitFor();
  revisar(true, "confirmar una reserva actualiza la agenda sin recargar");

  await pg.locator("button:visible", { hasText: "Pedro Confirmado" }).first().click();
  await detalle.getByRole("button", { name: "Completada" }).click();
  await pg.getByText("Pedro Confirmado: completada").waitFor();
  const cifrasDespues = (await pg.locator("dl").first().innerText()).replace(/\s+/g, " ");
  revisar(/Completadas 1 \$35\.000/.test(cifrasDespues), `completar suma a "Completadas": ${cifrasDespues}`);
  revisar((await detalle.getByRole("button").count()) === 0, "una cita completada ya no tiene acciones");

  console.log("\n— Recordatorio (usa IA de verdad)");
  await pg.locator("button:visible", { hasText: "Ana Pendiente" }).first().click();
  await detalle.getByRole("button", { name: "Redactar recordatorio" }).click();
  const area = pg.locator("#recordatorio");
  const sinIa = pg.getByText("El asistente no está disponible");
  await area.or(sinIa).first().waitFor({ timeout: 45_000 });
  if (await area.isVisible()) {
    const mensaje = await area.inputValue();
    const enlace = await pg.getByRole("link", { name: "Abrir WhatsApp" }).getAttribute("href");
    revisar(
      mensaje.length > 20 && enlace.startsWith("https://wa.me/573001234567?text="),
      `mensaje: "${mensaje.slice(0, 60)}…"`,
    );
  } else {
    console.log(
      "OMITIDA la IA no respondió (502/503): la pantalla muestra el mensaje correcto. Revisa tu clave de Gemini.",
    );
  }
  await pg.keyboard.press("Escape");

  console.log("\n— Nueva cita");
  await pg.getByRole("button", { name: "Nueva cita" }).click();
  const hoja = pg.getByRole("dialog");
  await hoja.locator("#nueva-nombre").fill("María Nueva");
  await hoja.locator("#nueva-celular").fill("3105556677");
  await hoja.getByRole("radio", { name: /Corte clásico/ }).click();
  await hoja.locator("#paso-hora").getByRole("radio").first().click();
  await hoja.getByRole("button", { name: /Crear cita/ }).click();
  await pg.getByText("Cita creada: María Nueva").waitFor();
  await pg.getByText("María Nueva").first().waitFor();
  revisar(true, "la cita creada aparece en la agenda");

  // ---------- Estilista en celular ----------
  console.log("\n— Estilista en celular");
  const celular = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const est = await celular.newPage();
  await entrar(est, ESTILISTA, FECHA);
  await est.getByText("Pedro Confirmado").filter({ visible: true }).first().waitFor();
  revisar(!(await est.getByText("Ingresos esperados").isVisible()), "el estilista no ve ingresos");
  revisar(!(await est.getByRole("button", { name: "Nueva cita" }).isVisible()), "el estilista no crea citas");
  await est.locator("button:visible", { hasText: "Ana Pendiente" }).first().click();
  const acciones = await est.locator("dialog[open] button:visible").allInnerTexts();
  revisar(
    acciones.includes("Completada") && acciones.includes("No asistió") && !acciones.includes("Cancelar"),
    `acciones del estilista en una cita confirmada: ${acciones.join(", ")}`,
  );
  revisar(!acciones.includes("Redactar recordatorio"), "el estilista no redacta recordatorios");
  await est.locator("dialog[open]").getByRole("button", { name: "No asistió" }).click();
  await est.getByText("Ana Pendiente: no asistió").waitFor();
  revisar(true, "el estilista marca No asistió");
} catch (error) {
  fallas++;
  console.error(`\nFALLA inesperada: ${error.message}`);
} finally {
  await navegador.close();
}

console.log(fallas === 0 ? "\nTodo en verde." : `\n${fallas} prueba(s) fallaron.`);
process.exit(fallas === 0 ? 0 : 1);
