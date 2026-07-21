import type { Request, Response, NextFunction } from 'express';

// HTTP Basic Auth para /dashboard — el navegador pide usuario/contraseña de forma nativa, sin
// necesidad de programar una pantalla de login aparte. Pensado para uso interno del equipo, no
// para clientes finales (ver docs/ARQUITECTURA.md).
export function crearAutenticacionDashboard(usuario: string, contrasena: string) {
  return function autenticarDashboard(req: Request, res: Response, next: NextFunction): void {
    const encabezado = req.headers.authorization;

    if (encabezado?.startsWith('Basic ')) {
      const credenciales = Buffer.from(encabezado.slice('Basic '.length), 'base64').toString('utf-8');
      const separador = credenciales.indexOf(':');
      const usuarioRecibido = credenciales.slice(0, separador);
      const contrasenaRecibida = credenciales.slice(separador + 1);

      if (usuarioRecibido === usuario && contrasenaRecibida === contrasena) {
        next();
        return;
      }
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Panel Llano Lacteos"');
    res.sendStatus(401);
  };
}
