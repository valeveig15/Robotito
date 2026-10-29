# Ejecutar pruebas de cámara/micrófono con hardware auténtico

Las pruebas automáticas normales usan simulaciones. Para comprobar disponibilidad de un micrófono y una cámara **reales**, el repositorio ofrece un workflow manual para una máquina Linux controlada por una persona autorizada. Nunca se ejecuta por push/PR y no se activa por tener acceso normal a GitHub.

## Preparar un ejecutor

1. Usá una computadora Linux con webcam/micrófono conectados, Node 22, Python 3, `xvfb-run`, acceso a Playwright Chromium, y permisos sobre los dispositivos. No ejecutes esto en una computadora compartida o con datos biométricos ajenos.
2. En GitHub, abrí **Settings → Actions → Runners → New self-hosted runner** para este repositorio y seguí las instrucciones de instalación de GitHub. El registro necesita autorización propia y un token temporal. **Nunca publiques el token en Issues, PRs o logs.**
3. Agregá la etiqueta personalizada exacta `robotito-hardware` y asegurate de que tenga además `self-hosted` y `linux`.
4. Verificá manualmente que el usuario del ejecutor puede abrir la cámara/micrófono mediante el navegador y que no se utilizan dispositivos simulados.
5. Abrí **Actions → Robotito physical camera and microphone field smoke → Run workflow** en `main`. Si no existe ningún ejecutor con esas etiquetas, el trabajo quedará en cola y NO se debe declarar como realizado.
6. Revisá si el resultado dice `physicalHardwareVerifiedAutomatically:true`. El script no registra imágenes ni audio, no envía datos biométricos ni almacena transcripciones. Los tiempos reportados se miden en milisegundos por dispositivo; no prueban reconocimiento correcto de una persona.
7. Luego completá **H01–H16** en [P04-HARDWARE-VALIDATION.md](P04-HARDWARE-VALIDATION.md), con personas participantes y consentimiento independiente para muestras biométricas. Registrá solo PASS/FAIL/BLOCKED/NOT RUN, versión de navegador/equipo, pasos y fallos reproducibles. No subas audios ni fotos privados.

## Alcance y límites

- El script `tests/p04-physical-device-smoke.js` hace una comprobación **no simulada** de webcam y micrófono conectados con un Chromium en pantalla virtual Xvfb; un display virtual no simula el hardware.
- Esta prueba no puede certificar si el modelo reconoce una voz, una cara registrada, una cara similar o un estornudo. Esas conclusiones requieren ensayos consentidos con personas y pruebas controladas.
- No mezcles los resultados de CI con muestras de usuario; los registros de voz y cara permanecen locales al navegador y deben eliminarse al finalizar.
- Los dispositivos Android/iPhone necesitan pruebas manuales o un proveedor remoto con dispositivos físicos y un mecanismo de permiso explícito. El runner Linux no los suplanta.
- Para recopilar sonidos reales del punto 3, usá `tools/audio-corpus-studio.html`, revisión de etiquetas independiente y `npm run validate:audio`, `npm run evaluate:audio`, `npm run audit:audio:p03`. No cargues corpus con licencias incompatibles, ni afirmes tasas de error sin muestras efectivas.

La configuración oficial de labels de GitHub está documentada en https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/use-in-a-workflow
