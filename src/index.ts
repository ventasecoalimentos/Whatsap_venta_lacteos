import { cargarEnv } from './config/env';
import { construirContenedor } from './config/contenedor';
import { crearApp } from './http/app';

const env = cargarEnv();
const contenedor = construirContenedor(env);
const app = crearApp(contenedor.procesarMensajeEntrante);

app.listen(env.PORT, () => {
  console.log(`[index] servidor escuchando en el puerto ${env.PORT}`);
});
