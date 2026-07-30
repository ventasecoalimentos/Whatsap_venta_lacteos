# Partes delegadas (histórico)

> **Estado: histórico.** Este documento guio la construcción inicial del proyecto en 3 partes
> paralelas (Datos, Motor de estados, Integración/wiring), cada una autocontenida gracias al
> contrato compartido en `docs/CONTRATOS.md`. El proyecto ya está construido y ha evolucionado
> bastante desde esa primera versión (nuevos estados, dashboard, tarea de aviso de demanda, etc.)
> — los brefes de tareas de abajo ya no reflejan el alcance actual y no deben usarse como guía de
> trabajo. Se conserva solo como referencia de cómo se planteó originalmente la división del
> trabajo.
>
> **Para el mapa de propiedad de archivos vigente, ver `docs/ARQUITECTURA.md` → "Propiedad de
> archivos por área".**

## Idea original

Construcción dividida en 3 partes, pensadas para construirse **en paralelo** sin bloquearse entre
sí: **Parte 1** (base del proyecto + datos/Supabase), **Parte 2** (motor de estados puro),
**Parte 3** (integración YCloud + webhook + wiring). Cada parte tenía un brief autocontenido que
podía delegarse a un agente distinto, respetando únicamente las firmas de `docs/CONTRATOS.md`
(vigente) sin necesitar el código real de las otras partes.

Esa regla de trabajo — no ejecutar `npm install`, build ni tests hasta la integración final, y no
tocar archivos fuera de la lista de cada parte — ya no aplica: el proyecto está integrado y se
mantiene como un solo repositorio activo.
