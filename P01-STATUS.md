# Punto 01 — comprensión central y cierre verificable

Revisión: 29/10/2026. Requisitos: punto 01 de `Robotito_82_pedidos_completos-1.docx` (27/10), `ROADMAP_82.md` y `PENDIENTES_CONTROLABLES.md`.

## Correcciones integradas en el incremento

- Una definición de «ejercicio», «libro» o una orden citada conserva la fuente general. Una mención no autoriza consultar apuntes, memorias, cámara ni acciones del avatar.
- Las exclusiones de apuntes en español, inglés, portugués, francés, italiano y alemán se conservan como restricciones del plan y se respetan en la recuperación de recuerdos.
- «No entiendo» se interpreta como pedido de ayuda en los seis idiomas. Comparaciones, resúmenes y seguimientos tienen roles léxicos compartidos; los empates de idioma respetan el seleccionado.
- Referencias sin antecedente, dos números alternativos de ejercicio, órdenes contradictorias y condiciones no resueltas solicitan aclaración. Una negación no sustituye el tema previo.
- Repetir después de una persona conserva el contenido como texto literal, incluso si contiene acciones o separadores.
- Los seguimientos breves, detallados, de ejemplo, idioma y horario conservan su contexto. Un seguimiento al comienzo de una secuencia no descarta las acciones posteriores.
- El modelo local opcional tiene un plazo máximo, sesiones aisladas y destrucción al terminar. Solo puede refinar intenciones académicas de fuente general; no concede nuevos permisos ni modifica la profundidad solicitada.
- Una planificación tardía no contamina el contexto de otra persona. La traducción puntual reutiliza la ruta local existente y descarta resultados si cambió la persona activa.

## Evidencia y alcance

Las pruebas nuevas se ejecutan con `npm run test:p01` y `npm run test:p01:browser`; la batería completa se ejecuta con `npm run test:ci`. El navegador prueba las rutas reales del chat con fuentes externas y modelos simulados, sin micrófono ni datos de personas reales. El modelo semántico nativo y Translator requieren disponibilidad en el navegador; su ausencia conserva las reglas y expresa la limitación de traducción.

No se acredita comprensión universal ni 999.999 respuestas verificadas, y no se deben confundir cambios de formato con paráfrasis semánticas. El objetivo de 49.999.950 formulaciones sigue siendo una aspiración de generalización y evaluación: un generador finito no prueba todas las preguntas humanas ni la exactitud factual de todas sus respuestas. Las nuevas expresiones reales deben conservarse como regresiones con un resultado esperado revisado.

La precisión de micrófonos, identificación de personas, catálogo de voces y cobertura factual pertenecen a sus puntos específicos. Se conserva «¡Chocar los cinco!» y el registro permanente de los demás pendientes.
