# P32 — Emociones coherentes y vínculo por persona

**Auditoría:** había 16 estados de ánimo, reconocimiento de emociones semánticas y vínculo persistente por perfil, pero varios estados se mostraban con una segunda clase facial de otra emoción (avergonzado como triste, confundido como asustado). Algunas respuestas emocionales caían al español en francés, italiano y alemán y un temporizador de recuperación podía modificar una emoción nueva si coincidía el nombre.

**Incremento:** cada emoción conserva una sola clase de su propio estado, la representación visual con cejas/ojos/sonrojo se refuerza y los cinco SVG usan su mapeo vigente. La animación de ojos enamorados no puede reaparecer tras enojo/sueño. Los nueve diálogos emocionales tienen frases propias en seis idiomas. La recuperación captura revisión, avatar y persona; nunca modifica respuestas posteriores ni otro perfil. No se inventan relaciones: la persistencia del vínculo sigue ligada a personas registradas mediante el motor central.

**Regresión:** `npm run test:p30-p32`, `npm run test:p30-p32:browser` y la suite emocional previa. Las reacciones y sus intensidades necesitan contraste humano y validación física; no se puede garantizar naturalidad perfecta ni reconocer sentimientos internos.
