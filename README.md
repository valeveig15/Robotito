# Robotito 🐼

Robotito es un panda virtual interactivo que vive en el navegador. Ve, escucha, recuerda, aprende de clases, responde preguntas y construye una relación distinta con cada persona registrada.

## Funciones principales

### Mascota viva e interactiva
- Panda SVG con ojos expresivos, pestañeo natural, pupilas que siguen a la persona y microanimaciones espontáneas.
- Se mueve según dónde detecta a la persona frente a cámara.
- Emociones: tranquilo, feliz, triste, enojado, asustado, hambriento, con sueño, curioso, concentrado, aburrido, cariñoso, orgulloso, confundido, emocionado, avergonzado y molesto.
- Los estados visuales se limpian al cambiar de emoción para evitar expresiones superpuestas.
- El susto dura menos de un segundo y después vuelve a la normalidad.
- Interacciones: acariciar, alimentar, abrazar, chocar los cinco, jugar, asustar y molestar.
- También entiende por voz pedidos como “abrazame”, “chocá los cinco” y “juguemos”.
- Silencio temporizado por voz: “callate” lo deja sin hablar durante 25 segundos; “callate por 2 minutos” respeta la duración indicada; “ya podés hablar” lo reactiva antes. Mientras está callado sigue escuchando, recordando y mostrando respuestas escritas.
- Si no ve ni escucha a nadie, primero se aburre, luego cabecea y finalmente se duerme.
- A las 3 horas sin comer aparece hambre; a las 4 horas se enoja por hambre.
- Si detecta mano cerca de la boca y movimiento compatible con estar comiendo, intenta comer contigo.
- La detección de música usa duración, distribución espectral y planitud para distinguir mejor música de ruido.

### Personas, memoria y cumpleaños
- Registro facial con múltiples muestras y perfil de voz.
- Al volver a registrar una persona conserva más muestras de cara y voz para mejorar reconocimiento.
- Relación individual por cariño, confianza, miedo y fastidio.
- Saludos variados según persona y vínculo, evitando repetir siempre la misma frase.
- Memoria automática de lo que escucha.
- La memoria, transcripciones y materiales grandes se guardan en IndexedDB, con fallback compatible a localStorage.
- Cumpleaños con torta y confeti durante 5 segundos y regreso automático a la vista normal.
- Los datos de la persona “aaa” se purgan automáticamente de versiones antiguas y actuales.

### Preguntas y conversación
- Preguntas personales: nombre de Robotito, nombre de la persona reconocida, humor, hambre, sueño, fecha, hora, recuerdos, etc.
- Conteo de dedos con hasta dos manos.
- Matemática hablada cotidiana: suma, resta, multiplicación, división, porcentajes, potencias, raíces, factorial y expresiones combinadas.
- Precedencia matemática correcta: por ejemplo, -2² se interpreta como -(2²).
- La longitud de respuesta depende de la pregunta:
  - “¿Qué es X?” → definición breve.
  - “¿Por qué X?” → explicación suficiente.
  - “Explicame paso a paso…” → desarrollo detallado.
- Conocimiento común curado y fallback factual basado en Wikipedia para ampliar las preguntas que puede responder.
- Presidentes actuales e históricos consultados dinámicamente en Wikidata, sin depender de una lista fija que quede desactualizada.

### Modo Clase
- Modo silencioso: mientras escucha una clase Robotito no habla ni interrumpe.
- Organización: **Materia → Tema → Clase**.
- Guarda transcripciones y puede grabar el audio completo de la sesión localmente.
- Distingue entre:
  - vos;
  - profesor/a;
  - compañero/a.
- Usa perfiles de voz registrados y muestra confianza cuando la clasificación es dudosa.
- Cada línea puede corregirse manualmente, y esa corrección se usa para aprender.
- Botones rápidos para indicar que la próxima frase será tuya, del profesor/a o de un compañero/a.
- Corrige conservadoramente errores de transcripción académica y puede verificar datos claros con fuentes web.
- Puede resumir la clase, extraer ideas importantes y crear tarjetas de estudio.
- Responde preguntas sobre clases **en sus propias palabras** y además muestra la cita textual de donde obtuvo la evidencia.

### Material académico y ejercicios
- Carga de TXT, Markdown, CSV, JSON y PDF.
- Los materiales se asocian a materia y tema.
- Indexa ejercicios de los archivos para recuperar exactamente “ejercicio 4”, “problema 2”, etc.
- Puede explicar ejercicios paso a paso usando el material cargado.
- Módulo especial de Física para impulso, cantidad de movimiento y choques.
- Matemática visual para circunferencias:
  - centro y radio;
  - forma canónica;
  - ecuación general;
  - completar cuadrados;
  - explicación paso a paso;
  - representación en plano cartesiano con centro y radio.

### Visión y objetos
- Reconocimiento de objetos por cámara.
- COCO-SSD como detector principal.
- MobileNet como segunda opinión para ampliar objetos reconocibles.
- Catálogo local de objetos para traducir etiquetas técnicas a nombres cotidianos.

### Libros
- Importación de Goodreads mediante CSV.
- Evita recomendar libros ya leídos.
- Puede buscar entre libros pendientes y hacer recomendaciones por género, trama, autor u otras condiciones.
- Recuerda la recomendación anterior para preguntas como “mostrame el libro que me recomendaste ayer”.

### Tareas
- Puede conectarse a una Google Sheet compartida/publicada para lectura.
- Intenta reconocer columnas de tarea, materia, fecha y estado.
- Si llevás más de 20 minutos con Robotito y hay pendientes, te recuerda que tenés cosas para hacer.

## Arquitectura

La lógica nueva sigue un flujo único:

**entender la intención → decidir profundidad → buscar evidencia o ejecutar acción → responder**

Los módulos principales incluyen:

- `script.js`: estado general, voz, cámara, memoria y UI.
- `class-organizer.js`: organización de clases y materiales.
- `class-verification.js`: captura, hablante y verificación.
- `class-exercises.js`: recuperación y explicación de ejercicios.
- `spoken-math.js`: matemática hablada.
- `robotito-vnext.js`: router central, circunferencias, objetos y microcomportamientos.
- `robotito-store.js`: almacenamiento durable con IndexedDB.
- `presidents.js`: presidentes actuales e históricos mediante Wikidata.
- `web-knowledge.js`: conocimiento factual de respaldo.
- `robotito-tests.js`: pruebas de regresión.

## Pruebas

Abrí la página agregando:

`?tests=1`

para ejecutar las pruebas de regresión en la consola. También se pueden ejecutar manualmente con:

`ROBOTITO_TESTS.run()`

Las pruebas cubren matemática hablada, precedencia, circunferencias, profundidad de respuesta, silencio temporizado y enrutamiento de objetos/presidentes.

## Privacidad

Los datos personales de Robotito se almacenan localmente en el navegador. Las caras registradas, perfiles de voz, cumpleaños, relaciones, recuerdos, clases y materiales no se publican en GitHub.

El micrófono puede guardar transcripciones automáticamente. En Modo Clase, si la grabación está habilitada por el navegador, el audio de la clase también queda almacenado localmente en ese dispositivo.

## Tecnologías

HTML, CSS y JavaScript sin backend propio; Face API para rostro, MediaPipe Hands para manos, TensorFlow.js + COCO-SSD/MobileNet para objetos, IndexedDB para datos grandes, Google Books/Goodreads para libros y Wikidata/Wikipedia para conocimiento dinámico.
