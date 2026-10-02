# Robotito 🐵🤖

Robotito es un macaquito virtual que vive en el navegador y reacciona a lo que ve y escucha.

## V1

- Ojos y expresiones animadas.
- Color del cuerpo según su humor.
- Estados: feliz, tranquilo, triste, asustado, enojado, hambriento y dormido.
- Cámara: sigue el rostro por la pantalla y reconoce personas previamente registradas.
- Memoria por persona guardada solo en el navegador.
- Cumpleaños: si reconoce a una persona el día de su cumpleaños, muestra torta y confeti.
- Micrófono: escucha frases compatibles con Web Speech API y reacciona a palabras amables o desagradables.
- Música/sonido: detecta volumen y baila cuando hay audio sostenido.
- Sueño: si durante un rato no ve ni escucha a nadie, cabecea y termina durmiéndose.
- Hambre: a las 3 horas sin comer empieza a tener hambre; a las 4 horas se enoja muchísimo.
- Comer juntos: detección experimental de mano cerca de la boca + movimiento de boca.
- Biblioteca: importa un CSV exportado de Goodreads y evita recomendar libros ya leídos.
- Recomendaciones: busca libros con Google Books y recuerda la recomendación por persona.

## Privacidad

Las caras registradas, cumpleaños, relaciones y recuerdos se guardan en `localStorage` del navegador del dispositivo. No se suben al repositorio.

## Uso

1. Abrí `index.html` desde un servidor HTTPS (GitHub Pages funciona).
2. Tocá **Despertar sentidos** y permití cámara y micrófono.
3. Registrá una persona desde el panel Personas mirando a la cámara.
4. Cargá su cumpleaños si querés.
5. Para Goodreads, exportá tu biblioteca a CSV e importala desde la pestaña Libros.

## Limitaciones de la V1

La detección de "estar comiendo" es heurística: combina boca abierta y una mano cerca de la cara; puede equivocarse. El reconocimiento facial requiere registrar cada persona primero y depende de luz, ángulo y cámara. La detección de música usa energía de audio, no identifica canciones.

## Tecnologías

HTML, CSS y JavaScript sin backend; FaceAPI para rostro/reconocimiento y MediaPipe Hands para la heurística de comida.
