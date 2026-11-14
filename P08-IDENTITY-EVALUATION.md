# P08 — Evaluación biométrica privada, reproducible y sin muestras en GitHub

**Herramienta de medición, NO certificación de precisión**. `scripts/evaluate-p08-identity.js` cuenta resultados de intentos de verificación usando **solo metadatos anonimizados**. No lee ni sube imágenes, vídeos, audio, nombres de personas, vectores faciales ni huellas vocales.

## Uso

1. Realizá la evaluación localmente, en dispositivos reales, **después** de informar y obtener consentimiento revocable de todas las personas participantes. Conservar los archivos biométricos fuera del repositorio y aplicar el borrado acordado.
2. Separá un conjunto de **calibración** de uno de **prueba**; no reoptimices umbrales a partir de resultados del conjunto de prueba. Anotá observaciones de personas diferentes y parecidas, contraluz, ruido, TV, audio reproducido, varias caras, modelos no disponibles y permisos denegados.
3. Duplicá `tests/fixtures/p08-synthetic-evaluation.json` a una ruta **privada fuera de GitHub** y reemplazá sus casos completamente artificiales por intentos consentidos. Marcá `"synthetic": false` solo cuando el contenido corresponda a evaluaciones verdaderamente físicas con consentimiento.
4. Ejecutá `npm run evaluate:identity -- /ruta/privada/evaluacion.json`. La salida muestra únicamente contadores agregados; nunca incluye los IDs de quienes participaron.
5. Guardá por separado el manifiesto de consentimiento y retiradas; no conserves muestras indefinidamente. Si revocan consentimiento, eliminá sus registros y no los agregues a análisis futuros.

## Formato de los intentos

Cada elemento de `trials` debe incluir exclusivamente:

- `id`: identificador de intento sin datos personales, como `test42`.
- `split`: `calibration` o `test`, nunca ambas a la vez.
- `consent`: `true` obligatorio. La herramienta rechaza casos sin consentimiento confirmado.
- `claimed`: etiqueta pseudónima de la identidad que se intenta verificar, como `p01`.
- `actual`: la identidad real verificada por el protocolo (`p01`, `p02` o `unknown` para un no registrado).
- `decision`: `accept`, `reject` o `abstain` (esta última no equivale a reconocer a alguien).
- `modality`: `face`, `voice` o `joint`.
- `scenario`: `normal`, `dim`, `backlit`, `profile`, `glasses`, `lookalike`, `similar-voice`, `noise`, `replay`, `tv`, `multi-face`, `permission` u `other`.
- `device`: `android`, `iphone`, `desktop`, `tablet` u `other`.
- `latencyMs`: tiempo transcurrido medido (no estimado).

Una aceptación es **falsa aceptación** cuando `claimed` difiere de `actual`; un rechazo o abstención es **falso rechazo** cuando `claimed` coincide con `actual`. Las métricas se computan **solo** sobre el conjunto `test`, desglosadas por modalidad, escenario y dispositivo. Se presentan intervalos Wilson del 95%, numeradores, denominadores, abstenciones y latencia mediana/p95. Si no hay denominador, la tasa aparece como `null`, nunca como cero.

## Interpretación

- Cualquier conjunto marcado sintético sirve para validar que el programa cuenta correctamente, **no** para demostrar precisión biométrica.
- Las tasas con menos de 30 intentos genuinos o impostores se marcan como muestra insuficiente; tampoco una muestra mayor garantiza representatividad o seguridad. **Cero errores en N intentos no implica una tasa real nula.**
- La herramienta nunca emite `validatedOnHardware: true` automáticamente: una persona responsable debe verificar consentimiento, dispositivos, datos de prueba independientes, sesgos e intervalos de confianza.
- La identificación biométrica a partir de voz sintetizada o reproducida puede ser vulnerada. No usarla como inicio de sesión ni acceso fuerte a datos privados.

Las pruebas automáticas usan un conjunto **inventado** de seis intentos sin personas reales. Mantener los resultados biométricos físicos y cualquier consentimiento identificable fuera de GitHub; solo compartir resultados agregados adecuadamente anonimizados.
