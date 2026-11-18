# P33–P35 — Estado de implementación y aceptación

## 33 · Batería real e inactividad
- Usa `navigator.getBattery()` cuando el navegador la ofrece; cuando falta o falla se sigue etiquetando la energía como **estimada**, no real.
- Unifica los cruces descendentes de umbrales 50, 20, 10 y 5 %. No repite avisos por la misma lectura o por cargar; un descenso rápido se comunica con el nivel más crítico alcanzado.
- La fuente visible se actualiza cuando se conecta o desconecta el cargador.
- El modo inactivo atenúa el escenario, pausa elementos ambientales e impide afirmar que se puede reducir el brillo físico del dispositivo.
- Pendiente aceptación: comprobar el comportamiento en batería/cargador reales, navegadores con API bloqueada, reanudación y lectores de pantalla. El ahorro real de energía del hardware no está demostrado.

## 34 · Cumpleaños por persona registrada
- Celebración automática vinculada a cumpleaños, inicio de sentidos, persona reconocida y ausencia de Modo Clase.
- Tres franjas **locales**: mañana 06:00–11:59, tarde 12:00–17:59 y noche 18:00–05:59.
- Un registro local por identificador de persona, día y franja evita repeticiones al reingresar y recargar. La celebración manual con el botón 🎂 no consume franjas.
- Escena con torta, regalo interactivo «Es para ti» y revelación «¿Qué mejor regalo que yo?». Incluye un botón de reproducción de melodía **original sintetizada**. El navegador puede bloquear el sonido automático; un clic explícito permite reproducirlo.
- La interfaz admite seis lenguas; el nombre se inserta como texto, nunca como HTML.
- Pendiente aceptación: audio y animaciones en Android/iPhone reales, permisos de reproducción, reinicio y casos de cambio de fecha/huso horario. El almacenamiento local funciona por navegador/perfil, no se sincroniza entre dispositivos.

## 35 · Recomendaciones bibliográficas sin Goodreads
- Se mantiene la recomendación sin cuenta Goodreads; la importación CSV sigue siendo opcional y respeta los títulos leídos al excluirlos.
- Google Books suministra título, autores, portada, descripción, editorial, fecha, puntuación y número de valoraciones **solo cuando estén presentes**. Los enlaces se filtran a HTTPS; las portadas Google pueden elevarse de HTTP a HTTPS. La deduplicación combina ISBN-13 (si existe) o título y autor.
- No se generan reseñas de lectores inventadas ni se presenta texto sintético como una opinión atribuida. Se indica que las reseñas de lectores no están disponibles en la fuente actual.
- No se promete acceso a textos completos o Goodreads API. El catálogo de reserva sigue etiquetado como selección local.
- Pendiente: evaluar relevancia narrativa y cobertura de series/sagas, revisar licencias de imágenes y cumplimiento de condiciones de la API de Google Books; además de pruebas físicas y accesibilidad.

## Pruebas
```bash
npm ci
npx playwright install chromium
npm run test:p33-p35
npm run test:p33-p35:browser
npm run test:ci
```
Se añadieron pruebas de umbrales, franjas y claves únicas, URL seguras, duplicados/ISBN, escena manual y regalo, persistencia por franja, metadatos y atenuación en navegador.

**No marcar P33–P35 como completamente aceptados sin CI verde y la verificación física/visual indicada.** Preservar «Chocar los cinco», los cinco SVG aprobados y las funciones anteriores.
