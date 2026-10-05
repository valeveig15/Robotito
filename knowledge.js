// Robotito — common knowledge, Spanish + English.
// Intentionally limited to stable, everyday facts. Academic/class material remains separate.
(function(){
  const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9ñ\s]/g," ").replace(/\s+/g," ").trim();
  const has=(t,arr)=>arr.some(x=>t.includes(norm(x)));
  const langOf=t=>{
    const n=norm(t);
    const en=["what","how","which","where","who","does","do ","is ","are ","many","name","sound","legs","animal","largest","planet","capital","water","body","days","months","hello","good"];
    const es=["que","como","cual","donde","quien","cuantos","nombre","sonido","patas","animal","mamifero","planeta","capital","agua","cuerpo","dias","meses","hola","buenas"];
    const e=en.filter(x=>n.includes(x)).length, s=es.filter(x=>n.includes(x)).length;
    return e>s?"en":"es";
  };
  const answer=(es,en,lang)=>lang==="en"?en:es;

  const animals=[
    {id:"dog",es:["perro","perra"],en:["dog"],sound:["ladra","barks"],legs:4,type:["mamífero","mammal"]},
    {id:"cat",es:["gato","gata"],en:["cat"],sound:["maúlla","meows"],legs:4,type:["mamífero","mammal"]},
    {id:"cow",es:["vaca"],en:["cow"],sound:["muge","moos"],legs:4,type:["mamífero","mammal"]},
    {id:"horse",es:["caballo","yegua"],en:["horse"],sound:["relincha","neighs"],legs:4,type:["mamífero","mammal"]},
    {id:"pig",es:["cerdo","chancho"],en:["pig"],sound:["gruñe","oinks"],legs:4,type:["mamífero","mammal"]},
    {id:"sheep",es:["oveja"],en:["sheep"],sound:["bala","bleats"],legs:4,type:["mamífero","mammal"]},
    {id:"goat",es:["cabra"],en:["goat"],sound:["bala","bleats"],legs:4,type:["mamífero","mammal"]},
    {id:"lion",es:["leon","león"],en:["lion"],sound:["ruge","roars"],legs:4,type:["mamífero","mammal"]},
    {id:"wolf",es:["lobo"],en:["wolf"],sound:["aúlla","howls"],legs:4,type:["mamífero","mammal"]},
    {id:"elephant",es:["elefante"],en:["elephant"],sound:["barrita o trompetea","trumpets"],legs:4,type:["mamífero","mammal"]},
    {id:"duck",es:["pato"],en:["duck"],sound:["grazna","quacks"],legs:2,type:["ave","bird"]},
    {id:"chicken",es:["gallina","pollo"],en:["chicken","hen"],sound:["cacarea","clucks"],legs:2,type:["ave","bird"]},
    {id:"rooster",es:["gallo"],en:["rooster"],sound:["canta","crows"],legs:2,type:["ave","bird"]},
    {id:"frog",es:["rana"],en:["frog"],sound:["croa","croaks"],legs:4,type:["anfibio","amphibian"]},
    {id:"bee",es:["abeja"],en:["bee"],sound:["zumba","buzzes"],legs:6,type:["insecto","insect"]},
    {id:"spider",es:["arana","araña"],en:["spider"],sound:["no tiene un sonido cotidiano característico","does not have a familiar everyday call"],legs:8,type:["arácnido","arachnid"]},
    {id:"octopus",es:["pulpo"],en:["octopus"],sound:["no tiene un sonido cotidiano característico","does not have a familiar everyday call"],legs:8,type:["molusco","mollusk"]},
    {id:"penguin",es:["pinguino","pingüino"],en:["penguin"],sound:["emite graznidos y llamadas","makes braying and calling sounds"],legs:2,type:["ave","bird"]},
    {id:"whale",es:["ballena"],en:["whale"],sound:["emite cantos y llamadas","makes songs and calls"],legs:0,type:["mamífero","mammal"]},
    {id:"dolphin",es:["delfin","delfín"],en:["dolphin"],sound:["emite silbidos y clics","makes whistles and clicks"],legs:0,type:["mamífero","mammal"]},
    {id:"tiger",es:["tigre"],en:["tiger"],sound:["ruge","roars"],legs:4,type:["mamífero","mammal"]},
    {id:"bear",es:["oso"],en:["bear"],sound:["gruñe","growls"],legs:4,type:["mamífero","mammal"]},
    {id:"giraffe",es:["jirafa"],en:["giraffe"],sound:["emite sonidos suaves y poco frecuentes","makes quiet, infrequent sounds"],legs:4,type:["mamífero","mammal"]},
    {id:"owl",es:["buho","búho","lechuza"],en:["owl"],sound:["ulula","hoots"],legs:2,type:["ave","bird"]},
    {id:"eagle",es:["aguila","águila"],en:["eagle"],sound:["emite chillidos","screeches"],legs:2,type:["ave","bird"]},
    {id:"snake",es:["serpiente","culebra"],en:["snake"],sound:["sisea","hisses"],legs:0,type:["reptil","reptile"]},
    {id:"turtle",es:["tortuga"],en:["turtle"],sound:["puede emitir pequeños sonidos","can make quiet sounds"],legs:4,type:["reptil","reptile"]},
    {id:"butterfly",es:["mariposa"],en:["butterfly"],sound:["no tiene un sonido cotidiano característico","does not have a familiar everyday call"],legs:6,type:["insecto","insect"]},
    {id:"ant",es:["hormiga"],en:["ant"],sound:["no tiene un sonido cotidiano audible para nosotros","does not have a familiar everyday sound for us"],legs:6,type:["insecto","insect"]}
  ];

  const countries=[
    {es:["uruguay"],en:["uruguay"],capital:["Montevideo","Montevideo"]},
    {es:["argentina"],en:["argentina"],capital:["Buenos Aires","Buenos Aires"]},
    {es:["brasil"],en:["brazil"],capital:["Brasilia","Brasília"]},
    {es:["chile"],en:["chile"],capital:["Santiago","Santiago"]},
    {es:["paraguay"],en:["paraguay"],capital:["Asunción","Asunción"]},
    {es:["francia"],en:["france"],capital:["París","Paris"]},
    {es:["espana","españa"],en:["spain"],capital:["Madrid","Madrid"]},
    {es:["italia"],en:["italy"],capital:["Roma","Rome"]},
    {es:["reino unido"],en:["united kingdom","uk"],capital:["Londres","London"]},
    {es:["estados unidos","eeuu"],en:["united states","usa","us"],capital:["Washington D. C.","Washington, D.C."]},
    {es:["japon","japón"],en:["japan"],capital:["Tokio","Tokyo"]},
    {es:["china"],en:["china"],capital:["Pekín","Beijing"]},
    {es:["australia"],en:["australia"],capital:["Canberra","Canberra"]},
    {es:["canada","canadá"],en:["canada"],capital:["Ottawa","Ottawa"]},
    {es:["mexico","méxico"],en:["mexico"],capital:["Ciudad de México","Mexico City"]}
  ];

  const direct=[
    [["mamifero mas grande","mamífero más grande","largest mammal"],"La ballena azul es el mamífero más grande conocido.","The blue whale is the largest known mammal."],
    [["animal terrestre mas grande","animal terrestre más grande","largest land animal"],"El elefante africano es el animal terrestre más grande.","The African elephant is the largest land animal."],
    [["animal mas alto","animal más alto","tallest animal"],"La jirafa es el animal más alto.","The giraffe is the tallest animal."],
    [["animal terrestre mas rapido","animal terrestre más rápido","fastest land animal"],"El guepardo es el animal terrestre más rápido.","The cheetah is the fastest land animal."],
    [["ave mas grande","ave más grande","largest bird"],"El avestruz es el ave más grande.","The ostrich is the largest bird."],
    [["planeta mas grande","planeta más grande","largest planet"],"Júpiter es el planeta más grande del Sistema Solar.","Jupiter is the largest planet in the Solar System."],
    [["planeta mas pequeno","planeta más pequeño","smallest planet"],"Mercurio es el planeta más pequeño del Sistema Solar.","Mercury is the smallest planet in the Solar System."],
    [["planeta rojo","red planet"],"Marte es conocido como el planeta rojo.","Mars is known as the Red Planet."],
    [["planeta mas cerca del sol","planeta más cerca del sol","closest planet to the sun"],"Mercurio es el planeta más cercano al Sol.","Mercury is the closest planet to the Sun."],
    [["cuantos planetas","how many planets"],"Hay ocho planetas en el Sistema Solar.","There are eight planets in the Solar System."],
    [["satelite de la tierra","satélite de la tierra","earth satellite","earth's moon"],"La Luna es el satélite natural de la Tierra.","The Moon is Earth's natural satellite."],
    [["estrella del sistema solar","star of the solar system"],"El Sol es la estrella del Sistema Solar.","The Sun is the star of the Solar System."],
    [["tierra gira alrededor","earth orbit"],"La Tierra gira alrededor del Sol.","Earth orbits the Sun."],
    [["luna gira alrededor","moon orbit"],"La Luna gira alrededor de la Tierra.","The Moon orbits Earth."],
    [["agua hierve","punto de ebullicion del agua","water boil","boiling point of water"],"A nivel del mar, el agua hierve aproximadamente a 100 °C.","At sea level, water boils at about 100 °C."],
    [["agua se congela","punto de congelacion del agua","water freeze","freezing point of water"],"El agua pura se congela aproximadamente a 0 °C.","Pure water freezes at about 0 °C."],
    [["formula del agua","water formula"],"La fórmula química del agua es H₂O.","The chemical formula of water is H₂O."],
    [["respiramos","gas respiramos","what gas do humans breathe","what do we breathe"],"Respiramos aire y nuestro cuerpo utiliza oxígeno para la respiración celular.","We breathe air, and our bodies use oxygen for cellular respiration."],
    [["cuantos huesos","how many bones"],"Un adulto suele tener 206 huesos.","An adult human typically has 206 bones."],
    [["cuantos dientes","how many teeth"],"Un adulto suele tener 32 dientes si conserva las cuatro muelas del juicio.","An adult typically has 32 teeth if all four wisdom teeth are present."],
    [["cuantas camaras corazon","cuántas cámaras corazón","heart chambers"],"El corazón humano tiene cuatro cámaras: dos aurículas y dos ventrículos.","The human heart has four chambers: two atria and two ventricles."],
    [["organo mas grande","órgano más grande","largest organ"],"La piel es el órgano más grande del cuerpo humano.","The skin is the largest organ of the human body."],
    [["cuantos pulmones","how many lungs"],"Los humanos normalmente tenemos dos pulmones.","Humans normally have two lungs."],
    [["cuantos dias semana","días semana","days in a week"],"Una semana tiene siete días.","A week has seven days."],
    [["cuantos meses","months in a year"],"Un año tiene doce meses.","A year has twelve months."],
    [["cuantos dias ano","cuántos días año","days in a year"],"Un año común tiene 365 días; un año bisiesto tiene 366.","A common year has 365 days; a leap year has 366."],
    [["cuantos continentes","how many continents"],"En el modelo más usado internacionalmente se cuentan siete continentes.","In the most widely used international model, there are seven continents."],
    [["oceano mas grande","océano más grande","largest ocean"],"El océano Pacífico es el océano más grande.","The Pacific Ocean is the largest ocean."],
    [["montana mas alta","montaña más alta","highest mountain"],"El monte Everest es la montaña más alta sobre el nivel del mar.","Mount Everest is the highest mountain above sea level."],
    [["rio mas largo","río más largo","longest river"],"La longitud del Nilo y del Amazonas es muy cercana y depende del criterio de medición; suelen disputarse el primer lugar.","The Nile and Amazon are very close in measured length, and which is longest depends on the measurement method."],
    [["cuantos lados triangulo","triangle sides"],"Un triángulo tiene tres lados.","A triangle has three sides."],
    [["cuantos lados cuadrado","square sides"],"Un cuadrado tiene cuatro lados iguales.","A square has four equal sides."],
    [["cuantos lados pentagono","pentagon sides"],"Un pentágono tiene cinco lados.","A pentagon has five sides."],
    [["cuantos lados hexagono","hexagon sides"],"Un hexágono tiene seis lados.","A hexagon has six sides."],
    [["grados circulo","degrees in a circle"],"Una vuelta completa tiene 360 grados.","A full circle has 360 degrees."],
    [["mitad de","half of"],null,null],
    [["colores arcoiris","colores arco iris","rainbow colors"],"Tradicionalmente se describen siete colores: rojo, naranja, amarillo, verde, azul, añil y violeta.","Traditionally, seven colors are named: red, orange, yellow, green, blue, indigo, and violet."],
    [["colores primarios luz","primary colors of light"],"En luz, los colores primarios son rojo, verde y azul: RGB.","For light, the primary colors are red, green, and blue: RGB."],
    [["velocidad de la luz","speed of light"],"La luz viaja en el vacío a unos 299.792 kilómetros por segundo.","Light travels through a vacuum at about 299,792 kilometers per second."],
    [["por que cielo azul","porque cielo azul","why is the sky blue"],"El cielo se ve azul porque la atmósfera dispersa la luz azul del Sol más eficazmente que gran parte de la luz de longitudes de onda mayores.","The sky looks blue because the atmosphere scatters blue sunlight more strongly than much of the longer-wavelength light."],
    [["por que hojas verdes","porque hojas verdes","why are leaves green"],"Muchas hojas se ven verdes porque la clorofila absorbe principalmente luz roja y azul y refleja más luz verde.","Many leaves look green because chlorophyll absorbs mainly red and blue light and reflects more green light."],
    [["que necesitan plantas","what do plants need"],"Las plantas necesitan, según la especie y el contexto, agua, luz, dióxido de carbono y nutrientes minerales para crecer.","Plants need, depending on species and conditions, water, light, carbon dioxide, and mineral nutrients to grow."],
    [["que produce fotosintesis","what does photosynthesis produce"],"La fotosíntesis usa luz para producir compuestos orgánicos a partir de dióxido de carbono y agua, liberando oxígeno como subproducto.","Photosynthesis uses light to make organic compounds from carbon dioxide and water, releasing oxygen as a byproduct."],
    [["cuanto es pi","valor de pi","what is pi"],"Pi es aproximadamente 3,14159.","Pi is approximately 3.14159."],
    [["cuantos minutos hora","minutes in an hour"],"Una hora tiene 60 minutos.","An hour has 60 minutes."],
    [["cuantos segundos minuto","seconds in a minute"],"Un minuto tiene 60 segundos.","A minute has 60 seconds."],
    [["cuantas horas dia","hours in a day"],"Un día tiene 24 horas.","A day has 24 hours."],
    [["sentidos humanos","cinco sentidos","human senses","five senses"],"Tradicionalmente se enseñan cinco sentidos: vista, oído, olfato, gusto y tacto, aunque el cuerpo humano percibe también otras clases de estímulos.","Traditionally, five senses are taught: sight, hearing, smell, taste, and touch, although the human body senses other kinds of information too."],
    [["color sangre","blood color"],"La sangre humana es roja; su tono cambia según cuánto oxígeno transporta.","Human blood is red; its shade changes depending on how much oxygen it carries."],
    [["corazon bombea","corazón bombea","what does the heart do"],"El corazón bombea sangre para que circule por el cuerpo.","The heart pumps blood around the body."],
    [["para que sirven pulmones","para qué sirven pulmones","what do lungs do"],"Los pulmones permiten el intercambio de gases: incorporamos oxígeno y eliminamos dióxido de carbono.","The lungs exchange gases: we take in oxygen and remove carbon dioxide."],
    [["para que sirve cerebro","para qué sirve cerebro","what does the brain do"],"El cerebro coordina gran parte de la actividad del cuerpo y participa en percepción, movimiento, memoria, lenguaje, emociones y pensamiento.","The brain coordinates much of the body's activity and is involved in perception, movement, memory, language, emotions, and thought."],
    [["cuantos ojos","how many eyes"],"Los seres humanos normalmente tenemos dos ojos.","Humans normally have two eyes."],
    [["cuantos dedos mano","fingers on a hand"],"Una mano humana normalmente tiene cinco dedos, contando el pulgar.","A human hand normally has five digits, including the thumb."],
    [["cuantos dedos pies","toes on two feet"],"Dos pies humanos normalmente tienen diez dedos en total.","Two human feet normally have ten toes in total."],
    [["animal con ocho patas","animal tiene ocho patas","animal has eight legs"],"Las arañas tienen ocho patas.","Spiders have eight legs."],
    [["insectos seis patas","insects six legs","how many legs insects"],"Los insectos tienen seis patas.","Insects have six legs."],
    [["arana insecto","araña insecto","is a spider an insect"],"No. Una araña es un arácnido, no un insecto.","No. A spider is an arachnid, not an insect."],
    [["ballena pez","is a whale a fish"],"No. Una ballena es un mamífero.","No. A whale is a mammal."],
    [["delfin pez","delfín pez","is a dolphin a fish"],"No. Un delfín es un mamífero.","No. A dolphin is a mammal."],
    [["pinguino vuela","pingüino vuela","can penguins fly"],"Los pingüinos no vuelan; sus alas están adaptadas para nadar.","Penguins cannot fly; their wings are adapted for swimming."],
    [["aves tienen plumas","birds have feathers"],"Sí. Las plumas son una característica propia de las aves.","Yes. Feathers are a defining feature of birds."],
    [["peces respiran","how do fish breathe"],"La mayoría de los peces obtiene oxígeno del agua mediante branquias.","Most fish obtain oxygen from water using gills."],
    [["por que gatos ronronean","porque gatos ronronean","why do cats purr"],"Los gatos pueden ronronear en situaciones de bienestar, contacto social y también en algunos momentos de estrés o dolor.","Cats can purr when content and social, but also in some situations involving stress or pain."],
    [["por que perros mueven cola","porque perros mueven cola","why do dogs wag their tails"],"Los perros mueven la cola como parte de su comunicación; el significado depende de la postura, dirección y contexto.","Dogs wag their tails as part of communication; the meaning depends on posture, direction, and context."],
    [["que comen pandas","what do pandas eat"],"Los pandas gigantes comen principalmente bambú, aunque biológicamente pertenecen al orden de los carnívoros.","Giant pandas eat mainly bamboo, although biologically they belong to the order Carnivora."],
    [["donde viven pandas","where do pandas live"],"Los pandas gigantes silvestres viven en regiones montañosas de China.","Wild giant pandas live in mountainous regions of China."],
    [["tierra redonda","forma tierra","shape of earth","is earth round"],"La Tierra es aproximadamente esférica, ligeramente achatada en los polos.","Earth is approximately spherical, slightly flattened at the poles."],
    [["por que hay dia noche","porque hay dia noche","why day and night"],"El día y la noche se producen porque la Tierra gira sobre su eje.","Day and night occur because Earth rotates on its axis."],
    [["cuanto tarda tierra sol","earth orbit time"],"La Tierra tarda aproximadamente un año en completar una órbita alrededor del Sol.","Earth takes about one year to complete an orbit around the Sun."],
    [["cuanto tarda tierra girar","earth rotation time"],"La Tierra tarda aproximadamente 24 horas en completar una rotación respecto del ciclo solar diario.","Earth takes about 24 hours to complete a rotation relative to the daily solar cycle."],
    [["que causa lluvia","por que llueve","porque llueve","why does it rain"],"Llueve cuando gotas de agua en las nubes crecen lo suficiente como para caer por gravedad.","Rain falls when water droplets in clouds grow large enough to fall under gravity."],
    [["que es trueno","what is thunder"],"El trueno es el sonido producido por la rápida expansión del aire calentado por un rayo.","Thunder is the sound produced by the rapid expansion of air heated by lightning."],
    [["rayo antes trueno","lightning before thunder"],"Vemos el relámpago antes de oír el trueno porque la luz viaja muchísimo más rápido que el sonido.","We see lightning before hearing thunder because light travels much faster than sound."],
    [["estaciones ano","estaciones del año","seasons of the year"],"Las cuatro estaciones tradicionales son primavera, verano, otoño e invierno.","The four traditional seasons are spring, summer, autumn or fall, and winter."],
    [["por que estaciones","porque estaciones","why seasons"],"Las estaciones se deben principalmente a la inclinación del eje de la Tierra mientras orbita alrededor del Sol.","Seasons are caused mainly by the tilt of Earth's axis as Earth orbits the Sun."],
    [["continentes nombres","nombres continentes","name the continents"],"En el modelo de siete continentes: África, Antártida, Asia, Europa, América del Norte, América del Sur y Oceanía/Australia.","In the seven-continent model: Africa, Antarctica, Asia, Europe, North America, South America, and Australia/Oceania."],
    [["oceanos nombres","océanos nombres","name the oceans"],"Se suelen distinguir cinco océanos: Pacífico, Atlántico, Índico, Ártico y Austral.","Five oceans are commonly recognized: Pacific, Atlantic, Indian, Arctic, and Southern."],
    [["capital uruguay","uruguay capital"],"La capital de Uruguay es Montevideo.","The capital of Uruguay is Montevideo."],
    [["idioma brasil","language of brazil"],"El idioma oficial de Brasil es el portugués.","The official language of Brazil is Portuguese."],
    [["moneda uruguay","uruguay currency"],"La moneda de Uruguay es el peso uruguayo.","Uruguay's currency is the Uruguayan peso."],
    [["cuanto es docena","what is a dozen"],"Una docena son 12 unidades.","A dozen is 12 items."],
    [["cuanto es centena","what is a hundred"],"Una centena son 100 unidades.","One hundred is 100 units."],
    [["par o impar","even or odd"],"Un número par es divisible entre 2 sin resto; uno impar no.","An even number is divisible by 2 with no remainder; an odd number is not."],
    [["triangulo angulos","triangle angles"],"En geometría euclidiana, los ángulos interiores de un triángulo suman 180 grados.","In Euclidean geometry, the interior angles of a triangle add up to 180 degrees."],
    [["cuadrado angulos","square angles"],"Un cuadrado tiene cuatro ángulos rectos de 90 grados.","A square has four right angles of 90 degrees."],
    [["rectangulo lados","rectangle sides"],"Un rectángulo tiene cuatro lados y cuatro ángulos rectos; los lados opuestos son iguales.","A rectangle has four sides and four right angles; opposite sides are equal."],
    [["que es mamifero","qué es mamífero","what is a mammal"],"Un mamífero es un vertebrado cuyo grupo se caracteriza, entre otras cosas, por tener pelo en alguna etapa y por alimentar a las crías con leche producida por glándulas mamarias.","A mammal is a vertebrate whose group is characterized, among other things, by having hair at some stage and feeding young with milk produced by mammary glands."],
    [["que es planeta","qué es planeta","what is a planet"],"Un planeta es un cuerpo celeste que orbita una estrella y, en términos generales, tiene suficiente masa para adquirir una forma casi redonda.","A planet is a celestial body that orbits a star and generally has enough mass to become nearly round."],
    [["que es estrella","qué es estrella","what is a star"],"Una estrella es una enorme esfera de plasma que produce energía mediante fusión nuclear; el Sol es una estrella.","A star is a huge sphere of plasma that produces energy through nuclear fusion; the Sun is a star."],
    [["que es luna","qué es luna","what is a moon"],"Una luna es un satélite natural que orbita un planeta u otro cuerpo mayor.","A moon is a natural satellite that orbits a planet or another larger body."],
    [["que es volcan","qué es volcán","what is a volcano"],"Un volcán es una estructura geológica por la que pueden salir magma, gases y otros materiales desde el interior de un cuerpo planetario.","A volcano is a geological structure through which magma, gases, and other material can emerge from inside a planetary body."],
    [["que es fosil","qué es fósil","what is a fossil"],"Un fósil es un resto, impresión o señal de un organismo del pasado preservado en materiales geológicos.","A fossil is a preserved remain, impression, or trace of an organism from the past."],
    [["por que flotan barcos","porque flotan barcos","why do boats float"],"Un barco flota cuando el empuje del agua puede equilibrar su peso; su forma permite desplazar suficiente agua.","A boat floats when the buoyant force from displaced water can balance its weight; its shape helps it displace enough water."],
    [["por que hielo flota","porque hielo flota","why does ice float"],"El hielo flota porque es menos denso que el agua líquida.","Ice floats because it is less dense than liquid water."],
    [["por que vemos colores","porque vemos colores","why do we see colors"],"Vemos colores porque distintas longitudes de onda de la luz estimulan de forma diferente los receptores de nuestros ojos y el cerebro interpreta esas señales.","We see colors because different wavelengths of light stimulate receptors in our eyes differently and the brain interprets those signals."]
  ];

  const playfulSounds={
    dog:["¡Guau guau!","Woof woof!"],
    cat:["¡Miau miau!","Meow meow!"],
    cow:["¡Muuu!","Moo!"],
    horse:["¡Hiiiiii!","Neigh!"],
    pig:["¡Oinc oinc!","Oink oink!"],
    sheep:["¡Beeee!","Baa!"],
    goat:["¡Meeee!","Maa!"],
    lion:["¡Grrrrr… ROAR!","Grrrr… ROAR!"],
    tiger:["¡Grrrrr… ROAR!","Grrrr… ROAR!"],
    wolf:["¡Auuuuuu!","Awoooo!"],
    elephant:["¡Prrrrruuu!","Pawooo!"],
    duck:["¡Cuac cuac!","Quack quack!"],
    chicken:["¡Cloc cloc!","Cluck cluck!"],
    rooster:["¡Kikirikí!","Cock-a-doodle-doo!"],
    frog:["¡Croac croac!","Ribbit!"],
    bee:["¡Bzzzzzz!","Bzzzz!"],
    owl:["¡Uuuh, uuuh!","Hoot hoot!"],
    snake:["¡Sssssss!","Hissss!"]
  };

  function findAnimal(t){
    return animals.find(a=>has(t,[...a.es,...a.en]));
  }
  function answerQuery(input,forcedLang){
    const t=norm(input), lang=forcedLang==="en"||forcedLang==="es"?forcedLang:langOf(input);

    // Animal sounds
    if(has(t,["que sonido hace","que ruido hace","como hace","como suena","que dice","imitame","imita un","hace el","hace un","what sound does","what noise does","what does a","what does the","how does a","imitate a"])){
      const a=findAnimal(t);
      if(a){
        const playful=playfulSounds[a.id];
        if(playful)return lang==="en"?playful[1]:playful[0];
        return answer(`El ${a.es[0]} ${a.sound[0]}.`,`A ${a.en[0]} ${a.sound[1]}.`,lang);
      }
    }

    // Animal legs
    if(has(t,["cuantas patas","cuántas patas","how many legs"])){
      const a=findAnimal(t);
      if(a)return answer(`Un ${a.es[0]} tiene ${a.legs} ${a.legs===1?"pata":"patas"}.`,`A ${a.en[0]} has ${a.legs} ${a.legs===1?"leg":"legs"}.`,lang);
    }

    // Animal category
    if(has(t,["es mamifero","es mamífero","is a mammal","es un ave","is a bird","que tipo de animal","what kind of animal"])){
      const a=findAnimal(t);
      if(a)return answer(`El ${a.es[0]} es un ${a.type[0]}.`,`A ${a.en[0]} is a ${a.type[1]}.`,lang);
    }

    // Capitals
    if(has(t,["capital de","capital of","cual es la capital","what is the capital"])){
      const c=countries.find(x=>has(t,[...x.es,...x.en]));
      if(c)return answer(`La capital es ${c.capital[0]}.`,`The capital is ${c.capital[1]}.`,lang);
    }

    // Very basic arithmetic phrasing.
    let m=t.match(/(?:cuanto es|cuanto da|what is)\s*(-?\d+(?:\.\d+)?)\s*([+x*\/\-])\s*(-?\d+(?:\.\d+)?)/);
    if(m){
      const a=Number(m[1]),b=Number(m[3]),op=m[2];
      let v=op==="+"?a+b:op==="-"?a-b:(op==="x"||op==="*")?a*b:b!==0?a/b:null;
      if(v===null)return answer("No se puede dividir entre cero.","You cannot divide by zero.",lang);
      return answer(`Da ${Number(v.toFixed(8))}.`,`It is ${Number(v.toFixed(8))}.`,lang);
    }

    // Half of a number
    m=t.match(/(?:mitad de|half of)\s*(-?\d+(?:\.\d+)?)/);
    if(m){
      const v=Number(m[1])/2;
      return answer(`La mitad es ${Number(v.toFixed(8))}.`,`Half is ${Number(v.toFixed(8))}.`,lang);
    }

    for(const [patterns,es,en] of direct){
      if(es&&has(t,patterns))return answer(es,en,lang);
    }
    return null;
  }

  window.ROBOTITO_COMMON_KNOWLEDGE={
    answer:answerQuery,
    detectLanguage:langOf,
    animals,
    countries
  };
})();