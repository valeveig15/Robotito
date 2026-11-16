# P29 — Especies, alimentación, camaleón y preguntas sobre sí mismo
Fecha: 16/11/2026

## Datos y lenguaje
`species-knowledge.js` mantiene los mismos 50 IDs del catálogo. Cada uno tiene datos acotados de hábitat natural, dieta, familia/grupo relacionado, curiosidad y emoji para un alimento ilustrativo. Los textos de hábitat, dieta, familia y curiosidad están expresados en los seis idiomas de la aplicación. Las respuestas son amplias por especie para no inventar datos específicos de una raza o individuo.

Las preguntas hechas directamente por voz o chat usan el mismo flujo de diálogo. Reconoce identidad, hábitat, dieta, parientes, hábitos/curiosidades y origen del programa. El avatar es un personaje **animado**: no un ejemplar real. Robotito como programa fue creado en **Uruguay**; esto no se confunde con el hábitat zoológico. Los personajes ficticios (robot y unicornio) y los dinosaurios extintos se describen sin atribuirles un hábitat real actual. Se evita secuestrar preguntas académicas no dirigidas al avatar.

## Alimentación segura ilustrativa
El botón **Alimentar** elige un alimento por el avatar, en vez de la frutilla genérica: ejemplos panda 🎋, oso polar 🐟, perro 🥣, camaleón 🦗, robot ⚡. Los cinco avatares SVG originales del punto 28 también muestran el alimento en el mismo escenario. Las ofertas directas que identifica `feedingOffer` solo producen una acción de alimentación si la categoría se corresponde con la dieta **ilustrada**; ante chocolate, alcohol o alimento no apropiado, Robotito **no** baja el medidor de hambre ni finge aceptarlo. No debe tomarse como asesoramiento veterinario ni autorización de alimentar fauna silvestre.

## Camaleón
Se modifica únicamente el SVG del camaleón según emoción interna: normal verde, felicidad más viva, tristeza azulada, enojo rojizo, susto/vergüenza tintados, somnolencia suave. Sin destellos abruptos y con `prefers-reduced-motion` que quita la transición. La expresión de otros avatares se conserva.

## Pruebas
- `npm run test:p29`: cobertura de los 50 avatares, seis idiomas, seis preguntas por avatar, orígenes, negativas y alimentación.
- `npm run test:p29:browser`: chat, pregunta sobre hábitat y Uruguay, alimento panda, cambio de color en camaleón, rechazo de alimento y otros avatares.
- `npm run test:ci`: regresión completa.
- Persisten pendientes de aceptación física: teléfonos Android/iPhone, lectores de pantalla, color y desempeño en diferentes pantallas y comparación visual por persona. Las pruebas automáticas no equivalen a certificación biológica o veterinaria.

**Se conserva «Chocar los cinco» y la separación completa entre mundo visual y chat inferior.**