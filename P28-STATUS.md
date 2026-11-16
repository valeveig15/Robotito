# P28 — Integración de cinco avatares aprobados
Fecha: 16/11/2026

## Fuentes originales verificables
La especificación del 27/10 menciona Pandi V4, Bruno Pardo V36, Bruno Polar V6, Bruno Perrito V7 y Bruno Mono V3. La Biblioteca contiene revisiones posteriores del 01/11 que se priorizan, para no revertir expresiones y anatomía aprobadas:

| ID del motor | Archivo de diseño posterior | Implementación integrada |
| --- | --- | --- |
| panda | `Pandi_V12_expresiones_corregidas.html` | `assets/approved-avatars/panda.fragment.html` |
| brown-bear | `Bruno_Pardo_V41_bocas_emocionales.html` | `assets/approved-avatars/brown-bear.fragment.html` |
| polar-bear | `Nivi_V14_expresiones_corregidas.html` | `assets/approved-avatars/polar-bear.fragment.html` |
| dog | `Bobi_V17_expresiones_corregidas.html` | `assets/approved-avatars/dog.fragment.html` |
| monkey | `Momo_V11_expresiones_corregidas.html` | `assets/approved-avatars/monkey.fragment.html` |

Cada fragmento incorpora el **SVG exacto** y su CSS nativo, con sus geometrías faciales, pies, sombras, objetos, ambiente, estados y animaciones. No se reproducen los scripts originales de las demostraciones; el controlador central sigue siendo `script.js` (cámara, diálogo, audio, Modo Clase, memoria y tareas).

`approved-avatar-bridge.js` carga y encapsula cada escena en un Shadow DOM, conserva las clases y acciones actuales en el avatar invisible existente, sincroniza emociones, caminar, saludar, jugar, acariciar, chocar los cinco, parpadeo y voz, y aplica fallback a la ilustración anterior si falla un recurso. No muestra nuevos botones ni elimina funcionalidades originales. Al cambiar a una de las otras 45 especies, vuelve a su renderizador existente. Las escenas solo ocupan `.world-scene` y nunca taparán el chat inferior.

## Pruebas y aceptación
`npm run test:p28:browser` comprueba las cinco escenas SVG, elementos característicos, ausencia de JavaScript suelto, conexión con acciones y estados, cambio de avatar, idioma y tres anchos de pantalla. `npm run test:ci` conserva todos los controles previos.

**No se ha podido completar** todavía comparación visual manual pixel a pixel, contraste en móviles Android/iOS físicos, lectores de pantalla, pronunciación o rendimiento en dispositivos modestos. No confundir las pruebas automáticas de DOM con una aprobación humana del aspecto.