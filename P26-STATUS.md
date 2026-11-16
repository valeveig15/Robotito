# P26 — Divisor horizontal y desplazamiento del panel derecho

**Estado: funcionalidad de software en rama y validación de CI pendiente; validación de tacto físico pendiente.**

En pantallas de escritorio de más de 900 px, el divisor `#layoutResizer` ajusta los dos anchos dentro de la misma cuadrícula. El mínimo de escena es 260 px y el de panel 245 px, permitiendo desplazar más la separación que la anterior restricción simétrica de 330 px. El movimiento se limita al contenedor para no producir desbordamiento horizontal. Se conserva la proporción elegida localmente, se restaura al recargar y se ajusta al cambiar el tamaño de ventana. Si el almacenamiento está deshabilitado, el ajuste aún funciona durante la sesión.

Se admiten mouse, puntero táctil y teclado: flechas con pasos de 24 px o 60 px con Mayús, Inicio/Fin para extremos y Enter/Espacio o doble clic para restablecer. Cancelar un puntero vuelve a la posición anterior, sin guardar un arrastre interrumpido. El separador expone valores accesibles por ARIA. En móvil se oculta y la estructura vuelve a una columna.

El panel derecho desplaza su contenido internamente y conserva las pestañas en una banda superior fija y desplazable horizontalmente cuando el panel es estrecho. No desplaza al avatar ni su escena al hacer scroll del panel.

Regresiones incluidas en `npm run test:p26` (cálculo, extremos, teclado, cancelación, almacenamiento y móvil) y `npm run test:p26:browser` (geometría, arrastre, persistencia, scroll, pestañas visibles y cambio móvil).

**Límites de cierre total:** se requiere verificación humana en Chrome/Firefox/WebKit de diferentes densidades de píxeles, touch real en tabletas y lectores de pantalla de escritorio. No confundir la emulación Playwright con una prueba con dedos en un dispositivo físico. Preservar «Chocar los cinco» y el resto del panel.
