# Robotito 🐼

Robotito es un panda virtual tierno e interactivo que vive en el navegador y reacciona a lo que ve, escucha y recuerda.

## Qué hace esta versión

- Panda animado con ojos grandes y expresivos, pestañeo, pupilas que siguen a la persona y postura corporal.
- Mantiene pelaje blanco y negro; el humor se refleja en el aura, ojos, mejillas, boca, postura y animaciones.
- Estados: feliz, tranquilo, triste, asustado, enojado, hambriento y dormido.
- Cámara: sigue el rostro por la pantalla y reconoce personas previamente registradas.
- Memoria por persona guardada solo en el navegador.
- Memoria automática: guarda las frases finales que logra transcribir del micrófono y las asocia a la persona reconocida.
- Cumpleaños: si reconoce a una persona el día de su cumpleaños, muestra torta y confeti.
- Saludos variados según la persona y el vínculo que Robotito fue construyendo con ella.
- Botones interactivos: acariciar, alimentar, asustar y molestar, cada uno con animación propia.
- Audio: diferencia mejor entre silencio, sonido, ruido sostenido y música usando energía, distribución por frecuencias, continuidad y planitud espectral.
- Baile: solo se activa cuando la señal parece música de forma sostenida; un golpe o ruido breve no debería dispararlo.
- Sueño: si durante un rato no ve ni escucha a nadie, cabecea y termina durmiéndose.
- Hambre: a las 3 horas sin comer empieza a tener hambre; a las 4 horas se enoja mucho.
- Comer juntos: detección experimental que combina mano cerca de la boca y apertura de boca.
- Biblioteca: importa un CSV exportado de Goodreads y evita recomendar libros ya leídos.
- Recomendaciones: busca libros con Google Books y recuerda la recomendación anterior.

## Privacidad

Las caras registradas, cumpleaños, relaciones y recuerdos se guardan en `localStorage` del navegador del dispositivo. No se suben al repositorio.

El micrófono no guarda archivos de audio: la memoria automática conserva únicamente las frases que el navegador logra transcribir.

## Uso

1. Abrí la versión publicada en GitHub Pages.
2. Tocá **Despertar sentidos** y permití cámara y micrófono.
3. Registrá una persona desde el panel Personas mirando a la cámara.
4. Cargá su cumpleaños si querés.
5. Hablale normalmente: cuando el navegador entiende una frase, Robotito la guarda automáticamente.
6. Para Goodreads, exportá tu biblioteca a CSV e importala desde la pestaña Libros.

## Limitaciones

- El reconocimiento de voz depende del soporte del navegador.
- La clasificación de música/ruido es heurística: es mucho menos sensible que la versión inicial, pero no reemplaza un modelo profesional de clasificación de audio.
- La detección de estar comiendo también es heurística.
- El reconocimiento facial requiere registrar primero cada persona y depende de la luz, cámara y ángulo.

## Tecnologías

HTML, CSS y JavaScript sin backend; FaceAPI para rostro/reconocimiento y MediaPipe Hands para la heurística de comida.
