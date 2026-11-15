# P14 — Apuntes propios prioritarios y respuestas justificadas

**Estado: EN PROGRESO.** Robotito ya recupera líneas de clases y fragmentos del material académico cargado, aplica umbrales de relevancia y presenta indicaciones de procedencia en sus respuestas de clase.

## Mejora puntual
El material de estudio subido por el usuario obtiene una ventaja moderada cuando compite con transcripciones automáticas con contenido comparable. No elimina el requisito de solapamiento semántico: un archivo ajeno a la consulta no se considera evidencia solo por ser un documento cargado. Cuando existe, la tarjeta de fuente muestra nombre de archivo, número de fragmento y número de oración para que la referencia sea comprobable.

## Pruebas
`npm run test:p12-p14` verifica que la prioridad se aplica después del filtro de relevancia. Las regresiones semánticas y del núcleo se mantienen en CI.

## Pendientes de aceptación
Distinción entre apuntes personales y otros archivos importados con una prioridad configurable, aislamiento estricto por propietario, citas granulares por documento/página/fragmento, abstención cuando varias fuentes se contradicen, seguimiento de revisiones y supresión de materiales borrados de índices/cachés, evaluación con preguntas reales de clases y medición de precisión y fidelidad en seis idiomas. Nunca presentar una respuesta sintetizada como cita literal de la profesora.
