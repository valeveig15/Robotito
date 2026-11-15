# P16/P17 — autorización y colaboración: núcleo de dominio

**Estado: núcleo de reglas propuesto en la rama de P16/P17, SIN servicio desplegado ni sincronización real.**

## P16 — compartir solo memorias académicas seleccionadas

`collaboration-domain.js` incluye validación de alcance por clase, tema o materia, roles `read` y `write`, revocación por revisión (CAS), y una lista blanca de campos exportables (`class-line`, `class-summary`, `academic-material`). No se permite compartir por esta ruta rasgos faciales, huellas vocales, recuerdos personales, configuraciones de perfil ni blobs de audio. El receptor no autorizado y el receptor revocado no tienen acceso en la política.

**No es autenticación.** El módulo exige una identidad previamente validada por un servidor de confianza; el marcador `source: trusted-server-auth` es solo el contrato interno de entrada. **Nunca se debe aceptar un objeto `actor` proporcionado por el navegador como prueba de identidad.**

Para completar P16 hacen falta: servidor autenticado real (OIDC/passkeys), almacenamiento multiusuario y cifrado, ACL calculadas **en cada lectura y escritura** en el backend, selector UI por sesión/tema/materia con confirmación, invitaciones verificadas, publicación/sincronización de nuevo material con versiones, revocación que impida lecturas futuras, auditoría sin datos privados y pruebas de red caída. Eliminar un acceso no puede borrar copias que terceros hayan guardado previamente; la interfaz debe informarlo.

## P17 — grupos, chat y entregas

El módulo incluye roles `admin`/`editor`/`reader`, pertenencia y revocación, chat con límite de texto, revisión optimista para evitar sobrescrituras, edición de fecha por participantes autorizados, preferencia explícita de notificaciones y cálculo de franjas locales `morning`/`afternoon`/`evening` durante los siete días previos. Genera claves de idempotencia para impedir duplicados en un despachador real.

**No entrega mensajes ni avisos.** Faltan base de datos transaccional, servicio de tiempo real, autenticación, invitaciones, moderación y retención de mensajes, vista de entregas, scheduler persistente y notificaciones push/permisos reales por dispositivo, gestión de husos y estados offline. Sin esos componentes no se puede afirmar chat compartido ni avisos con página cerrada.

## Regresiones

`npm run test:p16-p17` cubre usuario autorizado/no autorizado, lectura vs escritura, biometría fuera de exportación, revocación, roles y conflictos, fechas inválidas, opt-in, límites horarios y claves de recordatorio.

No habilitar una interfaz que dé a entender que el usuario está compartiendo contenido mientras el backend siga ausente. Las pruebas de políticas no sustituyen tests entre dos cuentas reales, en dos dispositivos, con revocación y pérdida de conexión.
