# P08 — Identificación rigurosa de personas registradas

**Auditoría de software:** 14/11/2026. **Estado:** EN PROGRESO; la aceptación biométrica física no está demostrada. Ver [P08-IDENTITY-ACCEPTANCE.md](P08-IDENTITY-ACCEPTANCE.md).

## Implementado y comprobable

- Registro facial con hasta 12 muestras de cuatro poses y registro de varias impresiones de voz, solo tras aceptar el consentimiento. El registro se cancela ante pista cortada, permiso denegado, video congelado, cambio de sesión o revocación.
- Reconocimiento facial con varias muestras válidas, calidad mínima de detección y consenso temporal; rechaza caras desconocidas o varias caras y similitudes ambiguas. Los números son umbrales **provisionales** y no calibración biométrica.
- Reconocimiento vocal sin confiar en el rostro como segunda muestra: tres o más huellas, margen de similitud frente a otras personas y abstención ante incertidumbre.
- **P08 (nuevo):** al detectarse una voz confirmada de una persona distinta de la cara que estaba visible, se invalida inmediatamente la identidad facial anterior antes de procesar la frase. No se hereda su memoria, vínculo ni cumpleaños.
- **P08 (nuevo):** los saludos personalizados y la activación de cumpleaños desde el reconocimiento facial se condicionan a una señal vocal reciente e independiente de la misma persona. La cara sola no autoriza un saludo con nombre.
- **P08 (nuevo):** las correcciones manuales del hablante de una transcripción cambian su etiqueta, pero no añaden huellas vocales ni entrenan silenciosamente el modelo biométrico.
- **P08 (nuevo):** el registro compara nuevas huellas de voz contra los otros perfiles registrados, y rechaza voces ambiguamente parecidas antes de almacenar nombres/huellas. El consentimiento nuevo deja metadatos de fecha y alcance en el perfil.
- **P08 (nuevo):** opción visible para eliminar un perfil biométrico tras doble confirmación. Borra datos claramente asociados, incluidos recuerdos tipados por propietario, registros históricos inequívocos de persona/cumpleaños, audios vinculados, relación con otros registros y huellas que figuraban en las líneas de clase etiquetadas con ese hablante. Conserva anónimos y otros propietarios. Invalida el punto de recuperación para evitar reaparición accidental.
- Mantiene las acciones y animación de «Chocar los cinco». No fusiona automáticamente visitantes pseudónimos con perfiles registrados.

## Límites importantes de privacidad

- El nombre, edad y datos de las personas guardadas se encuentran dentro del almacenamiento del navegador; compartir un mismo perfil de navegador **no constituye separación de acceso autenticada**. La comparación facial/vocal **no es autenticación fuerte**, no tiene detección de presentación falsa (vídeo, reproducción de audio, máscaras) ni certificación de precisión.
- La eliminación segura se aplica a datos asociados por propietario o a registros explícitos de perfil. Texto libre de terceros, respaldos JSON previamente descargados, datos de otros navegadores y memorias anónimas que mencionan a una persona no se atribuyen ni borran automáticamente para evitar una fusión equivocada. Revisar y eliminar manualmente esos datos o respaldos si corresponde. No prometer eliminación criptográfica física de bloques del disco desde JavaScript.
- Los perfiles antiguos que no tienen evidencia de consentimiento fechada siguen sujetos a nueva verificación para modificar su nombre/huellas. La nueva marca de consentimiento solo se agrega tras un registro afirmativo; no representa una prueba retroactiva.
- El sistema de voz usa características acústicas locales rudimentarias; un puntaje alto puede provenir de voces parecidas o reproducciones. Se impide atribuir con incertidumbre, pero la precisión necesita experimentos.
- Las asociaciones entre historial pseudónimo y registro se dejan para P09 o un flujo consentido dedicado; no se implementó fusión automática de recuerdos.

## Validaciones automatizadas exigidas

- `npm run test:p08`: pruebas de rechazo de perfiles cruzados, nombres repetidos, revocación, memoria de hablante, envejecimiento de evidencia y ausencia de entrenamiento no consentido.
- `npm run test:p08:browser`: Playwright real con IndexedDB, confirmación de borrado, audios/recuerdos/cumpleaños propios, otras personas, anónimos y punto de restauración.
- `npm run test:ci` en Chromium, `npm run test:browser:extended` en Firefox y WebKit, además de matrices generales.
- GitHub Actions debe pasar **en el HEAD exacto del PR** antes de integrar; repetir validación posterior a integración cuando corresponda.

## Bloqueadores de cierre físico

1. Recopilar registros de consentimiento revocables y muestras de evaluación **privadas** (no subir caras, voces ni vectores a GitHub).
2. Evaluar al menos dos personas y varios pares familiares o de voces parecidas mediante un conjunto de calibración independiente de otro de prueba. Medir falsos positivos, falsos negativos, casos ambiguos y abstenciones con numeradores/denominadores e intervalos.
3. Probar con varias personas visibles, cambios de luz/gafas/ángulos, cambio de hablante, sonidos de TV, reproducciones y denegaciones de permisos. Calibrar umbrales según resultados, no solo asumir que los valores actuales bastan.
4. Repetir I01–I15 de [P08-IDENTITY-ACCEPTANCE.md](P08-IDENTITY-ACCEPTANCE.md) en Android, iPhone y escritorio reales. Registrar versiones/condiciones y fallos sin exportar material biométrico.
5. Auditar identificaciones y datos privados en el resto de comandos de la interfaz cuando varios usuarios comparten el dispositivo; introducir autenticación real si se necesita confidencialidad fuerte.

**No marcar P08 como completo solo porque CI haya aprobado casos sintéticos.** La validación física y la calibración aún deben realizarse antes de considerarlo confiable para identificar personas parecidas.
