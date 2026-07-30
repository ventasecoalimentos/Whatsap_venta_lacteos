import { cargarEnv } from './config/env';
import { construirContenedor } from './config/contenedor';
import { crearApp } from './http/app';
import { ejecutarAvisoDemanda } from './application/avisoDemanda';

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

// Tarea programada del aviso de "mucha demanda" (ver src/application/avisoDemanda.ts) — se repite
// cada INTERVALO_AVISO_DEMANDA_MIN mientras el cliente siga callado, hasta VENTANA_INACTIVIDAD_HORAS
// de silencio total (a partir de ahí el próximo mensaje del cliente ya reinicia el flujo).
const intervaloAvisoDemandaMs = env.INTERVALO_AVISO_DEMANDA_MIN * 60 * 1000;
const ventanaMaximaAvisoDemandaMs = env.VENTANA_INACTIVIDAD_HORAS * 60 * 60 * 1000;

function correrAvisoDemanda(): void {
  ejecutarAvisoDemanda(
    contenedor.conversacionRepositorio,
    contenedor.proveedorMensajeria,
    intervaloAvisoDemandaMs,
    ventanaMaximaAvisoDemandaMs,
  ).catch((error: unknown) => {
    console.error('[index] error ejecutando aviso de demanda:', error);
  });
}

// `setInterval` no dispara su primer tick hasta que pasa el intervalo completo — sin esto, cada
// reinicio del proceso (deploys, reinicios de Railway) deja hasta `INTERVALO_AVISO_DEMANDA_MIN`
// minutos sin ningún chequeo, aunque ya hubiera conversaciones esperando desde antes del reinicio.
correrAvisoDemanda();
setInterval(correrAvisoDemanda, intervaloAvisoDemandaMs);
