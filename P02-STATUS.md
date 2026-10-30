# Punto 02 — pruebas reproducibles e integración continua

Revisión: 30/10/2026. Requisito: punto 02 de `Robotito_82_pedidos_completos-1.docx`.

Se conservan las regresiones históricas, Playwright, los generadores, las semillas 17/42/99 y las pruebas después de cada incremento. El criterio es ejecutar escenarios positivos, negativos, fallos, persistencia, interrupciones, entornos adversos y tamaños de pantalla; no afirmar ausencia universal de errores.

## Integridad de las pruebas generativas

- Una propiedad mal escrita en `ROBOTITO_REPLAY_PROPERTY` ya no devuelve éxito con cero casos ejecutados. También se rechazan índices vacíos, fraccionarios o sin propiedad.
- Un resultado `false`, un error del generador y una excepción del reductor conservan el fallo original y sus datos de reproducción. El reductor consume como máximo 64 candidatos.
- Las matrices rechazan filas inválidas, valores no reproducibles y límites de generación inválidos. Distinguen ejecuciones, filas distintas y duplicados.
- Los informes JSON de propiedades guardan semilla, escala, revisión, resultado, cobertura efectivamente ejecutada y contraejemplo. GitHub Actions los conserva durante 14 días también si falla una prueba.
- `npm run test:p02` verifica 42 contratos de integridad, incluida la ejecución del comando real con una propiedad inexistente. Las tres semillas de propiedades pasan: 4.300 casos generados por semilla. No se suman como formulaciones únicas.

## Ampliación en curso

La matriz principal de estados de la aplicación todavía se ejecuta solo en Chromium; Firefox y WebKit verifican el diagnóstico multimedia. La siguiente etapa amplía la matriz real a los tres motores y sus informes, sin sustituir las pruebas físicas por cambios de viewport.

Las seis áreas de pendientes permanentes permanecen en `PENDIENTES-PERMANENTES.md`; «Chocar los cinco» se conserva y forma parte de las regresiones.
