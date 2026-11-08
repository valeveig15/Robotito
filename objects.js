// Robotito — common object catalog for recognition hints and "show me" requests.
(function(){
  const items = [
    ["book","📚",["libro","libros"],["book","books"],"lectura"],
    ["notebook","📓",["cuaderno","libreta"],["notebook"],"estudio"],
    ["pencil","✏️",["lapiz","lápiz"],["pencil"],"estudio"],
    ["pen","🖊️",["lapicera","boligrafo","bolígrafo"],["pen"],"estudio"],
    ["eraser","🧽",["goma de borrar","goma"],["eraser"],"estudio"],
    ["ruler","📏",["regla"],["ruler"],"estudio"],
    ["backpack","🎒",["mochila"],["backpack"],"estudio"],
    ["scissors","✂️",["tijera","tijeras"],["scissors"],"estudio"],
    ["calculator","🧮",["calculadora"],["calculator"],"estudio"],
    ["globe","🌐",["globo terraqueo","globo terráqueo"],["globe"],"estudio"],
    ["phone","📱",["celular","telefono","teléfono","movil","móvil"],["phone","cell phone","smartphone"],"tecnología"],
    ["laptop","💻",["laptop","computadora portatil","computadora portátil"],["laptop"],"tecnología"],
    ["computer","🖥️",["computadora","ordenador","pc"],["computer","desktop computer"],"tecnología"],
    ["keyboard","⌨️",["teclado"],["keyboard"],"tecnología"],
    ["mouse","🖱️",["mouse","raton","ratón"],["mouse"],"tecnología"],
    ["headphones","🎧",["auriculares","audifonos","audífonos"],["headphones"],"tecnología"],
    ["camera","📷",["camara","cámara"],["camera"],"tecnología"],
    ["television","📺",["television","televisión","tele"],["television","tv"],"tecnología"],
    ["remote","🎛️",["control remoto","mando"],["remote control"],"tecnología"],
    ["watch","⌚",["reloj","reloj de pulsera"],["watch"],"accesorio"],
    ["clock","🕒",["reloj de pared"],["clock"],"hogar"],
    ["lamp","💡",["lampara","lámpara"],["lamp"],"hogar"],
    ["chair","🪑",["silla"],["chair"],"hogar"],
    ["table","🛋️",["mesa"],["table"],"hogar"],
    ["sofa","🛋️",["sofa","sofá","sillon","sillón"],["sofa","couch"],"hogar"],
    ["bed","🛏️",["cama"],["bed"],"hogar"],
    ["door","🚪",["puerta"],["door"],"hogar"],
    ["window","🪟",["ventana"],["window"],"hogar"],
    ["mirror","🪞",["espejo"],["mirror"],"hogar"],
    ["key","🔑",["llave"],["key"],"hogar"],
    ["bottle","🧴",["botella"],["bottle"],"hogar"],
    ["cup","☕",["taza"],["cup","mug"],"cocina"],
    ["glass","🥛",["vaso"],["glass"],"cocina"],
    ["plate","🍽️",["plato"],["plate"],"cocina"],
    ["fork","🍴",["tenedor"],["fork"],"cocina"],
    ["knife","🔪",["cuchillo"],["knife"],"cocina"],
    ["spoon","🥄",["cuchara"],["spoon"],"cocina"],
    ["pan","🍳",["sarten","sartén"],["frying pan","pan"],"cocina"],
    ["pot","🍲",["olla"],["pot"],"cocina"],
    ["fridge","🧊",["heladera","refrigerador"],["refrigerator","fridge"],"cocina"],
    ["microwave","📦",["microondas"],["microwave"],"cocina"],
    ["apple","🍎",["manzana"],["apple"],"comida"],
    ["banana","🍌",["banana","platano","plátano"],["banana"],"comida"],
    ["orange","🍊",["naranja"],["orange"],"comida"],
    ["lemon","🍋",["limon","limón"],["lemon"],"comida"],
    ["strawberry","🍓",["frutilla","fresa"],["strawberry"],"comida"],
    ["grapes","🍇",["uvas","uva"],["grapes"],"comida"],
    ["watermelon","🍉",["sandia","sandía"],["watermelon"],"comida"],
    ["pear","🍐",["pera"],["pear"],"comida"],
    ["peach","🍑",["durazno","melocoton","melocotón"],["peach"],"comida"],
    ["pineapple","🍍",["anana","ananá","piña"],["pineapple"],"comida"],
    ["carrot","🥕",["zanahoria"],["carrot"],"comida"],
    ["tomato","🍅",["tomate"],["tomato"],"comida"],
    ["potato","🥔",["papa","patata"],["potato"],"comida"],
    ["bread","🍞",["pan"],["bread"],"comida"],
    ["cheese","🧀",["queso"],["cheese"],"comida"],
    ["egg","🥚",["huevo"],["egg"],"comida"],
    ["pizza","🍕",["pizza"],["pizza"],"comida"],
    ["hamburger","🍔",["hamburguesa"],["hamburger","burger"],"comida"],
    ["cookie","🍪",["galletita","galleta"],["cookie"],"comida"],
    ["cake","🎂",["torta","pastel"],["cake"],"comida"],
    ["icecream","🍦",["helado"],["ice cream"],"comida"],
    ["dog","🐶",["perro","perra"],["dog"],"animal"],
    ["cat","🐱",["gato","gata"],["cat"],"animal"],
    ["rabbit","🐰",["conejo","coneja"],["rabbit"],"animal"],
    ["hamster","🐹",["hamster","hámster"],["hamster"],"animal"],
    ["mouse-animal","🐭",["raton animal","ratón animal"],["mouse animal"],"animal"],
    ["cow","🐮",["vaca"],["cow"],"animal"],
    ["pig","🐷",["cerdo","chancho"],["pig"],"animal"],
    ["horse","🐴",["caballo","yegua"],["horse"],"animal"],
    ["sheep","🐑",["oveja"],["sheep"],"animal"],
    ["goat","🐐",["cabra"],["goat"],"animal"],
    ["lion","🦁",["leon","león"],["lion"],"animal"],
    ["tiger","🐯",["tigre"],["tiger"],"animal"],
    ["bear","🐻",["oso"],["bear"],"animal"],
    ["panda","🐼",["panda","oso panda"],["panda"],"animal"],
    ["monkey","🐵",["mono"],["monkey"],"animal"],
    ["elephant","🐘",["elefante"],["elephant"],"animal"],
    ["giraffe","🦒",["jirafa"],["giraffe"],"animal"],
    ["zebra","🦓",["cebra"],["zebra"],"animal"],
    ["deer","🦌",["ciervo","venado"],["deer"],"animal"],
    ["fox","🦊",["zorro"],["fox"],"animal"],
    ["wolf","🐺",["lobo"],["wolf"],"animal"],
    ["chicken","🐔",["gallina","pollo"],["chicken","hen"],"animal"],
    ["rooster","🐓",["gallo"],["rooster"],"animal"],
    ["duck","🦆",["pato"],["duck"],"animal"],
    ["penguin","🐧",["pinguino","pingüino"],["penguin"],"animal"],
    ["owl","🦉",["buho","búho","lechuza"],["owl"],"animal"],
    ["eagle","🦅",["aguila","águila"],["eagle"],"animal"],
    ["frog","🐸",["rana"],["frog"],"animal"],
    ["snake","🐍",["serpiente","culebra"],["snake"],"animal"],
    ["turtle","🐢",["tortuga"],["turtle"],"animal"],
    ["fish","🐟",["pez","pescado"],["fish"],"animal"],
    ["dolphin","🐬",["delfin","delfín"],["dolphin"],"animal"],
    ["whale","🐋",["ballena"],["whale"],"animal"],
    ["octopus","🐙",["pulpo"],["octopus"],"animal"],
    ["butterfly","🦋",["mariposa"],["butterfly"],"animal"],
    ["bee","🐝",["abeja"],["bee"],"animal"],
    ["ladybug","🐞",["mariquita","vaquita de san antonio"],["ladybug"],"animal"],
    ["spider","🕷️",["arana","araña"],["spider"],"animal"],
    ["ant","🐜",["hormiga"],["ant"],"animal"],
    ["car","🚗",["auto","coche","carro"],["car"],"transporte"],
    ["bus","🚌",["omnibus","ómnibus","bus","autobus","autobús"],["bus"],"transporte"],
    ["train","🚆",["tren"],["train"],"transporte"],
    ["airplane","✈️",["avion","avión"],["airplane","plane"],"transporte"],
    ["bicycle","🚲",["bicicleta","bici"],["bicycle","bike"],"transporte"],
    ["motorcycle","🏍️",["moto","motocicleta"],["motorcycle"],"transporte"],
    ["boat","⛵",["barco","bote"],["boat"],"transporte"],
    ["truck","🚚",["camion","camión"],["truck"],"transporte"],
    ["ball","⚽",["pelota","balon","balón"],["ball"],"juego"],
    ["soccerball","⚽",["pelota de futbol","pelota de fútbol"],["soccer ball","football"],"juego"],
    ["basketball","🏀",["pelota de basquetbol","pelota de básquetbol","pelota de basket"],["basketball"],"juego"],
    ["tennis","🎾",["pelota de tenis"],["tennis ball"],"juego"],
    ["guitar","🎸",["guitarra"],["guitar"],"música"],
    ["piano","🎹",["piano","teclado musical"],["piano"],"música"],
    ["drum","🥁",["tambor","bateria","batería"],["drum"],"música"],
    ["violin","🎻",["violin","violín"],["violin"],"música"],
    ["microphone","🎤",["microfono","micrófono"],["microphone"],"música"],
    ["shirt","👕",["remera","camiseta"],["shirt","t-shirt"],"ropa"],
    ["pants","👖",["pantalon","pantalón"],["pants","trousers"],"ropa"],
    ["dress","👗",["vestido"],["dress"],"ropa"],
    ["shoe","👟",["zapato","champion","champión","zapatilla"],["shoe","sneaker"],"ropa"],
    ["hat","🧢",["gorra","sombrero"],["hat","cap"],"ropa"],
    ["glasses","👓",["lentes","anteojos","gafas"],["glasses"],"accesorio"],
    ["umbrella","☂️",["paraguas"],["umbrella"],"accesorio"],
    ["toothbrush","🪥",["cepillo de dientes"],["toothbrush"],"baño"],
    ["soap","🧼",["jabon","jabón"],["soap"],"baño"],
    ["towel","🧻",["toalla"],["towel"],"baño"],
    ["flower","🌸",["flor"],["flower"],"naturaleza"],
    ["tree","🌳",["arbol","árbol"],["tree"],"naturaleza"],
    ["leaf","🍃",["hoja"],["leaf"],"naturaleza"],
    ["sun","☀️",["sol"],["sun"],"naturaleza"],
    ["moon","🌙",["luna"],["moon"],"naturaleza"],
    ["star","⭐",["estrella"],["star"],"naturaleza"],
    ["cloud","☁️",["nube"],["cloud"],"naturaleza"],
    ["rainbow","🌈",["arcoiris","arco iris"],["rainbow"],"naturaleza"],
    ["heart","❤️",["corazon","corazón"],["heart"],"símbolo"],
    ["gift","🎁",["regalo"],["gift","present"],"objeto"],
    ["candle","🕯️",["vela"],["candle"],"objeto"],
    ["balloon","🎈",["globo"],["balloon"],"objeto"],
    ["teddy","🧸",["osito","oso de peluche","peluche"],["teddy bear","stuffed bear"],"objeto"],
    ["house","🏠",["casa"],["house","home"],"lugar"],
    ["school","🏫",["escuela","colegio","liceo"],["school"],"lugar"],
    ["hospital","🏥",["hospital"],["hospital"],"lugar"],
    ["store","🏪",["tienda","almacen","almacén"],["store","shop"],"lugar"],
    ["park","🏞️",["parque"],["park"],"lugar"],
    ["beach","🏖️",["playa"],["beach"],"lugar"],
    ["mountain","⛰️",["montana","montaña"],["mountain"],"naturaleza"],
    ["volcano","🌋",["volcan","volcán"],["volcano"],"naturaleza"],
    ["fire","🔥",["fuego","llama"],["fire","flame"],"naturaleza"],
    ["snowflake","❄️",["nieve","copo de nieve"],["snow","snowflake"],"naturaleza"],
    ["snowman","☃️",["muneco de nieve","muñeco de nieve"],["snowman"],"objeto"],
    ["rocket","🚀",["cohete"],["rocket"],"espacio"],
    ["satellite","🛰️",["satelite","satélite"],["satellite"],"espacio"],
    ["planet","🪐",["planeta","saturno"],["planet","saturn"],"espacio"],
    ["earth","🌍",["tierra","planeta tierra"],["earth"],"espacio"],
    ["microscope","🔬",["microscopio"],["microscope"],"ciencia"],
    ["telescope","🔭",["telescopio"],["telescope"],"ciencia"],
    ["magnet","🧲",["iman","imán"],["magnet"],"ciencia"],
    ["testtube","🧪",["tubo de ensayo"],["test tube"],"ciencia"],
    ["dna","🧬",["adn","dna"],["dna"],"ciencia"],
    ["atom","⚛️",["atomo","átomo"],["atom"],"ciencia"],
    ["map","🗺️",["mapa"],["map"],"objeto"],
    ["compass","🧭",["brujula","brújula"],["compass"],"objeto"],
    ["calendar","📅",["calendario"],["calendar"],"objeto"],
    ["envelope","✉️",["sobre","carta"],["envelope","letter"],"objeto"],
    ["paperclip","📎",["clip","sujetapapeles"],["paperclip"],"objeto"],
    ["folder","📁",["carpeta"],["folder"],"objeto"],
    ["bell","🔔",["campana","timbre"],["bell"],"objeto"],
    ["alarm","⏰",["despertador","alarma"],["alarm clock","alarm"],"objeto"],
    ["battery","🔋",["bateria electrica","pila"],["battery"],"tecnología"],
    ["bulb","💡",["bombita","bombilla","foco"],["light bulb"],"tecnología"],
    ["plug","🔌",["enchufe"],["plug"],"tecnología"],
    ["lock","🔒",["candado"],["lock","padlock"],"objeto"],
    ["hammer","🔨",["martillo"],["hammer"],"herramienta"],
    ["wrench","🔧",["llave inglesa","llave de tuercas"],["wrench"],"herramienta"],
    ["gear","⚙️",["engranaje"],["gear"],"objeto"],
    ["cart","🛒",["carrito de compras"],["shopping cart"],"objeto"],
    ["money","💵",["dinero","billete"],["money","banknote"],"objeto"],
    ["coin","🪙",["moneda"],["coin"],"objeto"],
    ["card","💳",["tarjeta","tarjeta de credito","tarjeta de crédito"],["card","credit card"],"objeto"],
    ["crown","👑",["corona"],["crown"],"objeto"],
    ["diamond","💎",["diamante"],["diamond"],"objeto"],
    ["robot","🤖",["robot"],["robot"],"objeto"],
    ["unicorn","🦄",["unicornio"],["unicorn"],"fantasía"],
    ["dinosaur","🦖",["dinosaurio","tiranosaurio"],["dinosaur","t-rex"],"animal"],
    ["dragon","🐉",["dragon","dragón"],["dragon"],"fantasía"],
    ["crocodile","🐊",["cocodrilo"],["crocodile"],"animal"],
    ["shark","🦈",["tiburon","tiburón"],["shark"],"animal"],
    ["crab","🦀",["cangrejo"],["crab"],"animal"],
    ["lobster","🦞",["langosta marina"],["lobster"],"animal"],
    ["parrot","🦜",["loro","papagayo"],["parrot"],"animal"],
    ["flamingo","🦩",["flamenco"],["flamingo"],"animal"],
    ["swan","🦢",["cisne"],["swan"],"animal"],
    ["peacock","🦚",["pavo real"],["peacock"],"animal"],
    ["kangaroo","🦘",["canguro"],["kangaroo"],"animal"],
    ["koala","🐨",["koala"],["koala"],"animal"],
    ["sloth","🦥",["perezoso"],["sloth"],"animal"],
    ["otter","🦦",["nutria"],["otter"],"animal"],
    ["seal","🦭",["foca"],["seal"],"animal"],
    ["llama","🦙",["llama animal"],["llama"],"animal"],
    ["camel","🐪",["camello"],["camel"],"animal"],
    ["rhino","🦏",["rinoceronte"],["rhinoceros","rhino"],"animal"],
    ["hippo","🦛",["hipopotamo","hipopótamo"],["hippopotamus","hippo"],"animal"],
    ["cactus","🌵",["cactus"],["cactus"],"naturaleza"],
    ["mushroom","🍄",["hongo","seta"],["mushroom"],"naturaleza"],
    ["avocado","🥑",["palta","aguacate"],["avocado"],"comida"],
    ["corn","🌽",["choclo","maiz","maíz"],["corn"],"comida"],
    ["broccoli","🥦",["brocoli","brócoli"],["broccoli"],"comida"],
    ["cherries","🍒",["cerezas","cereza"],["cherries"],"comida"],
    ["kiwi","🥝",["kiwi"],["kiwi"],"comida"],
    ["donut","🍩",["dona","donut"],["donut"],"comida"],
    ["chocolate","🍫",["chocolate"],["chocolate"],"comida"],
    ["popcorn","🍿",["pop","pochoclo","palomitas"],["popcorn"],"comida"],
    ["sandwich","🥪",["sandwich","sándwich"],["sandwich"],"comida"],
    ["hotdog","🌭",["pancho","hot dog"],["hot dog"],"comida"],
    ["taco","🌮",["taco"],["taco"],"comida"],
    ["coffee","☕",["cafe","café"],["coffee"],"bebida"],
    ["tea","🍵",["te","té"],["tea"],"bebida"],
    ["juice","🧃",["jugo","zumo"],["juice"],"bebida"],
    ["water","💧",["agua","gota de agua"],["water","water drop"],"bebida"],
    ["triangle","🔺",["triangulo","triángulo"],["triangle"],"forma"],
    ["circle","⭕",["circulo","círculo"],["circle"],"forma"],
    ["square","🟥",["cuadrado"],["square"],"forma"],
    ["blueheart","💙",["corazon azul","corazón azul"],["blue heart"],"símbolo"],
    ["greenheart","💚",["corazon verde","corazón verde"],["green heart"],"símbolo"],
    ["yellowheart","💛",["corazon amarillo","corazón amarillo"],["yellow heart"],"símbolo"]
  ];

  // Product names for every catalogue item, in addition to the original aliases.
  const localizedNames=Object.fromEntries(`
book|livro|livre|libro|Buch
notebook|caderno|cahier|quaderno|Notizbuch
pencil|lápis|crayon|matita|Bleistift
pen|caneta|stylo|penna|Kugelschreiber
eraser|borracha|gomme|gomma|Radiergummi
ruler|régua|règle|righello|Lineal
backpack|mochila|sac à dos|zaino|Rucksack
scissors|tesoura|ciseaux|forbici|Schere
calculator|calculadora|calculatrice|calcolatrice|Taschenrechner
globe|globo terrestre|globe terrestre|mappamondo|Globus
phone|celular|téléphone|telefono|Telefon
laptop|computador portátil|ordinateur portable|portatile|Laptop
computer|computador|ordinateur|computer|Computer
keyboard|teclado|clavier|tastiera|Tastatur
mouse|mouse de computador|souris d’ordinateur|mouse del computer|Computermaus
headphones|fones de ouvido|casque audio|cuffie|Kopfhörer
camera|câmera|appareil photo|fotocamera|Kamera
television|televisão|télévision|televisione|Fernseher
remote|controle remoto|télécommande|telecomando|Fernbedienung
watch|relógio de pulso|montre|orologio da polso|Armbanduhr
clock|relógio de parede|horloge|orologio da parete|Wanduhr
lamp|lâmpada de mesa|lampe|lampada|Lampe
chair|cadeira|chaise|sedia|Stuhl
table|mesa|table|tavolo|Tisch
sofa|sofá|canapé|divano|Sofa
bed|cama|lit|letto|Bett
door|porta|porte|porta|Tür
window|janela|fenêtre|finestra|Fenster
mirror|espelho|miroir|specchio|Spiegel
key|chave|clé|chiave|Schlüssel
bottle|garrafa|bouteille|bottiglia|Flasche
cup|xícara|tasse|tazza|Tasse
glass|copo|verre|bicchiere|Glas
plate|prato|assiette|piatto|Teller
fork|garfo|fourchette|forchetta|Gabel
knife|faca|couteau|coltello|Messer
spoon|colher|cuillère|cucchiaio|Löffel
pan|frigideira|poêle|padella|Pfanne
pot|panela|casserole|pentola|Topf
fridge|geladeira|réfrigérateur|frigorifero|Kühlschrank
microwave|micro-ondas|micro-ondes|microonde|Mikrowelle
apple|maçã|pomme|mela|Apfel
banana|banana|banane|banana|Banane
orange|laranja|orange|arancia|Orange
lemon|limão|citron|limone|Zitrone
strawberry|morango|fraise|fragola|Erdbeere
grapes|uvas|raisins|uva|Trauben
watermelon|melancia|pastèque|anguria|Wassermelone
pear|pera|poire|pera|Birne
peach|pêssego|pêche|pesca|Pfirsich
pineapple|abacaxi|ananas|ananas|Ananas
carrot|cenoura|carotte|carota|Karotte
tomato|tomate|tomate|pomodoro|Tomate
potato|batata|pomme de terre|patata|Kartoffel
bread|pão|pain|pane|Brot
cheese|queijo|fromage|formaggio|Käse
egg|ovo|œuf|uovo|Ei
pizza|pizza|pizza|pizza|Pizza
hamburger|hambúrguer|hamburger|hamburger|Hamburger
cookie|biscoito|biscuit|biscotto|Keks
cake|bolo|gâteau|torta|Kuchen
icecream|sorvete|glace|gelato|Eiscreme
dog|cachorro|chien|cane|Hund
cat|gato|chat|gatto|Katze
rabbit|coelho|lapin|coniglio|Kaninchen
hamster|hamster|hamster|criceto|Hamster
mouse-animal|rato|souris animale|topo|Maus
cow|vaca|vache|mucca|Kuh
pig|porco|cochon|maiale|Schwein
horse|cavalo|cheval|cavallo|Pferd
sheep|ovelha|mouton|pecora|Schaf
goat|cabra|chèvre|capra|Ziege
lion|leão|lion|leone|Löwe
tiger|tigre|tigre|tigre|Tiger
bear|urso|ours|orso|Bär
panda|panda|panda|panda|Panda
monkey|macaco|singe|scimmia|Affe
elephant|elefante|éléphant|elefante|Elefant
giraffe|girafa|girafe|giraffa|Giraffe
zebra|zebra|zèbre|zebra|Zebra
deer|cervo|cerf|cervo|Hirsch
fox|raposa|renard|volpe|Fuchs
wolf|lobo|loup|lupo|Wolf
chicken|galinha|poule|gallina|Huhn
rooster|galo|coq|gallo|Hahn
duck|pato|canard|anatra|Ente
penguin|pinguim|manchot|pinguino|Pinguin
owl|coruja|hibou|gufo|Eule
eagle|águia|aigle|aquila|Adler
frog|sapo|grenouille|rana|Frosch
snake|cobra|serpent|serpente|Schlange
turtle|tartaruga|tortue|tartaruga|Schildkröte
fish|peixe|poisson|pesce|Fisch
dolphin|golfinho|dauphin|delfino|Delfin
whale|baleia|baleine|balena|Wal
octopus|polvo|pieuvre|polpo|Oktopus
butterfly|borboleta|papillon|farfalla|Schmetterling
bee|abelha|abeille|ape|Biene
ladybug|joaninha|coccinelle|coccinella|Marienkäfer
spider|aranha|araignée|ragno|Spinne
ant|formiga|fourmi|formica|Ameise
car|carro|voiture|automobile|Auto
bus|ônibus|bus|autobus|Bus
train|trem|train|treno|Zug
airplane|avião|avion|aeroplano|Flugzeug
bicycle|bicicleta|vélo|bicicletta|Fahrrad
motorcycle|moto|moto|motocicletta|Motorrad
boat|barco|bateau|barca|Boot
truck|caminhão|camion|camion|Lastwagen
ball|bola|balle|palla|Ball
soccerball|bola de futebol|ballon de football|pallone da calcio|Fußball
basketball|bola de basquete|ballon de basket|pallone da basket|Basketball
tennis|bola de tênis|balle de tennis|pallina da tennis|Tennisball
guitar|violão|guitare|chitarra|Gitarre
piano|piano|piano|pianoforte|Klavier
drum|tambor|tambour|tamburo|Trommel
violin|violino|violon|violino|Geige
microphone|microfone|microphone|microfono|Mikrofon
shirt|camiseta|tee-shirt|maglietta|T-Shirt
pants|calça|pantalon|pantaloni|Hose
dress|vestido|robe|vestito|Kleid
shoe|sapato|chaussure|scarpa|Schuh
hat|chapéu|chapeau|cappello|Hut
glasses|óculos|lunettes|occhiali|Brille
umbrella|guarda-chuva|parapluie|ombrello|Regenschirm
toothbrush|escova de dentes|brosse à dents|spazzolino|Zahnbürste
soap|sabão|savon|sapone|Seife
towel|toalha|serviette|asciugamano|Handtuch
flower|flor|fleur|fiore|Blume
tree|árvore|arbre|albero|Baum
leaf|folha|feuille|foglia|Blatt
sun|sol|soleil|sole|Sonne
moon|lua|lune|luna|Mond
star|estrela|étoile|stella|Stern
cloud|nuvem|nuage|nuvola|Wolke
rainbow|arco-íris|arc-en-ciel|arcobaleno|Regenbogen
heart|coração|cœur|cuore|Herz
gift|presente|cadeau|regalo|Geschenk
candle|vela|bougie|candela|Kerze
balloon|balão|ballon|palloncino|Luftballon
teddy|ursinho de pelúcia|ours en peluche|orsacchiotto|Teddybär
house|casa|maison|casa|Haus
school|escola|école|scuola|Schule
hospital|hospital|hôpital|ospedale|Krankenhaus
store|loja|magasin|negozio|Geschäft
park|parque|parc|parco|Park
beach|praia|plage|spiaggia|Strand
mountain|montanha|montagne|montagna|Berg
volcano|vulcão|volcan|vulcano|Vulkan
fire|fogo|feu|fuoco|Feuer
snowflake|neve|neige|neve|Schnee
snowman|boneco de neve|bonhomme de neige|pupazzo di neve|Schneemann
rocket|foguete|fusée|razzo|Rakete
satellite|satélite|satellite|satellite|Satellit
planet|planeta|planète|pianeta|Planet
earth|terra|Terre|Terra|Erde
microscope|microscópio|microscope|microscopio|Mikroskop
telescope|telescópio|télescope|telescopio|Teleskop
magnet|ímã|aimant|magnete|Magnet
testtube|tubo de ensaio|tube à essai|provetta|Reagenzglas
dna|ADN|ADN|DNA|DNA
atom|átomo|atome|atomo|Atom
map|mapa|carte géographique|mappa|Landkarte
compass|bússola|boussole|bussola|Kompass
calendar|calendário|calendrier|calendario|Kalender
envelope|envelope|enveloppe|busta|Briefumschlag
paperclip|clipe|trombone|graffetta|Büroklammer
folder|pasta|dossier|cartella|Ordner
bell|sino|cloche|campana|Glocke
alarm|despertador|réveil|sveglia|Wecker
battery|bateria|pile|batteria|Batterie
bulb|lâmpada|ampoule|lampadina|Glühbirne
plug|plugue|fiche électrique|spina elettrica|Stecker
lock|cadeado|cadenas|lucchetto|Vorhängeschloss
hammer|martelo|marteau|martello|Hammer
wrench|chave inglesa|clé anglaise|chiave inglese|Schraubenschlüssel
gear|engrenagem|engrenage|ingranaggio|Zahnrad
cart|carrinho de compras|chariot de courses|carrello della spesa|Einkaufswagen
money|dinheiro|argent|denaro|Geld
coin|moeda|pièce de monnaie|moneta|Münze
card|cartão|carte bancaire|carta bancaria|Bankkarte
crown|coroa|couronne|corona|Krone
diamond|diamante|diamant|diamante|Diamant
robot|robô|robot|robot|Roboter
unicorn|unicórnio|licorne|unicorno|Einhorn
dinosaur|dinossauro|dinosaure|dinosauro|Dinosaurier
dragon|dragão|dragon|drago|Drache
crocodile|crocodilo|crocodile|coccodrillo|Krokodil
shark|tubarão|requin|squalo|Hai
crab|caranguejo|crabe|granchio|Krabbe
lobster|lagosta|homard|astice|Hummer
parrot|papagaio|perroquet|pappagallo|Papagei
flamingo|flamingo|flamant rose|fenicottero|Flamingo
swan|cisne|cygne|cigno|Schwan
peacock|pavão|paon|pavone|Pfau
kangaroo|canguru|kangourou|canguro|Känguru
koala|coala|koala|koala|Koala
sloth|preguiça|paresseux|bradipo|Faultier
otter|lontra|loutre|lontra|Otter
seal|foca|phoque|foca|Robbe
llama|lhama|lama|lama|Lama
camel|camelo|chameau|cammello|Kamel
rhino|rinoceronte|rhinocéros|rinoceronte|Nashorn
hippo|hipopótamo|hippopotame|ippopotamo|Nilpferd
cactus|cacto|cactus|cactus|Kaktus
mushroom|cogumelo|champignon|fungo|Pilz
avocado|abacate|avocat|avocado|Avocado
corn|milho|maïs|mais|Mais
broccoli|brócolis|brocoli|broccoli|Brokkoli
cherries|cerejas|cerises|ciliegie|Kirschen
kiwi|kiwi|kiwi|kiwi|Kiwi
donut|rosquinha|beignet|ciambella|Donut
chocolate|chocolate|chocolat|cioccolato|Schokolade
popcorn|pipoca|pop-corn|popcorn|Popcorn
sandwich|sanduíche|sandwich|panino|Sandwich
hotdog|cachorro-quente|hot-dog|hot dog|Hotdog
taco|taco|taco|taco|Taco
coffee|café|café|caffè|Kaffee
tea|chá|thé|tè|Tee
juice|suco|jus|succo|Saft
water|água|eau|acqua|Wasser
triangle|triângulo|triangle|triangolo|Dreieck
circle|círculo|cercle|cerchio|Kreis
square|quadrado|carré|quadrato|Quadrat
blueheart|coração azul|cœur bleu|cuore blu|blaues Herz
greenheart|coração verde|cœur vert|cuore verde|grünes Herz
yellowheart|coração amarelo|cœur jaune|cuore giallo|gelbes Herz
`.trim().split("\n").map(line=>{const [id,pt,fr,it,de]=line.split("|");return [id,{pt,fr,it,de}];}));
  const catalog=items.map(([id,emoji,es,en,category])=>({id,emoji,es,en,category}));
  const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();

  function displayName(item,language="es"){
    if(typeof item==="string")item=catalog.find(candidate=>candidate.id===item);
    if(!item)return "";
    if(localizedNames[item.id]?.[language])return localizedNames[item.id][language];
    if(language==="en")return item.en[0];
    return item.es.find(alias=>norm(alias)===norm(item.es[0])&&/[áéíóúñü]/.test(alias))||item.es[0];
  }
  function aliases(item){return [...item.es.map(label=>({label,language:"es"})),
    ...item.en.map(label=>({label,language:"en"})),
    ...Object.entries(localizedNames[item.id]||{}).map(([language,label])=>({label,language}))];}
  function find(query,language=window.document?.documentElement?.lang){
    const q=norm(query);
    if(!q)return null;
    let best=null,bestScore=0;
    for(const item of catalog){
      for(const alias of aliases(item)){
        const a=norm(alias.label);
        const score=(q===a?10000:0)+a.length*10+(language===alias.language?1:0);
        if((q===a||(" "+q+" ").includes(" "+a+" "))&&score>bestScore){best=item;bestScore=score;}
      }
    }
    return best;
  }
  function findByModelLabel(label){
    const q=norm(label).replace(/,/g," ");
    return find(q,"en");
  }

  window.ROBOTITO_OBJECTS={catalog,find,findByModelLabel,displayName,localizedNames};
})();
