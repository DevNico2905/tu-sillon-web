// Pruebas de punta a punta del F4 (servicios, equipo, configuración y clientes) contra el backend real (local).
//
// Requisitos:
//   1. Backend en http://localhost:8080 con B12 y B13, y http://localhost:3000 en CORS_ORIGENES.
//   2. Front en modo producción en http://localhost:3000:
//        NEXT_PUBLIC_API_URL=http://localhost:8080 pnpm build && pnpm start
//
// Uso:
//   node scripts/probar-f4.mjs
//   VER=1 node scripts/probar-f4.mjs      # abre el navegador para ver cada paso
//
// Crea un salón nuevo por la API y hace todo lo demás desde la interfaz.
// Límites del B4 que usa: 1 registro (máx. 3 por hora), 3 inicios de sesión (máx. 5 por minuto)
// y 1 reserva pública (máx. 5 cada 10 minutos). Si chocas con uno, reinicia el backend.

import { chromium } from "playwright";

const FRONT = process.env.FRONT ?? "http://localhost:3000";
const API = process.env.API ?? "http://localhost:8080";
const S = Date.now();
const DUENO = { email: `dueno-f4-${S}@prueba.co`, password: "Clave-Segura-2026" };
const CORREO_LAURA = `laura-f4-${S}@prueba.co`;

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

async function entrar(pagina, email, password) {
  await pagina.goto(`${FRONT}/entrar`);
  await pagina.fill("#email", email);
  await pagina.fill("#password", password);
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await pagina.waitForURL(/\/panel\/agenda/);
}

const hoja = (pagina) => pagina.locator("dialog[open]");
const cerrarHoja = (pagina) => hoja(pagina).getByRole("button", { name: "Cerrar" }).click();

/** Primer hueco libre de una estilista en los próximos 7 días (hora de Bogotá). */
async function primerHueco(slug, servicioId, estilistaId) {
  for (let d = 1; d <= 7; d++) {
    const fecha = new Date(Date.now() + d * 864e5 - 5 * 36e5).toISOString().slice(0, 10);
    const disp = await api(
      `/api/publico/salones/${slug}/disponibilidad?servicioId=${servicioId}&estilistaId=${estilistaId}&fecha=${fecha}`,
    );
    if (disp.horariosLibres.length > 0) return `${fecha}T${disp.horariosLibres[0]}`;
  }
  throw new Error("No hay horarios libres en los próximos 7 días");
}

const navegador = await chromium.launch({ headless: !process.env.VER, slowMo: process.env.VER ? 250 : 0 });

try {
  console.log("\n— Preparar el salón por la API");
  const { token, salonSlug: slug } = await api("/api/auth/registro", {
    metodo: "POST",
    cuerpo: {
      salonNombre: `Prueba F4 ${S}`,
      ciudad: "Rionegro",
      direccion: "Calle 1 # 2-3",
      telefono: "+573001112233",
      nombre: "Dueño F4",
      ...DUENO,
    },
  });
  console.log(`OK    salón ${slug}`);

  const contexto = await navegador.newContext({ viewport: { width: 1366, height: 900 } });
  await contexto.grantPermissions(["clipboard-read", "clipboard-write"], { origin: FRONT });
  const d = await contexto.newPage();
  await entrar(d, DUENO.email, DUENO.password);

  console.log("\n— Servicios");
  await d.goto(`${FRONT}/panel/servicios`);
  await d.getByText("Todavía no tienes servicios").waitFor();
  revisar(true, "salón nuevo: muestra la lista vacía");
  for (const [nombre, duracion, precio] of [
    ["Corte clásico", "45", "35000"],
    ["Barba", "30", "20000"],
  ]) {
    await d
      .getByRole("button", { name: /Nuevo servicio|Crear servicio/ })
      .first()
      .click();
    await d.fill("#servicio-nombre", nombre);
    await d.fill("#servicio-duracion", duracion);
    await d.fill("#servicio-precio", precio);
    await hoja(d).getByRole("button", { name: "Crear servicio" }).click();
    await d.getByRole("button", { name: new RegExp(nombre) }).waitFor();
  }
  await d.getByText("Activos · 2").waitFor();
  revisar(true, "crea dos servicios desde la hoja");
  await d.getByRole("button", { name: /Barba/ }).click();
  await d.click("#servicio-activo");
  await hoja(d).getByRole("button", { name: "Guardar cambios" }).click();
  await d.getByText("Desactivados · 1").waitFor();
  const catalogo = await api(`/api/publico/salones/${slug}`);
  revisar(
    catalogo.servicios.length === 1 && catalogo.servicios[0].nombre === "Corte clásico",
    "desactivar 'Barba' la saca del catálogo público",
  );
  const corte = catalogo.servicios[0];

  console.log("\n— Equipo");
  await d.goto(`${FRONT}/panel/equipo`);
  await d.getByText("Todavía no hay nadie en tu equipo").waitFor();
  await d.getByRole("button", { name: "Agregar persona" }).first().click();
  await d.fill("#estilista-nombre", "Laura Marín");
  await d.fill("#estilista-email", CORREO_LAURA);
  await hoja(d).getByText("Corte clásico").click();
  await hoja(d).getByRole("button", { name: "Agregar al equipo" }).click();
  await hoja(d).getByText("Acceso listo").waitFor();
  const acceso = await hoja(d).locator("pre").innerText();
  const claveLaura = /Contraseña: (\S+)/.exec(acceso)?.[1] ?? "";
  revisar(
    acceso.includes(`Correo: ${CORREO_LAURA}`) && claveLaura.length === 12,
    "agrega a Laura y muestra su acceso",
  );
  await hoja(d).getByRole("button", { name: "Copiar acceso" }).click();
  revisar(
    (await d.evaluate(() => navigator.clipboard.readText())) === acceso,
    "copia el acceso al portapapeles",
  );
  await hoja(d).getByRole("button", { name: "Listo" }).click();

  await d.getByRole("button", { name: "Agregar persona" }).click();
  await d.fill("#estilista-nombre", "Pedro Ríos");
  await d.fill("#estilista-email", `pedro-f4-${S}@prueba.co`);
  await hoja(d).getByText("Corte clásico").click();
  await hoja(d).getByRole("button", { name: "Agregar al equipo" }).click();
  await hoja(d).getByRole("button", { name: "Listo" }).click();
  await d.getByText("Activos · 2").waitFor();

  await d.getByRole("button", { name: "Agregar persona" }).click();
  await d.fill("#estilista-nombre", "Tercera Persona");
  await d.fill("#estilista-email", `tercera-f4-${S}@prueba.co`);
  await hoja(d).getByText("Corte clásico").click();
  await hoja(d).getByRole("button", { name: "Agregar al equipo" }).click();
  await hoja(d).getByRole("link", { name: "Ver planes" }).waitFor();
  revisar(true, "la tercera persona en plan gratis muestra el 402 con 'Ver planes'");
  await cerrarHoja(d);

  const laura = (await api("/api/estilistas", { token })).find((e) => e.email === CORREO_LAURA);
  const inicio = await primerHueco(slug, corte.id, laura.id);
  await api(`/api/publico/salones/${slug}/reservas`, {
    metodo: "POST",
    cuerpo: {
      clienteNombre: "Cliente F4",
      clienteTelefono: "+573104445566",
      servicioId: corte.id,
      estilistaId: laura.id,
      inicio,
    },
  });
  await d.getByRole("button", { name: new RegExp(CORREO_LAURA) }).click();
  await d.click("#estilista-activo");
  await hoja(d).getByRole("button", { name: "Guardar cambios" }).click();
  await hoja(d)
    .getByText(/Cancélalas antes de desactivarlo/)
    .waitFor();
  revisar(true, "desactivar a Laura con una reserva pendiente muestra el 409 del backend");
  await cerrarHoja(d);

  const est = await (await navegador.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await entrar(est, CORREO_LAURA, claveLaura);
  revisar(true, "Laura entra con la contraseña del acceso copiado");

  await d.getByRole("button", { name: new RegExp(CORREO_LAURA) }).click();
  await hoja(d).getByRole("button", { name: "Asignar contraseña nueva" }).click();
  const claveNueva = await d.inputValue("#estilista-password");
  await hoja(d).getByRole("button", { name: "Guardar cambios" }).click();
  await hoja(d).getByText("Acceso listo").waitFor();
  await hoja(d).getByRole("button", { name: "Listo" }).click();
  const est2 = await (await navegador.newContext()).newPage();
  await entrar(est2, CORREO_LAURA, claveNueva);
  revisar(true, "asignar contraseña nueva: Laura entra con la nueva");

  console.log("\n— Configuración");
  await d.goto(`${FRONT}/panel/configuracion`);
  await d.locator("#salon-nombre").waitFor();
  revisar(await d.getByText(`/s/${slug}`).first().isVisible(), "muestra el enlace público");
  await d.fill("#salon-nombre", "  La Navaja F4 ");
  await d.locator("form[aria-label='Datos del salón'] button[type=submit]").click();
  await d.getByText("Datos guardados").waitFor();
  const publico = await api(`/api/publico/salones/${slug}`);
  revisar(
    publico.nombre === "La Navaja F4" && publico.slug === slug,
    "renombra el salón sin cambiar el slug",
  );
  await d.fill("#horario-apertura", "20:00");
  await d.locator("form[aria-label='Horario'] button[type=submit]").click();
  await d.getByText("El cierre tiene que ser después de la apertura").waitFor();
  await d.fill("#horario-apertura", "09:00");
  await d.fill("#horario-cierre", "18:00");
  await d.selectOption("#horario-intervalo", "45");
  await d.click("#horario-domingos");
  await d.locator("form[aria-label='Horario'] button[type=submit]").click();
  await d.getByText("Horario guardado").waitFor();
  const { configuracion } = await api("/api/salon", { token });
  revisar(
    configuracion.horaApertura === "09:00:00" &&
      configuracion.horaCierre === "18:00:00" &&
      configuracion.intervaloMinutos === 45 &&
      configuracion.abreDomingos,
    `guarda el horario: ${JSON.stringify(configuracion)}`,
  );

  console.log("\n— Clientes");
  await d.goto(`${FRONT}/panel/clientes`);
  await d.getByText("1 cliente").waitFor();
  await d.fill("#buscar-cliente", "310 444");
  await d.getByText("1 de 1").waitFor();
  const whatsapp = await d.getByRole("link", { name: /WhatsApp a Cliente F4/ }).getAttribute("href");
  revisar(
    whatsapp?.startsWith("https://wa.me/573104445566") ?? false,
    "busca por celular y enlaza a WhatsApp",
  );
  await d.fill("#buscar-cliente", "nadie");
  await d.getByText(/Nadie coincide/).waitFor();
  revisar(true, "búsqueda sin resultados");

  console.log("\n— Permisos");
  // est2: la sesión de `est` se cerró al asignarle contraseña nueva (R43)
  await est2.goto(`${FRONT}/panel/equipo`);
  await est2.getByText("No tienes acceso a esta sección").waitFor();
  revisar(true, "una estilista no entra a Equipo");
} catch (error) {
  fallas++;
  console.error(`\nFALLA inesperada: ${error.message}`);
} finally {
  await navegador.close();
}

console.log(fallas === 0 ? "\nTodo en verde." : `\n${fallas} prueba(s) fallaron.`);
process.exit(fallas === 0 ? 0 : 1);
