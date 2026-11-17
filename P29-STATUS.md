# P29 — Especie, alimentación, camaleón y preguntas sobre sí mismo

## Auditoría inicial
La implementación anterior solo respondía a unas pocas expresiones en `handleSpeciesQuestion`, usaba una misma réplica de «alimentar» como explicación sobre la dieta, y el caso del camaleón podía confundir un efecto visual con la explicación zoológica. Los avatares y rasgos ya existían en `species-personality.js`; se preservan.

## Mejora conectada
`species-self-knowledge.js` define datos alimentarios para **50 ID de avatar**, organizados en grupos con excepciones explícitas (oso polar, perro, panda, camaleón, iguana, pingüino, delfín, unicornio, dinosaurio y robot). Las respuestas son propias del avatar seleccionado y se ofrecen en seis idiomas. Distingue la pregunta dirigida a Robotito de preguntas académicas sobre animales externos: «qué come un camaleón» no se roba para responder «qué como yo». Nunca afirma comer comida de verdad: Robotito es un avatar virtual.

El camaleón responde con el conocimiento correcto de que los cambios de color responden a comunicación y termorregulación (no a imitar siempre un fondo) y se anima visualmente sin analizar el color del entorno. Si está elegido otro avatar, no se atribuye falsamente ese comportamiento. Se preserva `ROBOTITO_SPECIES`, las voces, el chat, `approved-avatar-bridge.js`, el cambio de avatar de P27 y los cinco diseños de P28.

## Pruebas
- `npm run test:p29`: todos los 50 avatares y seis idiomas, datos especiales, preguntas de identidad y dieta, ejemplos positivos de seis lenguas, preguntas negativas académicas, entradas largas y recuperación ante ID desconocido.
- `npm run test:p29:browser`: cambio de color de camaleón, diferencia entre conocimiento sobre sí y zoología, chat escrito, cambio de avatar del camaleón al panda, regreso a los cinco SVG aprobados, seis idiomas y campo táctil a 360 px.
- `npm run test:ci`: suite histórica de núcleo, voz, cámara, memoria, idiomas, chat, P27 y P28, y P29.

**No afirmar «completamente aceptado»** hasta prueba en Android e iOS físicos, contraste del efecto de color y comprobación humana de las 50 fichas alimentarias, las expresiones de los cinco SVG y lectores de pantalla. Las pruebas sintéticas no sustituyen esa verificación. **«Chocar los cinco» permanece**.
