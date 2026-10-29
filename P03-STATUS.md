# Robotito — Punto 3: entrega de ingeniería y validación pendiente

Actualización: 29 de octubre de 2026.

## Alcance implementado

- Detector acústico de silencio, actividad vocal, música, impactos y candidatos prudentes de aplauso.
- Resultados tentativos de risa, llanto, tos y estornudos solo mediante clasificador acústico opcional. No se infieren de intensidad o ASR.
- Evidencia temporal, competencia entre etiquetas, umbrales por clase, rechazo de predicciones antiguas y repetidas, restablecimiento de la evidencia cuando el audio se interrumpe o hay silencio, y rechazo de puntuaciones de modelo que no sean números finitos.
- Política independiente de acciones y enfriamiento; supresión por voz propia, Modo Clase, sueño, pestaña oculta y micrófono no disponible.
- «¡Chocar los cinco!» y movimientos por aplausos conservados.
- Módulos de evaluación de confusión entre sonidos, latencia, privacidad, manifestaciones de consentimiento y preparación de corpus etiquetado.

## Qué se ha verificado

Verificación aislada de JavaScript de 29/10/2026 (NO una ejecución de `npm test` ni un GitHub Actions exitoso):
- Regresión de cadencia y observaciones: 31 comprobaciones.
- Regresión de eventos con semillas 17, 42, 99: 500 por semilla.
- Adaptador de modelo de sonido: 66 comprobaciones.
- Registros de reacciones de avatar y confusión temporal: 64 comprobaciones.
- Calibración, ciclo de vida del micrófono y PCM de respaldo: 118 comprobaciones.
- Total de estas ejecuciones aisladas: 1.779 comprobaciones exitosas.

Las verificaciones anteriores son de lógica con dobles de prueba, NO de precisión sobre sonidos reales ni de integración Chromium/CI.

## Bloqueo externo: NO aprobar todavía las reacciones humanas

No hay evidencia independiente suficiente en estas verificaciones para aprobar reacciones automáticas a risa, llanto, tos o estornudos. El permiso de despliegue `humanModelReactionsApproved` permanece desactivado; `evidenceStatus.p03VerifiedComplete` y `automaticHumanReactionsApproved` permanecen en `false`.

Antes de certificar el punto 3 empíricamente:
1. Obtener grabaciones reales autorizadas, con positivos y negativos de distintos orígenes, entornos, idiomas y dispositivos; auditar etiquetas de forma independiente.
2. Reservar fuentes de prueba separadas, validar hashes de audio y anotaciones y ejecutar `npm run validate:audio -- /ruta/manifest.json`, `npm run evaluate:audio -- /ruta/manifest.json` y `npm run audit:audio:p03 -- /ruta/manifest.json`.
3. Medir matrices de confusión, precisión/recuperación, falsos avisos por hora y latencia con datos reales de reserva.
4. Comprobar consentimiento, permiso/revocación, silencio, desconexión, captura y reacciones en micrófonos físicos representativos; usar `tools/audio-device-check.html` y el ensayo de avatar.
5. Revisar los resultados y riesgos antes de habilitar cualquier reacción humana nueva.

## Revalidación de integración requerida

Ejecutar en un entorno Node 22 con Playwright Chromium:
```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run test:audio
npm run test:audio:real
npm run test:audio:timeline:real
npm run test:audio:studio
npm run test:audio:device
npm run test:audio:reactions:browser
npm run test:ci
```
Consultar la ejecución de `.github/workflows/regression.yml`. Estas pruebas no pueden considerarse ejecutadas solo por haber subido cambios.

## Transición al punto 4

La implementación controlable del punto 3 puede mantenerse en modo prudente y continuar con el punto 4 (idiomas/voces), **sin afirmar que el punto 3 esté certificado con dispositivos o grabaciones reales**. Conservar las verificaciones externas anteriores como deuda explícita y no reactivar automáticamente reacciones humanas en el punto 4.
