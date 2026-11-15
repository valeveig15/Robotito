# P11 — Reglas personalizadas «si/cuando X, hacé Y»

**Estado: motor declarativo seguro integrado en una rama, con CI pendiente.**

## Comportamiento

- Regla por frase exacta: «Si digo hola robotito, decí buen día». El texto se normaliza sin tildes/mayúsculas al comparar el disparador, pero se conserva literalmente el mensaje de respuesta.
- Regla por reloj local: «Todos los días a las 14:30 decime estudiar». Como máximo se ejecuta una vez por fecha local, y solo mientras Robotito esté visible y el perfil correspondiente activo.
- No hay reglas ejecutables arbitrarias: las acciones permitidas son únicamente decir un mensaje literal. No se puede borrar contenido, editar perfiles, activar cámara, modificar permisos, navegar, ejecutar JavaScript ni lanzar nuevas órdenes automáticamente.
- Cada regla corresponde al propietario que la creó y se puede cancelar desde el panel. La orden de cancelar todas las reglas de un perfil pide confirmación humana.
- Se limita el total a 40 instrucciones locales, la longitud de mensajes a 240 caracteres y disparadores a 90. No se permiten respuestas idénticas al disparador.
- Se conserva «Chocar los cinco» como función manual independiente del motor de reglas, sin atribuir interacciones a visitantes sin consentimiento.

## Pruebas y limitaciones

- `tests/p10-p11-temporal-rules-regression.js` comprueba disparadores, normalización, perfiles, persistencia, caducidad y bucles.
- `tests/p10-p11-rules-browser.js` comprueba la interfaz y las órdenes guardadas, con navegadores reales y tiempo simulado.
- La lectura de reglas está limitada por el contexto activo de propietario, pero compartir un mismo perfil de navegador no constituye autenticación fuerte. El formato local no está cifrado; evitar secretos en reglas.
- La ejecución de reglas condicionadas a eventos complejos (por ejemplo «si llega una carta», «si escucha una tos real», «si llego a casa») **no se ha habilitado** sin una fuente de eventos verificable y consentimiento pertinente.
- Solo se procesan frases si llegan al diálogo normal: en Modo Clase se preserva la política de que el audio de clases no ejecuta órdenes. No hay escucha en segundo plano.
- Pendiente: validación de los seis idiomas con hablantes reales, robustez frente a cambios de horario/husos/DST, coordinación entre pestañas y validación en Android/iPhone.

**No usar el resultado de la CI como prueba de voz o biometría real.**
