# Robotito — reglas obligatorias para agentes y colaboradores

Repositorio: https://github.com/valeveig15/Robotito

## Principio: implementación progresiva, integrada y comprobada

Cada pedido de mejora debe producir cambios reales y pequeños en el código del repositorio, no una lista de ideas ni módulos desconectados. La unidad de trabajo es un **incremento funcional que compila, se conecta con el comportamiento existente y tiene pruebas**.

1. **Inspeccionar primero.** Leer `main`, los módulos involucrados, sus rutas de ejecución y las pruebas existentes. Registrar qué funciona, qué está incompleto y qué falta. Evitar repetir funcionalidades.
2. **Dividir el pedido.** Si es extenso, separarlo en etapas pequeñas con criterios de aceptación y una mejora observable en cada etapa. Nunca acumular 26 funcionalidades para integrarlas al final.
3. **Crear rama desde `main`.** Usar nombres descriptivos; no reutilizar una rama antigua desfasada. Evitar cambios ajenos al incremento.
4. **Implementar e integrar inmediatamente.** Conectar módulos con la entrada, las acciones, la interfaz, el almacenamiento y los permisos que correspondan. Evitar archivos huérfanos, rutas paralelas y parches basados en frases exactas.
5. **Probar ANTES de avanzar al incremento siguiente.** Añadir regresión para cada fallo reproducido, pruebas de comportamiento negativo y, según el riesgo, unitarias, de integración, generativas, combinatorias y de navegador/dispositivos. Conservar pruebas históricas.
6. **Revisar compatibilidad y datos.** Probar lectura, escritura, migración, eliminación, recarga y fallos de permisos donde corresponda. No borrar datos anteriores sin verificarlos. No atribuir como "completo" lo que depende de un navegador, hardware o modelo no disponible.
7. **Subir commits pequeños.** Mensajes descriptivos; mantener cada commit coherente y fácil de revertir. Abrir PR hacia `main` y ejecutar CI en el HEAD que se pretende integrar.
8. **Fusionar solo con pruebas satisfactorias.** Si aparecen fallos, corregirlos y volver a ejecutar las verificaciones relevantes. No forzar PR con conflictos ni fusionar código sin verificar. La comprobación manual y de dispositivos específicos debe reconocerse como pendiente si no pudo hacerse.
9. **Informar con precisión.** Al cerrar cada incremento, comunicar funcionalidad efectivamente integrada, archivos modificados, pruebas ejecutadas y resultados reales, enlaces al commit/PR y problemas pendientes. No inventar cifras ni afirmar que un resultado de CI cubre más casos que los ejecutados.

## Comandos y puertas de calidad

- `npm run test:core`: regresión del núcleo.
- `npm run test:planner`: planificación semántica.
- `npm run test:memory`: recuperación y aislamiento de memoria.
- `npm run test:generative`: tres semillas reproducibles.
- `npm run test:browser`: pruebas de Chromium y responsive.
- `npm run test:ci`: toda la batería disponible.

La CI del repositorio está configurada en `.github/workflows/regression.yml`, para PR a `main` y cambios en `main`. Para cambios solo de documentación, validar enlaces y coherencia, y también consultar el resultado de CI antes de integrarlos. Para cambios de código, las pruebas del incremento deben incluir los caminos de usuario afectados, no solamente la ejecución de las pruebas históricas.

## Criterios de arquitectura

- Priorizar comprensión semántica/contextual y políticas comunes frente a listas infinitas de `if` por frases.
- Reutilizar servicios compartidos de idioma, tiempo, entidades, contexto, fuentes y almacenamiento.
- Ante incertidumbre o ausencia de datos/permiso, informar la limitación sin inventar.
- Respetar privacidad, consentimiento y límites de identidad/voz; no filtrar recuerdos de otra persona.
- Los ejemplos dados en pedidos son **casos de prueba iniciales**, no un universo cerrado de variantes.
- Separar resultados **verificados** de mejoras **parciales** o pendientes.

## Checklist al cerrar una etapa

- [ ] Inspección del código previo; sin duplicados innecesarios.
- [ ] Cambios pequeños incorporados a la aplicación real.
- [ ] Caso positivo, negativo y regresión del error añadidos cuando correspondan.
- [ ] Pruebas ejecutadas y resultado documentado; CI del último HEAD revisada.
- [ ] Migración/compatibilidad comprobadas si hay datos o API existentes.
- [ ] Commit, rama y PR/merge identificados por sus enlaces.
- [ ] Limitaciones y siguientes etapas identificadas sin declarar trabajo pendiente como terminado.

> Este documento establece el **procedimiento de desarrollo**. No declara que ninguno de los 82 pedidos funcionales esté automáticamente implementado. Cada pedido deberá auditarse y resolverse en incrementos verificables.

## Plan de 82 pedidos (vigente desde 27/10/2026)

Consultar [ROADMAP_82.md](ROADMAP_82.md) para el orden y progreso verificable. No iniciar el pedido siguiente hasta que se cierre íntegramente el anterior. **No eliminar «Chocar los cinco»:** la creadora confirmó expresamente que pertenece a los avatares aprobados; debe conservarse en voz, botones y animaciones (PR #18).
