# Validación física de cámara y micrófono — Robotito

**Estado inicial:** NO EJECUTADA. Este protocolo está preparado para realizarse en dispositivos **físicos**. Las simulaciones de Chromium/Playwright y la CI no sustituyen esta evidencia.

## Preparación y privacidad

- Abrí Robotito desde HTTPS en el navegador del dispositivo real; no uses una pestaña con datos personales de otra persona.
- Registrá el modelo del dispositivo, versión del sistema operativo, navegador y versión, fecha y commit GitHub.
- Si participarán dos personas, cada una debe dar permiso antes de registrar rostro o voz. No subas fotos de caras, audios, descriptores faciales ni huellas de voz al repositorio.
- Preferí un perfil del navegador nuevo para comenzar; guardá los resultados **solo como texto** (aprobado/fallido, error, versión y pasos). Borrá datos de prueba al final.
- Registrá cada caso como PASS / FAIL / BLOCKED / NOT RUN. No marques PASS sin ejecutarlo realmente.

## Matriz de aceptación con hardware real

| ID | Acción física a ejecutar | Resultado esperado |
| --- | --- | --- |
| H01 | Inicio y permitir cámara/micrófono | Se muestra imagen en vivo y comienza escucha sin excepciones; los indicadores de permiso coinciden con el navegador |
| H02 | Rechazar cámara y micrófono desde el navegador | Mensaje de permiso; no se crea identidad ni grabación fantasma |
| H03 | Desconectar/tapar cámara durante uso y reconectar | Detiene inferencia, no conserva una identidad ajena y permite recuperar sesión |
| H04 | Retirar micrófono o permiso de audio durante escucha | Deja de escuchar; no almacena voz después de la retirada del permiso |
| H05 | Registrar persona A con una sola cara y buena iluminación | A se reconoce después del consenso temporal, no con un único fotograma |
| H06 | Mostrar cara de persona B todavía no registrada | Se retira la identidad A; no se revelan recuerdos o preferencias de A |
| H07 | Registrar B con permiso y alternar A/B | No reutiliza identidad anterior; B requiere evidencia temporal propia |
| H08 | Mostrar A y B simultáneamente frente a la cámara | Indica varias personas, no atribuye automáticamente la primera cara ni usa su memoria |
| H09 | Cubrir el rostro, salir de cuadro y volver | No inventa identidad cuando no ve ninguna cara; la identidad caduca ante ausencia prolongada |
| H10 | Hablar en cada uno de los seis idiomas habilitados | El reconocimiento muestra lo oído o indica ausencia de soporte; no sustituye silenciosamente el idioma |
| H11 | Elegir las diez variantes de estilo de voz | Se aplica tono/ritmo; si no hay voz compatible, lo indica sin usar idioma extranjero |
| H12 | Orden de idioma para una respuesta, para una sesión y persistente | Respeta duración del cambio; el cambio permanente sobrevive a recarga |
| H13 | Iniciar, cancelar, borrar y revocar consentimiento de muestra de voz | La pista se cierra, no quedan muestras nuevas y la eliminación funciona |
| H14 | Apagar pantalla, ocultar pestaña y regresar | No sigue interpretando cámara/audio ocultos; recuperación sin duplicar sesiones |
| H15 | Probar sin red después de carga inicial y recargar | Las funciones que dependen de CDN/modelos dan aviso claro; no se falsifican detecciones |
| H16 | Probar cuenta/persona no registrada y datos de dos usuarios | Ninguna persona accede por error a memorias privadas de otra |

## Resultado físico por dispositivo

- Dispositivo, sistema y navegador:
- Fecha y commit:
- Cámara y micrófono reales (no simulados):
- Resultados H01–H16 (PASS/FAIL/BLOCKED/NOT RUN):
- Descripción reproducible de cada FAIL, sin datos biométricos:
- ¿Se verificó que «¡Chocar los cinco!» sigue funcionando?:
- Confirmación del responsable de la prueba:
- **Aceptación de campo:** pendiente hasta que H01–H16 estén ejecutados en dispositivos reales representativos. No inferirla del verde de CI.

## Comprobaciones automatizadas asociadas

`npm run test:ci` cubre regresiones de interfaz, eventos ASR, pruebas sintéticas de permisos/captura, aislamiento de identidad con caras simuladas, reanudación, almacenamiento y memoria. La matriz profunda se ejecuta en PRs, programaciones o lanzamientos manuales del workflow. La precisión y el acceso al hardware real dependen de la prueba física independiente.
