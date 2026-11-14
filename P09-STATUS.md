# P09 — Memoria privada de visitantes sin registrar

Estado: **software en revisión; validación humana y hardware pendiente**.

## Comportamiento

- Una cara desconocida se sigue de forma efímera durante la sesión. Sin consentimiento no se guarda huella facial ni se fabrica un nombre.
- El panel Personas permite que la persona visible consienta conservar un vínculo seudónimo entre visitas. Reutiliza la captura de 12 muestras y la protección de sesiones del punto 4.
- Solo se persisten tres centroides faciales reducidos, una identificación interna aleatoria y cuatro indicadores de vínculo, dentro de una bóveda local AES-256-GCM con contraseña voluntaria, PBKDF2-SHA256 y sal/IV aleatorios. Sin la contraseña no se pueden abrir las visitas después de reiniciar.
- La bóveda se conserva oculta del listado de Personas. No contiene fotos, audios, nombres ni conversaciones; el proceso no envía muestras a servidores.
- Una persona recién registrada puede marcar voluntariamente que desea revisar un vínculo, confirmar su coincidencia y escribir VINCULAR. Solamente se mezcla un porcentaje moderado de su relación afectiva; no se adjudican conversaciones anónimas.
- Acariciar, jugar, alimentar, asustar, pinchar y chocar los cinco actualizan lentamente el vínculo solo cuando hay una cara confirmada y se ha aceptado atribuir esas interacciones.
- El borrado requiere BORRAR VISITAS, retira la bóveda cifrada e invalida el punto de recuperación del navegador para no resucitar datos eliminados.

## Pruebas y límites

- npm run test:p09 y npm run test:p09:browser cubren consentimiento, cifrado, error de contraseña, colisiones de caras, persistencia, reencuentro sintético, enfriamiento, asociación revisada y eliminación.
- La detección biométrica no es autenticación fuerte; no hay defensa certificada ante fotos, máscaras ni replay. Los umbrales están pendientes de calibración con muestras independientes.
- Los controles de interacción no prueban qué persona tocó físicamente el teléfono; por eso se exige casilla adicional y solo una cara visible.
- No existen pruebas reales de reencuentros semanas después con personas, familiares parecidos, varias caras, iluminación adversa, Android/iPhone y escritorio. La CI simula rostros y permisos.
- Las copias descargadas anteriormente no desaparecen automáticamente cuando se elimina la bóveda. El cifrado no protege datos una vez desbloqueados en la página.

**Conclusión:** integración de software en progreso, sin declaración de cierre físico. Conservar Chocar los cinco y los pendientes anteriores.
