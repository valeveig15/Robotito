# Punto 05 — Internacionalización de interfaz y conversación

Revisión: 8 de noviembre de 2026. Requisito: punto 05 de `Robotito_82_pedidos_completos-1.docx`. La memoria contextual corresponde al punto 07; los nombres históricos de algunas suites no cambian esa numeración.

La revisión amplía la interfaz, los mensajes dinámicos y los comandos en español, inglés, portugués, francés, italiano y alemán. **El cierre integral sigue condicionado a traducción libre en equipos sin modelo local y a validación de pronunciación con voces físicas.** No se presenta una respuesta original en español como si estuviera traducida.

## Comportamiento implementado

- El inicio presenta las seis versiones en renglones separados y compactos. Los seis idiomas permiten elegir cualquiera de los 50 avatares. Nombres, rasgos, ayudas y etiquetas accesibles cambian con la interfaz. Se conservan acciones, animaciones y «Chocar los cinco»; fuera del español las frases de acción usan plantillas comunes localizadas y los rasgos siguen siendo propios de cada especie.
- `ui-messages.js` añade 366 entradas completas, incluidas formas singulares, a los diccionarios existentes. `i18n.js` enlaza textos de aplicación y parámetros de forma explícita; nunca trata nombres de personas, valores de formularios, citas o apuntes como claves que deban reemplazarse automáticamente.
- Se actualizan estados, avisos, diálogos, ayudas, atributos accesibles, fechas, tareas, personas, clases, grabaciones, materiales, ejercicios, biblioteca, respaldo, percepción y mensajes de error. Un cambio de idioma conserva el elemento de audio de clase en reproducción. Las fechas usan la configuración regional elegida; el campo de cumpleaños mantiene su formato explícito DD/MM/AAAA.
- Los 227 objetos del catálogo tienen nombres en seis idiomas. La búsqueda respeta límites de palabra y usa el idioma para resolver empates: «pan» español es alimento y «pan» inglés es sartén. El reconocimiento de cámara consulta las etiquetas inglesas del modelo y muestra el nombre localizado disponible. Esto no equivale a reconocer todos los objetos posibles.
- Los dibujos, tarjetas de estudio, razones de recomendación y etiquetas de libros se actualizan al cambiar de idioma. Las doce descripciones del catálogo de libros incluido tienen traducciones sin modelo. Títulos, autores, términos citados y notas originales se conservan; las consultas al catálogo externo solicitan el idioma seleccionado.
- Los comandos de traducción puntual admiten las seis lenguas y conservan mayúsculas, acentos y nombres del texto solicitado. No cambian la preferencia persistente. Se mantienen los alcances permanente, sesión y una respuesta; esta última se consume también cuando la respuesta ya especifica su idioma.
- Un cambio de idioma cancela la voz en curso e invalida respuestas y traducciones anteriores. Una respuesta demorada tampoco se muestra ni se guarda bajo una persona distinta de quien la pidió.

## Contenido variable y privacidad

`localized-content.js` conserva el texto fuente y su idioma. Los resúmenes, respuestas académicas, explicaciones, tarjetas y descripciones externas pueden usar `Translator` o `LanguageModel` **en el dispositivo**. La traducción automática solo intenta modelos declarados disponibles; un botón explícito permite solicitar su descarga local cuando la API lo admite. Hay límites de tiempo, cierre de sesiones y rechazo de resultados obsoletos, idénticos o detectados en el idioma incorrecto.

Si no se puede traducir, el contenido conserva su idioma original, muestra «Original sin traducir» en el idioma de la interfaz y permite reintentar localmente. Un idioma fuente desconocido no se adivina: se usa el detector existente solo cuando reconoce uno de los idiomas admitidos. Una traducción aceptada se identifica como local. Las pruebas comprueban este recorrido con adaptadores simulados; no certifican la fidelidad semántica de un modelo real.

Este servicio no transmite frases, notas ni transcripciones a un traductor externo. Las funciones preexistentes que consultan fuentes públicas, por ejemplo libros o clima, siguen teniendo sus propias solicitudes. No se añade un servicio remoto de traducción ni una suscripción.

Los datos guardados no se reescriben al cambiar de idioma. Los recuerdos nuevos pueden incluir el idioma; los antiguos sin ese campo conservan `und` como procedencia desconocida. La visualización no evalúa HTML contenido en notas.

## Evidencia y reproducción

| Comprobación | Cobertura |
| --- | --- |
| `npm run test:p05` | 1.045 aserciones de interfaz, 8 de reloj/alcance y 8.008 de catálogo, comandos, avatares, objetos y traducción privada: 9.061 en total |
| `npm run test:p05:browser` | Aplicación real: seis idiomas, 50 avatares, ayudas, formularios, fechas, originales intactos, libros incluidos, dibujos, tarjetas, audio, recarga y resultados atrasados |
| `npm run test:p04` | Conserva las regresiones de voz/captación; aislamiento de respuestas ampliado a 21 comprobaciones |
| `npm test` | Núcleo, audio, contratos semánticos, memoria, voces y tres semillas generativas; no se suman las semillas como intenciones únicas |
| `npm run test:ci` | Regresiones anteriores y batería de Chromium, matrices, concurrencia y arnés de fallos |
| Workflow `cross-browser.yml` | Firefox/WebKit, incluida la nueva suite dinámica de P05 mediante `test:browser:extended` |

La revisión local específica, `npm test` y todos los bloques de navegador de `test:ci` pasaron: 557 comprobaciones de Chromium y cuatro tamaños responsive, diálogo, P04/P05/P07, tres semillas de escenarios, concurrencia y arnés de fallos. Se corrigió el adaptador simulado de la prueba de P01 para declarar el modelo instalado (`availability: available`), conservando sus comprobaciones de traducción y cierre. La integración exige además resultados satisfactorios de GitHub Actions en el mismo HEAD del PR; la evidencia definitiva de los motores y del despliegue se consulta allí. Los informes y trazas de navegador están en `test-results/`, excluidos de Git, y se conservan temporalmente en los artefactos de CI. No contienen pruebas con personas ni micrófonos físicos.

Se inspeccionó el inicio a 390 × 844 y la interfaz alemana a 1440 × 1000. La batería responsive histórica conserva sus tamaños y escenarios; no se presenta una captura como prueba de todos los dispositivos.

## Condiciones pendientes para cierre integral

1. Ejecutar el diagnóstico de [voz y micrófono](p04-device-check.html) con voces reales de cada idioma en Android, iPhone y escritorio. Comprobar pronunciación de nombres, números, fechas y mensajes dinámicos, y documentar voces ausentes. Las pruebas de síntesis simulada validan selección y eventos, no calidad audible.
2. Probar modelos locales reales: disponibilidad, descarga explícita, modo sin red, cancelación, fidelidad de traducción y rendimiento en los seis idiomas. Las APIs no están garantizadas en todos los equipos; en los no compatibles permanece el original identificado.
3. Proveer y medir una alternativa privada para texto libre cuando esas APIs no existan. Su ausencia no se sustituye por traducción ficticia ni envío de datos sin consentimiento. Las traducciones del catálogo propio siguen funcionando sin esa alternativa.
4. Ampliar el corpus independiente de órdenes y conversación en seis idiomas. Las familias finitas comprobadas no garantizan entender todas las formulaciones humanas ni traducir cualquier texto.

Los seis bloques de [PENDIENTES-PERMANENTES.md](PENDIENTES-PERMANENTES.md) se conservan. Esta revisión atiende el punto 05 pedido expresamente por la usuaria; no certifica los pendientes físicos de P03/P04 ni inicia el punto 06.
