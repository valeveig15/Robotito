# P13 — Diferenciación de hablantes y correcciones de transcripción

**Estado: revisión incremental, no certificación de identificación vocal.**

El motor existente conserva voz, puntuación de coincidencia, rol, confianza, línea original, línea corregida y cambios. La atribución acústica se considera heurística.

## Endurecimiento de esta revisión

- Sin perfiles o sin una separación clara entre perfiles, el rol pasa a `unknown` en lugar de imputarse automáticamente a `classmate`.
- La etiqueta visible correspondiente se presenta como «SIN IDENTIFICAR».
- Se preserva la corrección manual explícita de rol.
- Una comprobación web tardía no debe sobrescribir el texto académico si fue modificado desde el comienzo de esa comprobación.

## Aceptación pendiente

- Diarización real con dos o más hablantes, voces simultáneas, ruido, turnos breves, permisos y distintos dispositivos.
- Editor verificable de correcciones de transcripción con historial, autor, revisión y restitución de texto; no inferir identidad a partir de confianza aparente.
- Métricas de atribución incorrecta y abstención sobre un conjunto independiente y consentido; pruebas en seis idiomas.
