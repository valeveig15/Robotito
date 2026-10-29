# Punto 08 — protocolo de aceptación de identidad (sin datos biométricos públicos)

**Estado:** pendiente de ensayo físico. La CI prueba decisiones de seguridad con vectores sintéticos y navegadores; no mide tasas de identificación sobre participantes reales.

## Objetivo

Confirmar que Robotito **no atribuya nombres, cumpleaños, recuerdos, conversaciones ni transcripciones** a una persona equivocada cuando hay semejanza familiar, voces confundibles, iluminación variable o participantes fuera de cámara.

La selección de una cara conocida no autoriza por sí sola a atribuirle una frase de voz. Sin voz verificable, la transcripción se trata como **local/anónima**. Un perfil con menos de tres muestras faciales válidas o menos de tres impresiones de voz no es suficiente para autenticar automáticamente mediante esa modalidad: hace falta registrar más muestras con permiso.

## Ensayos consentidos

| Caso | Prueba física | Condición de aprobación |
|---|---|---|
| I01 | Registrar a una persona con frente y giros de cabeza | Consentimiento visible, varias muestras, registro local |
| I02 | Probar otro nombre con la misma cara | Rechazo sin modificar el perfil existente |
| I03 | Actualizar nombre ya registrado usando la cara de otra persona | Rechazo y datos anteriores intactos |
| I04 | Dos familiares de apariencia semejante | No permitir identificación automática si los puntajes son ambiguos |
| I05 | Voces semejantes de dos personas | Evitar asignación ante coincidencia insuficiente o margen pequeño |
| I06 | Cara conocida visible mientras habla alguien fuera de cámara | No atribuir la frase al dueño de la cara si no se verificó la voz |
| I07 | Una cara desaparece y entra otra | Invalidar identidad previa antes de exponer recuerdos o cumpleaños |
| I08 | Varias caras simultáneas | No elegir arbitrariamente a la primera |
| I09 | Luz tenue, contraluz, costado, gafas y cambios de aspecto | Medir rechazos y errores; no inventar identidad |
| I10 | Sonido de TV, ruido y reproducción de grabación | No autenticar al hablante con seguridad injustificada |
| I11 | Retirar consentimiento durante el registro | No agregar datos ni continuar capturando muestras |
| I12 | Denegar/cancelar permisos de cámara o micrófono | No crear un perfil ficticio |
| I13 | Registro con una única muestra antigua | No autorizar identidad sin nuevo registro suficiente |
| I14 | Visitante pseudónimo sin registro que luego se presenta | No fusionar su historial sin decisión explícita, reversible y verificable |
| I15 | Repetir pruebas en Android y iPhone reales | Documentar bloqueos del navegador o faltas de permisos por dispositivo |

**Anotar únicamente**: ID del caso, navegador/versión, dispositivo, PASS/FAIL/BLOCKED/NOT RUN, número de intentos, rechazos correctos e incorrectos, confusiones entre perfiles y consentimiento. Mantener los archivos faciales/vocales privados y fuera de GitHub. Usar conjuntos de calibración y prueba **separados**, al menos dos personas distintas y, para semejanza, participantes reales que hayan consentido participar.

## Métricas de aceptación

- Tasa de falsa aceptación = impostores aceptados / intentos impostores elegibles.
- Tasa de falso rechazo = personas correctas rechazadas / intentos genuinos elegibles.
- Rechazos ante incertidumbre y tiempo de respuesta por navegador/dispositivo.
- Para cada resultado reportar numerador, denominador, intervalos de incertidumbre y condiciones acústicas/lumínicas. **Cero errores en una muestra pequeña no significa error cero.**

**Limitación abierta:** los umbrales empleados en las regresiones son conservadores, **no calibrados** en una muestra real. Los perfiles de visitantes no registrados no se vinculan automáticamente; el flujo consentido de asociación y desvinculación reversible exige implementación y validación independientes.

«¡Chocar los cinco!» debe permanecer funcional.
