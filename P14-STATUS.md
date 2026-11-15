# P14 — Apuntes propios y respuestas de clases justificadas

**Estado: auditoría incremental; prioridades y justificación integral pendientes.**

Existe búsqueda contextual de sesiones, transcripciones y material en los módulos de clase y memoria.

## Aislamiento corregido

- Si la consulta especifica materia o tema y no hay líneas coincidentes, `classLinesForSubject` devuelve una lista vacía en lugar de responder con líneas pertenecientes a otras materias.
- Si se selecciona una sesión con líneas existentes, se conserva su prioridad.
- Regresión para búsqueda coincidente y búsqueda sin resultados.

## Pendientes de aceptación

- Auditar todas las rutas de respuestas, no solo `classLinesForSubject`, para priorizar apuntes propios por propietario, clase, tema y revisión.
- Citas hasta el fragmento concreto con sesión, hora, ubicación y versión; distinguir «según tus apuntes» de una comprobación web externa.
- Abstenersе cuando falta evidencia, distinguir contradicciones y texto corregido, y probar privacidad entre propietarios y materias, PDFs grandes y consultas en seis idiomas.
- No prometer respuestas verificadas cuando solo exista un resumen generado.
