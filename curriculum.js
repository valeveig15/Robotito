// Robotito — base curricular de referencia
// Referencia principal: DGES, malla y programas vigentes 2026.
// Se usa como vocabulario de apoyo y control de coherencia para transcripciones.
// NO reemplaza el material real de clase: los apuntes cargados y la clase escuchada tienen prioridad.

window.ROBOTITO_CURRICULUM = {
  label: "2.º EMS — Ciencia y Tecnología (Uruguay, 2026)",
  note: "Equivalente actual más cercano a lo que tradicionalmente se llama primer año de Científico.",
  sources: [
    {
      title: "Malla curricular DGES 2026",
      url: "https://www.dges.edu.uy/comunicacion/noticias/secundaria-anuncia-malla-curricular-vigente-ano-lectivo-2026"
    },
    {
      title: "Programas de asignaturas DGES — revisión 2026",
      url: "https://dges.edu.uy/propuesta-educativa/programas-de-asignatura"
    },
    {
      title: "2° EMS Ciencia y Tecnología — Matemática CTM",
      url: "https://www.dges.edu.uy/sites/default/files/Planes_programas/2026/Matematica/EMS/EMS%20CT-%20Matem%C3%A1tica%20CTM%202%C2%BAA%C3%B1o.pdf"
    },
    {
      title: "2° EMS Ciencia y Tecnología — Biología",
      url: "https://www.dges.edu.uy/sites/default/files/Planes_programas/2026/Biologia/EMS/EMS%20Ciencia%20y%20Tecnolog%C3%ADa-%20Biolog%C3%ADa%202%C2%BA.pdf"
    }
  ],
  subjects: {
    "Matemática": {
      aliases: ["matematica","matemáticas","math"],
      terms: [
        "función","dominio","imagen","recorrido","raíz","ordenada","crecimiento","decrecimiento",
        "máximo","mínimo","punto crítico","simetría","periodicidad","límite","asíntota",
        "polinomio","función polinómica","función racional","función exponencial","función logarítmica",
        "función trigonométrica","seno","coseno","tangente","radian","radián","grados",
        "círculo trigonométrico","identidad trigonométrica","ángulo complementario","ángulo suplementario",
        "geometría analítica","plano cartesiano","coordenada","distancia entre dos puntos","punto medio",
        "recta","pendiente","paralelismo","perpendicularidad","circunferencia","círculo","radio","diámetro",
        "centro","cuerda","secante","tangente a la circunferencia","ecuación canónica","ecuación general",
        "completar cuadrados","poliedro","poliedro convexo","tetraedro","hexaedro","prisma",
        "recta y plano","planos paralelos","planos perpendiculares","sección plana","teorema de Pitágoras"
      ],
      facts: [
        "La ecuación canónica de una circunferencia de centro (h,k) y radio r es (x-h)² + (y-k)² = r².",
        "Para pasar de una ecuación general de circunferencia a la forma canónica se puede completar cuadrados.",
        "Una recta tangente a una circunferencia es perpendicular al radio trazado al punto de tangencia.",
        "En el círculo trigonométrico, seno y coseno pueden interpretarse como coordenadas del punto asociado al ángulo.",
        "La identidad fundamental trigonométrica es sen²(α) + cos²(α) = 1."
      ]
    },
    "Matemática CTM": {
      aliases: ["matematica ctm","ctm","matematica cientifica"],
      terms: [
        "trigonometría","círculo trigonométrico","radianes","seno","coseno","tangente",
        "identidades trigonométricas","funciones trigonométricas","geometría del espacio",
        "poliedros convexos","rectas en el espacio","planos en el espacio","secciones planas",
        "paralelismo","perpendicularidad","teorema de Pitágoras"
      ]
    },
    "Física": {
      aliases: ["fisica","física"],
      terms: [
        "magnitud","unidad","sistema internacional","vector","escalar","posición","desplazamiento","distancia",
        "velocidad","rapidez","aceleración","movimiento","movimiento rectilíneo","gráfico posición tiempo",
        "gráfico velocidad tiempo","fuerza","masa","peso","inercia","leyes de Newton","acción y reacción",
        "trabajo","energía","energía cinética","energía potencial","potencia","conservación de la energía",
        "cantidad de movimiento","impulso","choque","colisión","presión","densidad","gravedad",
        "campo","electricidad","carga eléctrica","corriente","tensión","resistencia"
      ]
    },
    "Química": {
      aliases: ["quimica","química"],
      terms: [
        "materia","sustancia","mezcla","elemento","compuesto","átomo","molécula","ion","catión","anión",
        "protón","neutrón","electrón","número atómico","masa atómica","isótopo","tabla periódica",
        "grupo","período","enlace químico","enlace iónico","enlace covalente","polaridad",
        "mol","masa molar","cantidad de sustancia","solución","soluto","solvente","concentración",
        "reacción química","reactivo","producto","ecuación química","balanceo","estequiometría",
        "ácido","base","pH","oxidación","reducción","energía química"
      ]
    },
    "Biología": {
      aliases: ["biologia","biología"],
      terms: [
        "biología aplicada","ciencia","tecnología","sociedad","ambiente","método científico",
        "investigación científica","biotecnología","bioética","bioinformática","bioestadística",
        "célula","membrana","citoplasma","núcleo","ADN","ARN","proteína","gen","genoma",
        "replicación","transcripción","traducción","expresión génica","mutación",
        "enzima","metabolismo","biología molecular","organismo","salud","enfermedad"
      ],
      facts: [
        "El ADN almacena información genética; el ARN participa en distintos procesos vinculados con su expresión.",
        "Las proteínas cumplen funciones estructurales, enzimáticas, de transporte, señalización y muchas otras.",
        "La biotecnología aplica conocimientos biológicos para desarrollar procesos, productos o soluciones."
      ]
    },
    "Literatura": {
      aliases: ["literatura"],
      terms: [
        "narrador","narración","personaje","protagonista","antagonista","trama","conflicto","tema","motivo",
        "poesía","poema","verso","estrofa","métrica","rima","metáfora","comparación","personificación",
        "teatro","dramaturgia","acto","escena","diálogo","acotación","género literario","contexto",
        "interpretación","argumentación","voz lírica","intertextualidad"
      ]
    },
    "Filosofía": {
      aliases: ["filosofia","filosofía"],
      terms: [
        "argumento","premisa","conclusión","validez","verdad","falacia","concepto","problema filosófico",
        "conocimiento","epistemología","ética","moral","libertad","responsabilidad","justicia",
        "identidad","persona","sociedad","razón","experiencia","pensamiento crítico"
      ]
    },
    "Educación Ciudadana": {
      aliases: ["educacion ciudadana","ciudadania","ciudadanía"],
      terms: [
        "ciudadanía","derecho","deber","norma","Estado","democracia","participación","Constitución",
        "derechos humanos","institución","poder","libertad","igualdad","responsabilidad","convivencia"
      ]
    },
    "Comunicación Visual y Diseño": {
      aliases: ["comunicacion visual","comunicación visual","dibujo","diseño"],
      terms: [
        "punto","línea","plano","forma","figura","fondo","composición","proporción","escala","perspectiva",
        "proyección","sombra","luz","color","contraste","textura","geometría","representación visual",
        "dibujo técnico","croquis","sistema de representación"
      ]
    },
    "Inglés": {
      aliases: ["ingles","inglés","english"],
      terms: [
        "reading","writing","listening","speaking","grammar","vocabulary","argument","opinion",
        "present simple","present continuous","past simple","present perfect","future","conditional",
        "passive voice","reported speech","relative clause"
      ]
    }
  }
};
