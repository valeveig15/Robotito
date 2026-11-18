# Auditoría verificable de los puntos restantes de Robotito

Fecha de corte: 18 de noviembre de 2026. Fuente: `ROADMAP_82.md` del repositorio y estado de PRs vistos en GitHub.

## Regla de aceptación

> Ningún punto está «completamente terminado» solo por disponer de código, pruebas simuladas o un PR. Se requieren CI pertinente, pruebas de navegador, permisos, dispositivos reales cuando aplica y revisión de seguridad/privacidad. Lo ya implementado no debe perderse y «Chocar los cinco» es regresión obligatoria.

## Nuevas solicitudes no enumeradas originalmente

- Avatar más pequeño y menú de ajustes: [PR #158](https://github.com/valeveig15/Robotito/pull/158), no integrado.
- Memoria por dispositivo y retoma al entrar: [PR #159](https://github.com/valeveig15/Robotito/pull/159), no integrado. El almacenamiento local no es infalible.
- P33–35: [PR #157](https://github.com/valeveig15/Robotito/pull/157), verificaciones pendientes.
- P36–38: [PR #160](https://github.com/valeveig15/Robotito/pull/160), verificaciones pendientes.
- P39–40: [PR #161](https://github.com/valeveig15/Robotito/pull/161), clubs offline y sorteo, sin backend colaborativo.

## Puntos 41–82

**Estado conjunto: pendientes de auditoría/aceptación, no declarados terminados.** El texto «POR AUDITAR» de la hoja de ruta no equivale a probar que no hay ningún código preexistente.

### 41–46 · Multimedia, clima, interacción y seguridad

| Nº | Requisito | Verificación imprescindible |
|---:|---|---|
| 41 | Reproducción de música por tema, artista, banda o género | Reproducción con fuentes y licencias, consentimiento y cancelación |
| 42 | Escenario de clima adaptado a las condiciones | Escenarios fieles a datos con origen/fecha, fallo de red y permisos |
| 43 | Panel de preguntas, feedback y contador honesto | Contadores con ámbito y origen explícito, feedback con privacidad |
| 44 | Modo foto/captura de pantalla con reacción simpática | Captura solo con permiso/acción, exportación y limpieza |
| 45 | Analítica y reportes con consentimiento explícito | Analítica opcional, minimización de datos, exportación y borrado |
| 46 | Integración final, rendimiento, privacidad y regresión | CI integral, seguridad, rendimientos y pruebas físicas |

### 47–59 · Conocimiento público, escuela y herramientas visuales

| Nº | Requisito | Verificación imprescindible |
|---:|---|---|
| 47 | Origen uruguayo, creadora y biografía adaptable según la especie | Evidencia pública verificable, fecha, seis idiomas y contexto |
| 48 | Personalidad musical: rock and roll de Uruguay y Argentina | Evidencia pública verificable, fecha, seis idiomas y contexto |
| 49 | Acceso web confiable y aprendizaje verificable de información pública | Evidencia pública verificable, fecha, seis idiomas y contexto |
| 50 | Noticias del día: país del usuario, mundo y deduplicación semántica | Evidencia pública verificable, fecha, seis idiomas y contexto |
| 51 | Reloj visual exacto, hora hablada y cuenta regresiva hasta otra hora | Evidencia pública verificable, fecha, seis idiomas y contexto |
| 52 | Pruebas, cuestionarios y exámenes a partir de material cargado | Conservación de fuentes y privacidad de material educativo |
| 53 | Migración incremental de los cinco avatares HTML aprobados | Conservación de fuentes y privacidad de material educativo |
| 54 | Apuntes y punteos editables por clase, con historial | Conservación de fuentes y privacidad de material educativo |
| 55 | Relaciones razonadas entre clases y temas de una materia | Conservación de fuentes y privacidad de material educativo |
| 56 | Esquemas, gráficos y visualizaciones académicas pertinentes | Conservación de fuentes y privacidad de material educativo |
| 57 | Editor gráfico universal y uso didáctico del color | Conservación de fuentes y privacidad de material educativo |
| 58 | Tomar fotografías y leer el contenido en voz alta | Conservación de fuentes y privacidad de material educativo |
| 59 | Fotografía y limpieza de pizarrón/libro vinculada al instante de clase | Conservación de fuentes y privacidad de material educativo |

### 60–75 · Tiempo, estudio, planificación y accesibilidad

| Nº | Requisito | Verificación imprescindible |
|---:|---|---|
| 60 | Cronómetro, temporizador y progreso temporal visual | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 61 | Estimación adaptativa del tiempo de estudio por rendimiento real | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 62 | Ajustes manuales de tiempos previstos y escenarios de estudio | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 63 | Agenda de sesiones de estudio con avisos a la hora elegida | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 64 | Avisos escalonados antes de pruebas y entregas | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 65 | Planificador nativo de materias, horarios y prioridades | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 66 | Lista de pendientes tachable con satisfacción de progreso | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 67 | Tarjetas de memoria editables y repaso organizado | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 68 | Modo concentración que silencia notificaciones de Robotito | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 69 | Gráficos semanales y seguimiento del tiempo por materia | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 70 | Metas de estudio y recordatorios tras tres horas sin avanzar | Persistencia por perfil, reloj fiable, suspensión y escenarios límite |
| 71 | Ejemplos adaptados a teoría y práctica | Accesibilidad, contraste, reducción de movimiento y lector de pantalla |
| 72 | Tipografías accesibles y ajustes de lectura | Accesibilidad, contraste, reducción de movimiento y lector de pantalla |
| 73 | Modo de lectura con inicio de palabras destacado | Accesibilidad, contraste, reducción de movimiento y lector de pantalla |
| 74 | Temas de fondo suaves, modo oscuro y guía de lectura por línea | Accesibilidad, contraste, reducción de movimiento y lector de pantalla |
| 75 | Mapas mentales automáticos de apuntes extensos | Accesibilidad, contraste, reducción de movimiento y lector de pantalla |

### 76–82 · Clase, equipos, evaluaciones y festividades

| Nº | Requisito | Verificación imprescindible |
|---:|---|---|
| 76 | Activación de Modo Clase muy visible y accesible | Grabaciones consentidas, sincronización y pruebas académicas reales |
| 77 | Marcadores de colores durante clases grabadas | Grabaciones consentidas, sincronización y pruebas académicas reales |
| 78 | Sincronización bidireccional entre audio y transcripción | Grabaciones consentidas, sincronización y pruebas académicas reales |
| 79 | Minijuegos educativos interactivos basados en clases | Grabaciones consentidas, sincronización y pruebas académicas reales |
| 80 | Progreso visual por integrantes en equipos y grupos de estudio | Grabaciones consentidas, sincronización y pruebas académicas reales |
| 81 | Exámenes adaptativos por tema y carpeta de materia | Grabaciones consentidas, sincronización y pruebas académicas reales |
| 82 | Trajes y ambientaciones para festividades | Animaciones reversibles y festividades sin interrumpir funciones |

## Bloqueos comunes y prioridad

1. Resolver CI de PRs 157–161 y evitar versiones publicadas con regressiones; combinar por orden sin conflictos.
2. Consolidar privacidad de memoria, permisos y cancelación de audio/cámara antes de añadir funciones que los utilicen.
3. Implementar los puntos restantes en incrementos pequeños y verificables, con pruebas permanentes. No marcar un punto como aprobado sin su evidencia.
4. Validar en Android/iPhone reales, Firefox/WebKit/Chromium, teclado y lectores de pantalla cuando sea pertinente.
5. Para sincronización real de clubes, avisos con pestaña cerrada o reproducción de catálogo con derechos, no presentar interfaces simuladas como infraestructura real.
