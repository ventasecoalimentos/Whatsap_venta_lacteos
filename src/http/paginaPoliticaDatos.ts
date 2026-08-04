// Página pública de la política de tratamiento de datos (Ley 1581 de 2012), servida directamente
// desde Express (sin build aparte, a diferencia de dashboard-frontend/) — ver routes.ts.
// Mismo lenguaje visual que el dashboard (colores/tipografía de dashboard-frontend/tailwind.config.js)
// para que se sienta parte del mismo producto. Enlazada desde el mensaje de consentimiento del bot
// (desdeInicio.ts).
export const PAGINA_POLITICA_DATOS_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Política de Tratamiento de Datos Personales — Llano Lácteos</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Política de tratamiento de datos personales de Ecoalimentos del Llano S.A.S. (Llano Lácteos), conforme a la Ley 1581 de 2012.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --fondo: #edeae3;
    --tarjeta: #ffffff;
    --texto: #3d3a34;
    --texto-suave: #8c8678;
    --verde: #748f6a;
    --rojo: #b56b5d;
    --dorado: #c9a25c;
    --dorado-texto: #8a6a2a;
    --cafe: #8a715a;
    --linea: #e4e0d6;
    --shadow-card: 0 1px 2px rgba(61, 58, 52, 0.05), 0 6px 16px rgba(61, 58, 52, 0.07);
    --shadow-card-sm: 0 1px 3px rgba(61, 58, 52, 0.1);
  }

  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }

  body {
    margin: 0;
    background: var(--fondo);
    color: var(--texto);
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    font-size: 15.5px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3 {
    font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif;
    color: var(--texto);
    text-wrap: balance;
    line-height: 1.3;
    margin: 0;
  }

  a { color: var(--verde); text-underline-offset: 3px; }
  a:hover { color: var(--dorado-texto); }
  a:focus-visible, button:focus-visible { outline: 2px solid var(--verde); outline-offset: 2px; border-radius: 4px; }

  .page { max-width: 760px; margin: 0 auto; padding: 24px 20px 72px; }

  /* ---------- Header (mismo patrón que el header del dashboard) ---------- */

  .encabezado {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    background: var(--tarjeta);
    border-radius: 24px;
    box-shadow: var(--shadow-card);
    padding: 22px 26px;
    margin-bottom: 18px;
  }
  .encabezado img {
    height: 96px;
    width: 96px;
    object-fit: contain;
    flex: none;
  }
  .encabezado .titulos { min-width: 0; }
  .encabezado h1 { font-size: 25px; font-weight: 700; }
  .encabezado p { margin: 5px 0 0; font-size: 14px; color: var(--texto-suave); }

  .meta-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 22px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 999px;
    padding: 6px 13px;
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
  }
  .pill b { font-weight: 600; }
  .pill.verde { background: rgba(116, 143, 106, 0.15); color: var(--verde); }
  .pill.cafe { background: rgba(138, 113, 90, 0.15); color: var(--cafe); }
  .pill.dorado { background: rgba(201, 162, 92, 0.2); color: var(--dorado-texto); }

  /* ---------- Índice ---------- */

  .indice-card {
    background: var(--tarjeta);
    border-radius: 20px;
    box-shadow: var(--shadow-card);
    padding: 22px 26px 8px;
    margin-bottom: 14px;
  }
  .indice-card .eyebrow {
    font-size: 11.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--texto-suave);
    font-weight: 600;
    margin: 0 0 4px;
  }
  ol.indice-lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 32px;
  }
  ol.indice-lista li { border-bottom: 1px solid var(--linea); }
  ol.indice-lista li:nth-last-child(-n+2) { border-bottom: none; }
  ol.indice-lista a {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 11px 0;
    text-decoration: none;
    color: var(--texto);
    font-size: 14px;
  }
  ol.indice-lista a:hover { color: var(--verde); }
  ol.indice-lista a:hover .num { color: var(--verde); }
  ol.indice-lista .num {
    color: var(--texto-suave);
    font-variant-numeric: tabular-nums;
    font-size: 12.5px;
    min-width: 18px;
  }
  @media (max-width: 480px) {
    ol.indice-lista { grid-template-columns: 1fr; }
    ol.indice-lista li:nth-last-child(-n+2) { border-bottom: 1px solid var(--linea); }
    ol.indice-lista li:last-child { border-bottom: none; }
  }

  /* ---------- Secciones ---------- */

  section.clausula {
    background: var(--tarjeta);
    border-radius: 20px;
    box-shadow: var(--shadow-card);
    padding: 26px 28px;
    margin-bottom: 14px;
    scroll-margin-top: 16px;
  }

  section.clausula h2 {
    font-size: 17px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  section.clausula h2 .badge-num {
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 10px;
    background: rgba(116, 143, 106, 0.15);
    color: var(--verde);
    display: grid;
    place-items: center;
    font-size: 14px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  section.clausula p { margin: 0 0 13px; max-width: 62ch; }
  section.clausula p:last-child { margin-bottom: 0; }
  section.clausula ul, section.clausula ol.derechos { margin: 0 0 13px; padding-left: 21px; max-width: 62ch; }
  section.clausula li { margin-bottom: 7px; }
  section.clausula li:last-child { margin-bottom: 0; }

  h3.sub { font-size: 13.5px; font-weight: 600; margin: 18px 0 8px; color: var(--cafe); }

  .tabla-scroll { overflow-x: auto; margin: 4px 0 14px; }
  table.datos {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  table.datos th, table.datos td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--linea);
    vertical-align: top;
  }
  table.datos th {
    color: var(--texto-suave);
    font-weight: 600;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  table.datos tr:last-child td { border-bottom: none; }

  .nota {
    background: rgba(201, 162, 92, 0.12);
    border-left: 3px solid var(--dorado);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 13.5px;
    color: var(--texto);
  }
  .nota b { color: var(--dorado-texto); }

  /* ---------- Contacto ---------- */

  .contacto h2 { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
  .contacto > p { color: var(--texto-suave); font-size: 13.5px; margin: 0 0 18px; max-width: 52ch; }

  .contacto-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  @media (max-width: 480px) { .contacto-grid { grid-template-columns: 1fr; } }

  .contacto-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--fondo);
    border-radius: 16px;
    padding: 14px 16px;
  }
  .contacto-item .icono {
    flex: none;
    width: 38px;
    height: 38px;
    border-radius: 11px;
    display: grid;
    place-items: center;
  }
  .contacto-item .icono.verde { background: rgba(116, 143, 106, 0.15); color: var(--verde); }
  .contacto-item .icono.cafe { background: rgba(138, 113, 90, 0.15); color: var(--cafe); }
  .contacto-item .icono svg { width: 18px; height: 18px; }
  .contacto-item .texto-item { min-width: 0; }
  .contacto-item .label {
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--texto-suave);
    font-weight: 600;
    margin-bottom: 2px;
  }
  .contacto-item .valor { font-size: 14px; font-weight: 600; }
  .contacto-item .valor a { color: var(--texto); text-decoration: none; }
  .contacto-item .valor a:hover { color: var(--verde); }

  footer.pie {
    margin-top: 26px;
    padding: 0 6px;
    font-size: 12.5px;
    color: var(--texto-suave);
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
  }

  @media print {
    body { background: #fff; }
    .indice-card { display: none; }
    section.clausula, .encabezado, .contacto { box-shadow: none; border: 1px solid var(--linea); }
  }
</style>
</head>
<body>
<div class="page">

  <header class="encabezado">
    <img src="/logo.png" alt="Llano Lácteos" onerror="this.style.display='none'">
    <div class="titulos">
      <h1>Llano Lácteos</h1>
      <p>Política de Tratamiento de Datos Personales · Ley 1581 de 2012</p>
    </div>
  </header>

  <div class="meta-pills">
    <span class="pill verde"><b>Responsable</b>&nbsp;Ecoalimentos del Llano S.A.S.</span>
    <span class="pill cafe"><b>NIT</b>&nbsp;901.222.679-1</span>
    <span class="pill dorado"><b>Vigente desde</b>&nbsp;4 de agosto de 2026</span>
  </div>

  <section class="indice-card" aria-labelledby="indice-titulo">
    <p class="eyebrow" id="indice-titulo">Índice</p>
    <ol class="indice-lista">
      <li><a href="#responsable"><span class="num">01</span>Quién es el responsable</a></li>
      <li><a href="#datos"><span class="num">02</span>Qué datos recolectamos</a></li>
      <li><a href="#finalidad"><span class="num">03</span>Para qué los usamos</a></li>
      <li><a href="#recoleccion"><span class="num">04</span>Cómo los recolectamos</a></li>
      <li><a href="#derechos"><span class="num">05</span>Tus derechos como titular</a></li>
      <li><a href="#procedimiento"><span class="num">06</span>Cómo ejercerlos</a></li>
      <li><a href="#seguridad"><span class="num">07</span>Seguridad de la información</a></li>
      <li><a href="#vigencia"><span class="num">08</span>Vigencia y cambios</a></li>
    </ol>
  </section>

  <main>

    <section class="clausula" id="responsable">
      <h2><span class="badge-num">1</span>Quién es el responsable del tratamiento</h2>
      <p>
        <strong>Ecoalimentos del Llano S.A.S.</strong> (NIT 901.222.679-1), que opera comercialmente
        bajo la marca <strong>Llano Lácteos</strong>, es responsable del tratamiento de los datos
        personales que recolecta a través de su canal de atención y ventas por WhatsApp.
      </p>
      <p>
        Sitio web: <a href="https://www.llanolacteos.com">www.llanolacteos.com</a> — Correo de
        contacto: <a href="mailto:alimentossantapaulaltda@hotmail.com">alimentossantapaulaltda@hotmail.com</a>.
      </p>
    </section>

    <section class="clausula" id="datos">
      <h2><span class="badge-num">2</span>Qué datos recolectamos</h2>
      <p>
        A través de la conversación de WhatsApp recolectamos únicamente los datos necesarios para
        atenderte:
      </p>
      <div class="tabla-scroll">
        <table class="datos">
          <thead>
            <tr><th>Dato</th><th>Cuándo lo pedimos</th></tr>
          </thead>
          <tbody>
            <tr><td>Nombre</td><td>Al inicio de la conversación</td></tr>
            <tr><td>Número de teléfono</td><td>Automático — es el número desde el que nos escribes</td></tr>
            <tr><td>Número de identificación (cédula o NIT)</td><td>Solo si nos escribes por Facturación o PQRSF</td></tr>
            <tr><td>Correo electrónico</td><td>Solo si nos escribes por Facturación o PQRSF</td></tr>
          </tbody>
        </table>
      </div>
      <p>No solicitamos datos financieros, de salud ni ningún otro dato sensible por este canal.</p>
    </section>

    <section class="clausula" id="finalidad">
      <h2><span class="badge-num">3</span>Para qué los usamos</h2>
      <ul>
        <li>Gestionar tu pedido y ponerte en contacto con nuestro equipo de ventas.</li>
        <li>Dar respuesta a peticiones, quejas, reclamos, sugerencias y felicitaciones (PQRSF).</li>
        <li>Tramitar tu factura electrónica y enviarla al correo que nos compartas.</li>
        <li>Dar continuidad a la conversación si nos vuelves a escribir más adelante.</li>
      </ul>
      <p>No usamos tus datos para enviarte publicidad de terceros ni los vendemos ni los compartimos con nadie fuera de nuestro equipo.</p>
    </section>

    <section class="clausula" id="recoleccion">
      <h2><span class="badge-num">4</span>Cómo los recolectamos</h2>
      <p>
        Todos los datos se recolectan directamente de ti, cuando nos escribes por WhatsApp y
        respondes a las preguntas de nuestro asistente de atención. No obtenemos tus datos de
        ninguna otra fuente.
      </p>
    </section>

    <section class="clausula" id="derechos">
      <h2><span class="badge-num">5</span>Tus derechos como titular de los datos</h2>
      <p>De acuerdo con la Ley 1581 de 2012, tienes derecho a:</p>
      <ol class="derechos">
        <li>Conocer, actualizar y rectificar tus datos personales.</li>
        <li>Solicitar prueba de la autorización que nos diste, salvo que la ley no la exija.</li>
        <li>Ser informado sobre el uso que le hemos dado a tus datos, previa solicitud.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</li>
        <li>Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual que nos obligue a conservarlos.</li>
        <li>Acceder de forma gratuita a tus datos personales que hayamos tratado.</li>
      </ol>
    </section>

    <section class="clausula" id="procedimiento">
      <h2><span class="badge-num">6</span>Cómo ejercer tus derechos</h2>
      <p>
        Puedes escribirnos por el mismo WhatsApp del negocio o al correo de contacto (ver más abajo)
        indicando qué derecho quieres ejercer y tu número de identificación, para verificar que
        eres el titular de los datos.
      </p>
      <h3 class="sub">Tiempos de respuesta</h3>
      <div class="tabla-scroll">
        <table class="datos">
          <thead>
            <tr><th>Tipo de solicitud</th><th>Plazo de respuesta</th></tr>
          </thead>
          <tbody>
            <tr><td>Consultas</td><td>10 días hábiles, prorrogables 5 días hábiles más</td></tr>
            <tr><td>Reclamos</td><td>15 días hábiles, prorrogables 8 días hábiles más</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="clausula" id="seguridad">
      <h2><span class="badge-num">7</span>Seguridad de la información</h2>
      <p>
        Tomamos medidas técnicas y administrativas razonables para proteger tus datos frente a
        acceso no autorizado, pérdida o uso indebido, acordes al tamaño y naturaleza de nuestra
        operación.
      </p>
    </section>

    <section class="clausula" id="vigencia">
      <h2><span class="badge-num">8</span>Vigencia y cambios a esta política</h2>
      <p>
        Esta política rige desde el 4 de agosto de 2026. Si la actualizamos, publicaremos la nueva
        versión en este mismo enlace, indicando la fecha del cambio.
      </p>
      <div class="nota">
        <b>Nota:</b> este documento fue redactado a partir de los requisitos generales de la Ley
        1581 de 2012 y su decreto reglamentario. Se recomienda una revisión por parte de un asesor
        legal antes de considerarlo definitivo.
      </div>
    </section>

  </main>

  <section class="clausula contacto" id="contacto" aria-labelledby="contacto-titulo">
    <h2 id="contacto-titulo">Contacto</h2>
    <p>Para consultas, reclamos o para ejercer cualquiera de tus derechos sobre tus datos personales, escríbenos por cualquiera de estos canales.</p>
    <div class="contacto-grid">
      <div class="contacto-item">
        <span class="icono verde" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h16v12H4V6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="m4.5 6.5 7.5 6 7.5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <div class="texto-item">
          <div class="label">Correo</div>
          <div class="valor"><a href="mailto:alimentossantapaulaltda@hotmail.com">alimentossantapaulaltda@hotmail.com</a></div>
        </div>
      </div>
      <div class="contacto-item">
        <span class="icono cafe" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/>
            <path d="M3.5 12h17M12 3.5c2.4 2.4 3.7 5.3 3.7 8.5S14.4 18.1 12 20.5C9.6 18.1 8.3 15.2 8.3 12S9.6 5.9 12 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
        </span>
        <div class="texto-item">
          <div class="label">Sitio web</div>
          <div class="valor"><a href="https://www.llanolacteos.com">www.llanolacteos.com</a></div>
        </div>
      </div>
    </div>
  </section>

  <footer class="pie">
    <span>Ecoalimentos del Llano S.A.S. — NIT 901.222.679-1</span>
    <span>Última actualización: 4 de agosto de 2026</span>
  </footer>

</div>
</body>
</html>
`;
