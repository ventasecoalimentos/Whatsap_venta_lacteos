import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base: '/dashboard/' porque Express sirve este build bajo esa subruta (ver
// src/http/routes.ts) — sin esto, los assets generados apuntarían a la raíz del dominio.
export default defineConfig({
    plugins: [react()],
    base: '/dashboard/',
    server: {
        proxy: {
            '/dashboard/api': 'http://localhost:3000',
        },
    },
});
