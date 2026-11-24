// Pruebas de punta a punta del F2 contra el backend real (local).
//
// Requisitos:
//   1. Backend corriendo en http://localhost:8080 con http://localhost:3000 en CORS_ORIGENES.
//   2. Front en modo producción en http://localhost:3000:
//        NEXT_PUBLIC_API_URL=http://localhost:8080 pnpm build && pnpm start
//      En modo dev (pnpm dev), el indicador de Next en la esquina inferior izquierda
//      tapa "Cerrar sesión" del menú lateral y Playwright no puede hacer clic.
//   3. Una vez: pnpm add -D playwright && pnpm exec playwright install chromium
//
// Uso:
//   node scripts/probar-f2.mjs
//   VER=1 node scripts/probar-f2.mjs      # abre el navegador para ver cada paso
//
// Crea datos nuevos en cada corrida (un salón, un servicio y una estilista con correos únicos).
// Límites del B4 que el script respeta: 4 inicios de sesión (máximo 5 por minuto) y 2 registros
// (máximo 3 por hora por IP). Para correrlo varias veces seguidas, reinicia el backend:
// los contadores viven en memoria y se borran al reiniciar.
// La redirección segura (?volver a otro sitio) y S3–S5 ya están cubiertos por los tests unitarios.

import { chromium } from "playwright";

const FRONT = process.env.FRONT ?? "http://localhost:3000";
const API = process.env.API ?? "http://localhost:8080";
const S = Date.now();
const DUENO = { email: `dueno-f2-${S}@prueba.co`, password: "Clave-Segura-2026" };
const ESTILISTA = { email: `estilista-f2-${S}@prueba.co`, password: "Clave-Segura-2026" };

let fallas = 0;
function revisar(condicion, descripcion) {
  console.log(`${condicion ? "OK   " : "FALLA"} ${descripcion}`);
  if (!condicion) fallas++;
}

async function api(ruta, { metodo = "GET", cuerpo, token } = {}) {
  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();
  if (!respuesta.ok) throw new Error(`${metodo} ${ruta} → ${respuesta.status} ${texto}`);
  return texto ? JSON.parse(texto) : null;
}

/** Texto de las pestañas visibles de la barra inferior (celular). */
async function pestanas(pagina) {
  const enlaces = await pagina.locator('nav[aria-label="Panel"] a').all();
  const visibles = [];
  for (const enlace of enlaces) if (await enlace.isVisible()) visibles.push(await enlace.innerText());
  return visibles;
}

const navegador = await chromium.launch({ headless: !process.env.VER, slowMo: process.env.VER ? 250 : 0 });

try {
  // ---------- Dueño, en escritorio ----------
  const escritorio = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
  const pg = await escritorio.newPage();

  console.log("\n— Sin sesión (S2, S7)");
  await pg.goto(`${FRONT}/panel/servicios`);
  await pg.waitForURL(/\/entrar\?/);
  revisar(pg.url().includes("volver=%2Fpanel%2Fservicios"), `redirige a /entrar con volver: ${pg.url()}`);

  console.log("\n— Registro");
  await pg.goto(`${FRONT}/registro`);
  await pg.getByRole("button", { name: "Continuar" }).click();
  revisar(
    await pg.getByText("Escribe el nombre de tu salón").isVisible(),
    "el paso 1 valida antes de continuar",
  );
  await pg.fill("#salonNombre", `Prueba F2 ${S}`);
  await pg.fill("#ciudad", "Rionegro");
  await pg.fill("#direccion", "Calle 1 # 2-3");
  await pg.fill("#telefono", "3001112233");
  await pg.getByRole("button", { name: "Continuar" }).click();
  await pg.fill("#nombre", "Dueño Prueba");
  await pg.fill("#email", DUENO.email);
  await pg.fill("#password", DUENO.password);
  revisar(await pg.getByText("Fuerte").isVisible(), "el indicador marca la contraseña como Fuerte");
  await pg.getByRole("button", { name: "Crear mi salón" }).click();
  await pg
    .getByText("Te damos la bienvenida a Sillón")
    .or(pg.getByText("Muchos intentos seguidos"))
    .first()
    .waitFor();
  if (await pg.getByText("Muchos intentos seguidos").isVisible()) {
    throw new Error(
      "el backend frenó el registro con 429 (B4: 3 registros por hora por IP). Reinicia el backend para resetear el límite y vuelve a correr.",
    );
  }
  revisar(pg.url().includes("/panel/agenda"), "entra al panel con el aviso de bienvenida");

  console.log("\n— Dónde vive la sesión (S1)");
  const guardado = await pg.evaluate(() => localStorage.length + sessionStorage.length);
  revisar(guardado === 0, "nada en localStorage ni en sessionStorage");
  revisar(
    (await pg.evaluate(() => document.cookie)) === "",
    "la cookie del refresh no es legible desde JavaScript",
  );
  // La cookie tiene Path=/api/auth: solo aparece si se pregunta por una URL bajo esa ruta.
  const cookies = await escritorio.cookies(`${API}/api/auth/refresh`);
  const refresh = cookies.find((c) => c.httpOnly);
  revisar(Boolean(refresh), `la API dejó una cookie httpOnly (${refresh?.name ?? "ninguna"})`);

  console.log("\n— Recargar (S2)");
  await pg.reload();
  await pg.getByRole("heading", { name: "Agenda" }).waitFor();
  revisar(pg.url().includes("/panel/agenda"), "recargar restaura la sesión con la cookie");
  await pg.locator("aside").getByText(`Prueba F2 ${S}`).waitFor();
  revisar(true, "el menú lateral muestra el nombre del salón (GET /api/salon con el token)");

  console.log("\n— Datos para el estilista (por la API)");
  const { token } = await api("/api/auth/login", { metodo: "POST", cuerpo: DUENO });
  const servicio = await api("/api/servicios", {
    metodo: "POST",
    token,
    cuerpo: { nombre: "Corte clásico", duracionMinutos: 45, precio: 35000 },
  });
  await api("/api/estilistas", {
    metodo: "POST",
    token,
    cuerpo: { nombre: "Sara Prueba", ...ESTILISTA, servicioIds: [servicio.id] },
  });
  revisar(true, "servicio y estilista creados");

  console.log("\n— Cerrar sesión (S6)");
  await pg.locator("aside").getByRole("button", { name: "Cerrar sesión" }).click();
  await pg.waitForURL(/\/entrar$/);
  revisar(true, "cerrar sesión lleva a /entrar");
  await pg.goto(`${FRONT}/panel/agenda`);
  await pg.waitForURL(/\/entrar\?/);
  revisar(true, "después de salir, /panel vuelve a pedir entrar (la cookie quedó revocada)");

  console.log("\n— Entrar");
  await pg.goto(`${FRONT}/entrar?volver=/panel/servicios`);
  await pg.fill("#email", DUENO.email);
  await pg.fill("#password", "contraseña-mala");
  await pg.getByRole("button", { name: "Entrar" }).click();
  await pg.getByText("Correo o contraseña incorrectos.").waitFor();
  revisar(true, "contraseña mala: muestra el mensaje");
  await pg.fill("#password", DUENO.password);
  await pg.getByRole("button", { name: "Entrar" }).click();
  await pg.getByRole("heading", { name: "Servicios" }).waitFor();
  revisar(pg.url().includes("/panel/servicios"), "vuelve a la ruta que pedía");

  console.log("\n— Registro con correo repetido");
  const otra = await navegador.newPage();
  await otra.goto(`${FRONT}/registro`);
  await otra.fill("#salonNombre", `Repetido ${S}`);
  await otra.fill("#ciudad", "Rionegro");
  await otra.fill("#direccion", "Calle 9");
  await otra.fill("#telefono", "3009998877");
  await otra.getByRole("button", { name: "Continuar" }).click();
  await otra.fill("#nombre", "Otra Persona");
  await otra.fill("#email", DUENO.email);
  await otra.fill("#password", DUENO.password);
  await otra.getByRole("button", { name: "Crear mi salón" }).click();
  const repetido = otra.getByText("Ya existe una cuenta con ese correo.");
  const limite = otra.getByText("Muchos intentos seguidos");
  await repetido.or(limite).first().waitFor();
  if (await limite.isVisible()) {
    console.log(
      "OMITIDA el backend frenó el registro con 429 (B4: 3 registros por hora por IP). Reinicia el backend para resetear el límite.",
    );
  } else {
    revisar(true, "409: ofrece entrar en lugar de crear otra cuenta");
  }
  await otra.close();

  console.log("\n— Pestañas del dueño en celular");
  await pg.setViewportSize({ width: 390, height: 844 });
  const tabsDueno = await pestanas(pg);
  revisar(
    JSON.stringify(tabsDueno) === '["Agenda","Solicitudes","Equipo","Más"]',
    `pestañas del dueño: ${tabsDueno.join(", ")}`,
  );

  // ---------- Estilista, en celular ----------
  console.log("\n— Estilista en celular (S8)");
  const celular = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const est = await celular.newPage();
  await est.goto(`${FRONT}/entrar`);
  await est.fill("#email", ESTILISTA.email);
  await est.fill("#password", ESTILISTA.password);
  await est.getByRole("button", { name: "Entrar" }).click();
  await est.getByRole("heading", { name: "Agenda" }).waitFor();
  const tabsEstilista = await pestanas(est);
  revisar(
    JSON.stringify(tabsEstilista) === '["Agenda","Más"]',
    `pestañas del estilista: ${tabsEstilista.join(", ")}`,
  );
  await est.goto(`${FRONT}/panel/equipo`);
  await est.getByText("No tienes acceso a esta sección").waitFor();
  revisar(true, "/panel/equipo escrito a mano: No tienes acceso");
} catch (error) {
  fallas++;
  console.error(`\nFALLA inesperada: ${error.message}`);
} finally {
  await navegador.close();
}

console.log(fallas === 0 ? "\nTodo en verde." : `\n${fallas} prueba(s) fallaron.`);
process.exit(fallas === 0 ? 0 : 1);
