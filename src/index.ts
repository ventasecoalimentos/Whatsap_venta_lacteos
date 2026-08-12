import { cargarEnv } from './config/env';
import { construirContenedor } from './config/contenedor';
import { crearApp } from './http/app';

const env = cargarEnv();
const contenedor = construirContenedor(env);
const app = crearApp(
  contenedor.procesarMensajeEntrante,
  {
    clienteRepositorio: contenedor.clienteRepositorio,
    pedidoRepositorio: contenedor.pedidoRepositorio,
    servicioClienteRepositorio: contenedor.servicioClienteRepositorio,
  },
  { usuario: env.DASHBOARD_USUARIO, contrasena: env.DASHBOARD_CONTRASENA },
);

app.listen(env.PORT, () => {
  console.log(`[index] servidor escuchando en el puerto ${env.PORT}`);
});

// Única tarea de fondo del proyecto — revisa cada 30s las conversaciones en HANDOFF_HUMANO para
// mandar el aviso previo y el cierre automático (ver tareaCierreHandoff.ts). El resto del bot es
// 100% reactivo a mensajes entrantes.
const INTERVALO_TAREA_CIERRE_HANDOFF_MS = 30_000;
contenedor.tareaCierreHandoff.iniciar(INTERVALO_TAREA_CIERRE_HANDOFF_MS);
