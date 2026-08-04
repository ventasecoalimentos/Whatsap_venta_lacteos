// Página pública de la política de tratamiento de datos (Ley 1581 de 2012), servida directamente
// desde Express (sin build aparte, a diferencia de dashboard-frontend/) — ver routes.ts.
// Enlazada desde el mensaje de consentimiento del bot (desdeInicio.ts).
export const PAGINA_POLITICA_DATOS_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Política de Tratamiento de Datos Personales — Llano Lácteos</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Política de tratamiento de datos personales de Ecoalimentos del Llano S.A.S. (Llano Lácteos), conforme a la Ley 1581 de 2012.">
<style>
  :root {
    --verde: #5f7a56;
    --verde-soft: #748f6a;
    --cafe: #8a715a;
    --dorado: #a97a37;
    --bg: #f7f6f2;
    --bg-raised: #ffffff;
    --ink: #2a2b24;
    --ink-soft: #5c5c50;
    --line: #e2ddd0;
    --focus: #2f6f4f;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --verde: #9ab98e;
      --verde-soft: #86a37a;
      --cafe: #c9ad8d;
      --dorado: #d9ab5e;
      --bg: #1c1d18;
      --bg-raised: #24261f;
      --ink: #ece9df;
      --ink-soft: #b6b3a4;
      --line: #3a3b32;
      --focus: #b7d9a8;
    }
  }

  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }

  a { color: var(--focus); text-underline-offset: 3px; }
  a:focus-visible, button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 2px; }

  h1, h2, h3 {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 600;
    color: var(--ink);
    text-wrap: balance;
    line-height: 1.25;
  }

  .wrap { max-width: 700px; margin: 0 auto; padding: 0 24px 96px; }

  .masthead { padding: 56px 0 36px; border-bottom: 1px solid var(--line); margin-bottom: 40px; }

  .brand {
    display: flex; align-items: center; gap: 10px;
    font-family: Georgia, serif; font-weight: 600; font-size: 15px;
    letter-spacing: 0.02em; color: var(--verde); margin-bottom: 28px;
  }
  .brand .mark {
    width: 28px; height: 28px; border-radius: 50%; background: var(--verde-soft);
    flex: none; display: grid; place-items: center;
  }
  .brand .mark svg { width: 16px; height: 16px; display: block; }

  .eyebrow {
    font-size: 12.5px; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--cafe); font-weight: 600; margin: 0 0 10px;
  }

  h1.title { font-size: clamp(28px, 5vw, 38px); margin: 0 0 16px; max-width: 18ch; }

  .meta-row {
    display: flex; flex-wrap: wrap; gap: 6px 22px;
    font-size: 13.5px; color: var(--ink-soft); font-variant-numeric: tabular-nums;
  }
  .meta-row dt { font-weight: 600; color: var(--cafe); display: inline; }
  .meta-row dd { display: inline; margin: 0; }
  .meta-item { display: flex; gap: 6px; }

  nav.toc { margin: 0 0 48px; }
  nav.toc .toc-label {
    font-size: 12.5px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--cafe); font-weight: 600; margin-bottom: 12px;
  }
  nav.toc ol {
    list-style: none; margin: 0; padding: 0;
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 20px;
  }
  nav.toc li a {
    display: block; padding: 6px 0; color: var(--ink); text-decoration: none;
    font-size: 14.5px; border-bottom: 1px solid transparent;
  }
  nav.toc li a:hover { color: var(--verde); border-bottom-color: var(--line); }
  nav.toc li a .num {
    color: var(--verde-soft); font-variant-numeric: tabular-nums; font-weight: 600; margin-right: 8px;
  }
  @media (max-width: 520px) { nav.toc ol { grid-template-columns: 1fr; } }

  section.clause {
    padding: 30px 0 30px 20px; border-left: 2px solid var(--line);
    margin-bottom: 4px; scroll-margin-top: 20px;
  }
  section.clause + section.clause { border-top: 1px solid var(--line); }

  section.clause h2 { font-size: 20px; display: flex; align-items: baseline; gap: 12px; margin: 0 0 14px; }
  section.clause h2 .num {
    font-family: Georgia, serif; font-size: 15px; font-weight: 600;
    color: var(--bg-raised); background: var(--verde-soft); border-radius: 50%;
    width: 26px; height: 26px; display: inline-grid; place-items: center;
    flex: none; font-variant-numeric: tabular-nums;
  }

  section.clause p { margin: 0 0 14px; color: var(--ink); max-width: 62ch; }
  section.clause p:last-child { margin-bottom: 0; }
  section.clause ul, section.clause ol.rights { margin: 0 0 14px; padding-left: 22px; max-width: 62ch; }
  section.clause li { margin-bottom: 8px; }
  section.clause li:last-child { margin-bottom: 0; }

  h3.sub { font-size: 15px; margin: 20px 0 8px; color: var(--cafe); }

  table.data-table { width: 100%; border-collapse: collapse; font-size: 14.5px; margin: 8px 0 16px; }
  table.data-table th, table.data-table td {
    text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: top;
  }
  table.data-table th {
    color: var(--cafe); font-weight: 600; font-size: 12.5px;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .table-scroll { overflow-x: auto; }

  .callout {
    background: var(--bg-raised); border: 1px solid var(--line); border-left: 3px solid var(--dorado);
    border-radius: 6px; padding: 16px 18px; font-size: 14.5px; color: var(--ink-soft); margin: 8px 0 16px;
  }
  .callout strong { color: var(--ink); }

  .contact-card {
    margin-top: 8px; background: var(--bg-raised); border: 1px solid var(--line);
    border-radius: 10px; padding: 26px 26px 24px;
  }
  .contact-card h2 { font-size: 19px; margin: 0 0 6px; }
  .contact-card p.lead { color: var(--ink-soft); margin: 0 0 18px; font-size: 14.5px; max-width: 52ch; }

  .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 480px) { .contact-grid { grid-template-columns: 1fr; } }

  .contact-item .label {
    font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--cafe); font-weight: 600; margin-bottom: 4px;
  }
  .contact-item .value { font-size: 15px; }
  .contact-item .value a { text-decoration: none; font-weight: 600; }
  .contact-item .value a:hover { text-decoration: underline; }

  footer.doc-footer {
    margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--line);
    font-size: 13px; color: var(--ink-soft);
    display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  }

  .placeholder { color: var(--dorado); font-weight: 600; }

  @media print {
    body { background: #fff; }
    nav.toc { display: none; }
    section.clause { border-left-color: #ccc; }
    .contact-card { border-color: #ccc; }
  }
</style>
</head>
<body>
<div class="wrap">

  <header class="masthead">
    <div class="brand">
      <span class="mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 9.5V17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 9.5 8.2 5h7.6l1.2 4.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 13.2c0-1 .8-1.7 1.5-2.2.7-.5 1.5-1 1.5-1.9 0 .9.8 1.4 1.5 1.9.7.5 1.5 1.2 1.5 2.2 0 1.5-1.3 2.5-3 2.5s-3-1-3-2.5Z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
      </span>
      Llano Lácteos
    </div>

    <p class="eyebrow">Tratamiento de datos personales · Ley 1581 de 2012</p>
    <h1 class="title">Política de Tratamiento de Datos Personales</h1>

    <dl class="meta-row">
      <div class="meta-item"><dt>Responsable</dt><dd>Ecoalimentos del Llano S.A.S.</dd></div>
      <div class="meta-item"><dt>NIT</dt><dd>901.222.679-1</dd></div>
      <div class="meta-item"><dt>Vigente desde</dt><dd>4 de agosto de 2026</dd></div>
    </dl>
  </header>

  <nav class="toc" aria-label="Contenido">
    <p class="toc-label">Contenido</p>
    <ol>
      <li><a href="#responsable"><span class="num">1</span>Quién es el responsable</a></li>
      <li><a href="#datos"><span class="num">2</span>Qué datos recolectamos</a></li>
      <li><a href="#finalidad"><span class="num">3</span>Para qué los usamos</a></li>
      <li><a href="#recoleccion"><span class="num">4</span>Cómo los recolectamos</a></li>
      <li><a href="#derechos"><span class="num">5</span>Tus derechos como titular</a></li>
      <li><a href="#procedimiento"><span class="num">6</span>Cómo ejercerlos</a></li>
      <li><a href="#seguridad"><span class="num">7</span>Seguridad de la información</a></li>
      <li><a href="#vigencia"><span class="num">8</span>Vigencia y cambios</a></li>
    </ol>
  </nav>

  <main>

    <section class="clause" id="responsable">
      <h2><span class="num">1</span>Quién es el responsable del tratamiento</h2>
      <p>
        <strong>Ecoalimentos del Llano S.A.S.</strong> (NIT 901.222.679-1), que opera comercialmente
        bajo la marca <strong>Llano Lácteos</strong>, es responsable del tratamiento de los datos
        personales que recolecta a través de su canal de atención y ventas por WhatsApp.
      </p>
      <p>
        Domicilio y datos de contacto adicionales:
        <span class="placeholder">[completar dirección física de la empresa]</span>.
      </p>
    </section>

    <section class="clause" id="datos">
      <h2><span class="num">2</span>Qué datos recolectamos</h2>
      <p>
        A través de la conversación de WhatsApp recolectamos únicamente los datos necesarios para
        atenderte:
      </p>
      <div class="table-scroll">
        <table class="data-table">
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

    <section class="clause" id="finalidad">
      <h2><span class="num">3</span>Para qué los usamos</h2>
      <ul>
        <li>Gestionar tu pedido y ponerte en contacto con nuestro equipo de ventas.</li>
        <li>Dar respuesta a peticiones, quejas, reclamos, sugerencias y felicitaciones (PQRSF).</li>
        <li>Tramitar tu factura electrónica y enviarla al correo que nos compartas.</li>
        <li>Dar continuidad a la conversación si nos vuelves a escribir más adelante.</li>
      </ul>
      <p>No usamos tus datos para enviarte publicidad de terceros ni los vendemos ni los compartimos con nadie fuera de nuestro equipo.</p>
    </section>

    <section class="clause" id="recoleccion">
      <h2><span class="num">4</span>Cómo los recolectamos</h2>
      <p>
        Todos los datos se recolectan directamente de ti, cuando nos escribes por WhatsApp y
        respondes a las preguntas de nuestro asistente de atención. No obtenemos tus datos de
        ninguna otra fuente.
      </p>
    </section>

    <section class="clause" id="derechos">
      <h2><span class="num">5</span>Tus derechos como titular de los datos</h2>
      <p>De acuerdo con la Ley 1581 de 2012, tienes derecho a:</p>
      <ol class="rights">
        <li>Conocer, actualizar y rectificar tus datos personales.</li>
        <li>Solicitar prueba de la autorización que nos diste, salvo que la ley no la exija.</li>
        <li>Ser informado sobre el uso que le hemos dado a tus datos, previa solicitud.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</li>
        <li>Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual que nos obligue a conservarlos.</li>
        <li>Acceder de forma gratuita a tus datos personales que hayamos tratado.</li>
      </ol>
    </section>

    <section class="clause" id="procedimiento">
      <h2><span class="num">6</span>Cómo ejercer tus derechos</h2>
      <p>
        Puedes escribirnos por el mismo WhatsApp del negocio o al correo de contacto (ver sección 8)
        indicando qué derecho quieres ejercer y tu número de identificación, para verificar que
        eres el titular de los datos.
      </p>
      <h3 class="sub">Tiempos de respuesta</h3>
      <div class="table-scroll">
        <table class="data-table">
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

    <section class="clause" id="seguridad">
      <h2><span class="num">7</span>Seguridad de la información</h2>
      <p>
        Tomamos medidas técnicas y administrativas razonables para proteger tus datos frente a
        acceso no autorizado, pérdida o uso indebido, acordes al tamaño y naturaleza de nuestra
        operación.
      </p>
    </section>

    <section class="clause" id="vigencia">
      <h2><span class="num">8</span>Vigencia y cambios a esta política</h2>
      <p>
        Esta política rige desde el 4 de agosto de 2026. Si la actualizamos, publicaremos la nueva
        versión en este mismo enlace, indicando la fecha del cambio.
      </p>
      <div class="callout">
        <strong>Nota:</strong> este documento fue redactado a partir de los requisitos generales de
        la Ley 1581 de 2012 y su decreto reglamentario. Se recomienda una revisión por parte de un
        asesor legal antes de considerarlo definitivo.
      </div>
    </section>

  </main>

  <div class="contact-card" id="contacto" aria-labelledby="contacto-titulo">
    <h2 id="contacto-titulo">Contacto</h2>
    <p class="lead">Para consultas, reclamos o para ejercer cualquiera de tus derechos sobre tus datos personales, escríbenos por cualquiera de estos canales.</p>
    <div class="contact-grid">
      <div class="contact-item">
        <div class="label">Correo</div>
        <div class="value"><a href="mailto:ventas.ecoalimentos@gmail.com">ventas.ecoalimentos@gmail.com</a></div>
      </div>
      <div class="contact-item">
        <div class="label">WhatsApp</div>
        <div class="value">El mismo número del negocio</div>
      </div>
    </div>
  </div>

  <footer class="doc-footer">
    <span>Ecoalimentos del Llano S.A.S. — NIT 901.222.679-1</span>
    <span>Última actualización: 4 de agosto de 2026</span>
  </footer>

</div>
</body>
</html>
`;
