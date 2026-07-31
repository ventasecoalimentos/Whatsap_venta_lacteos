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
