# P79–P82 · Actividades educativas, equipo y festividades

## Software implementado
**79. Minijuegos educativos a partir de apuntes.** El usuario introduce pares «Concepto: explicación». Se preservan y utilizan esos pares como única fuente; se ofrecen opciones aleatorias por rotación de posición y se repiten elementos con fallos. No se inventan preguntas fuera del material.

**80. Progreso de equipos.** Resumen local y visual de hasta 30 integrantes: minutos de estudio y tareas completadas ingresados manualmente. No se presentan como datos certificados, videollamadas ni sincronización multiusuario. La colaboración real, autorización para compartir datos y conexión simultánea **no están implementadas**.

**81. Evaluación adaptativa.** Preguntas abiertas con corrección literal normalizada y registro de aciertos/errores por tema, prioridad de repaso de fallos y nivel indicativo (introducción/práctica/desafío) según los cinco resultados más recientes. Esto no es evaluación semántica de respuestas equivalentes, ni examen psicométrico; marcar una equivalencia correcta requiere revisión humana.

**82. Ambientaciones festivas.** Original, invierno, primavera, cumpleaños y fiesta, de activación manual y reversibles, usando decoraciones de fondo sin interceptar gestos del avatar, y respetando preferencias de movimiento reducido. Esto **no equivale** todavía a un catálogo completo de trajes aplicados a las 50 especies.

Los datos de actividad se almacenan por propietario en IndexedDB siguiendo el sistema de memoria existente; no se comparten automáticamente con otras personas.

## Pruebas incluidas
- `npm run test:p79-p82`: 29 aserciones de fuentes, duplicados, alternativas, repeticiones, calificación, límites y temas.
- `npm run test:p79-p82:browser`: guarda apuntes, responde, cambia a examen escrito, registra progreso de grupo y comprueba que las fiestas se puedan desactivar sin tapar el avatar.
- Ambas añadidas a la cadena CI existente.

## Puertas pendientes para aceptación
- Pruebas de interfaz con estudiantes reales, no solo datos de ejemplo.
- Integración y permisos compartidos para equipos multiusuario.
- Corrección semántica verificable y análisis de dificultad por tema y carpeta.
- Trajes originales de festividad por avatar, con contraste, animaciones y visuales aprobados.
- Revisión de accesibilidad en lector de pantalla y hardware iOS/Android.
- Todas las suites de GitHub Actions en verde y aceptación de regresiones precedentes.
