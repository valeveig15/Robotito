# Punto 06 — aceptación de voces en dispositivos reales

**Estado:** pendiente de ejecución física. GitHub Actions/Playwright verifica la lógica y el contrato de los diez perfiles; no demuestra que los sistemas operativos produzcan diez voces perceptiblemente diferentes.

## Preparación (sin subir audio privado)

- Abrir el sitio publicado de Robotito desde un equipo físico. Registrar navegador/versión, sistema operativo, idioma, resultado y consentimiento de los participantes.
- Si se prueba una voz que el navegador informa como **no local**, no usar textos personales, médicos ni información de terceros; ese motor podría procesar texto fuera del dispositivo.
- Si se graba una muestra de otra persona, obtener consentimiento explícito antes de solicitar acceso al micrófono. Para auditar, registrar solo el resultado y el identificador de caso, **nunca adjuntar la grabación**.
- Usar el texto neutro de saludo al pulsar **Probar voz**; no hablar en modo clase ni durante un silencio solicitado.

## Matriz de aceptación manual

| ID | Caso | Criterio de aprobación |
|---|---|---|
| V01 | PC/Chromium, español, diez estilos | Cada estilo emite audio si existe una voz compatible; registrar estilos indistinguibles como FAIL, no afirmar diez voces distintas |
| V02 | PC/Firefox, voces disponibles | La lista presenta únicamente las voces realmente enumeradas, no diez estilos falsos |
| V03 | Android/Chromium, voz instalada | Se puede escuchar una muestra y seleccionar estilo, si el sistema ofrece TTS |
| V04 | iPhone/Safari, voz instalada | Permiso de reproducción y síntesis funcionan; si el navegador limita TTS, indicar BLOCKED |
| V05 | Seis idiomas | Probar es/en/pt/fr/it/de, detectar la falta de voz y no leer el contenido con una voz de otro idioma |
| V06 | Elección por idioma | Elegir una voz diferente para es y en; alternar, recargar y comprobar que se recuerdan |
| V07 | Traducción puntual | Mantener es en la interfaz, pedir una respuesta de una vez en de; usar la voz de, sin cambiar la es |
| V08 | Voz no local | Se muestra la marca cuando el navegador la informa y la advertencia de privacidad permanece visible |
| V09 | Modo clase y silencio | **Probar voz** no pronuncia contenido en períodos de silencio o en Modo Clase |
| V10 | Consentimiento rechazado | Sin consentimiento no se solicita ni conserva una grabación de voz ajena |
| V11 | Permiso de micrófono denegado | No queda una grabación ficticia, el control muestra error y permite reintentar |
| V12 | Revocación de consentimiento | La captura activa se cancela y se liberan las pistas; ninguna muestra tardía se conserva |
| V13 | Grabación permitida y borrado | La muestra queda local con metadatos de consentimiento y se elimina al pulsar borrar |
| V14 | Voces/grabaciones | No afirmar clonación, no reproducir muestras guardadas como si fueran una voz sintética disponible |

**Resultados permitidos:** PASS, FAIL, BLOCKED, NOT RUN. Adjuntar solo modelo de dispositivo y versiones, sin transcripciones privadas. Los ensayos deben incluir al menos un navegador/escritorio, un Android y un iPhone **si se pretende certificar esas plataformas**.

## Cómo documentar diferencias acústicas

Calificar con oyentes consentidos y a volumen similar; aleatorizar el orden de los diez estilos. Medir si pueden distinguir pares, latencia y naturalidad, sin afirmar una precisión del 100 %. El motor Web Speech puede ignorar ajustes de pitch/rate; si un sistema trata dos estilos igual, documentarlo como limitación real y no disfrazarlo cambiando la etiqueta.

**Referencia para uso inmediato:** [Robotito](https://valeveig15.github.io/Robotito/) y [diagnóstico de voces, micrófono y cámara](https://valeveig15.github.io/Robotito/p04-device-check.html). El diagnóstico comprueba capacidades de navegador y no equivale a la evaluación subjetiva V01–V14.

Conservar «¡Chocar los cinco!» y el control de Tono. El punto 06 no se declara completado por una CI verde.
