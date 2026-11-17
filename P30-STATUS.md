# P30 — Gestos y acciones

**Requisito vigente:** la decisión posterior de la creadora prevalece sobre la redacción antigua del pedido: «Chocar los cinco» se conserva en botones, voz y animaciones de los 50 avatares. «Abrazar» no se crea como función especial: puede existir un intercambio cariñoso conversacional.

**Auditoría:** los seis botones ya existían, al igual que reacciones `speciesAct` y el puente visual de cinco SVG. El personaje genérico no respondía a un clic y las órdenes gestuales estaban incompletas.

**Incremento:** el gesto directo sobre el avatar genérico ahora equivale a acariciar; los cinco SVG aprobados mantienen su propia ruta de clic al mismo botón, sin doble activación. Las órdenes directas admiten acariciar, alimentar, jugar, asustar, molestar y chocar los cinco en varios idiomas, sin capturar negaciones, definiciones ni citas. Todo usa las funciones actuales: sin duplicar estados ni almacenamiento.

**Regresión:** `npm run test:p30-p32` y `npm run test:p30-p32:browser`, junto con P28. Prueba de ratón/navegador no sustituye pulsaciones físicas Android/iPhone; no se atribuye soporte de gestos de manos en cámara sin calibración real.
