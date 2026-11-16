// P29 — factual animal profiles kept separate from the imaginary avatar.
// No remote API; information is deliberately broad and avoids pretending that
// every individual animal has the same habits, habitat or safe feeding.
(function(root){
'use strict';
const LANGS=['es','en','pt','fr','it','de'];
const loc=(values,lang)=>values[LANGS.indexOf(lang)]||values[0];
const H={
 bamboo:['bosques montañosos de bambú de China','mountain bamboo forests in China','florestas montanhosas de bambu na China','forêts montagneuses de bambous en Chine','foreste montane di bambù in Cina','Bambus-Bergwälder in China'],
 northern:['bosques y montañas del hemisferio norte','forests and mountains of the Northern Hemisphere','florestas e montanhas do hemisfério norte','forêts et montagnes de l’hémisphère nord','foreste e montagne dell’emisfero nord','Wälder und Berge der Nordhalbkugel'],
 arctic:['el hielo marino y las costas del Ártico','Arctic sea ice and coasts','o gelo marinho e as costas do Ártico','banquise et côtes de l’Arctique','ghiaccio marino e coste dell’Artico','Meereis und Küsten der Arktis'],
 domestic:['hogares y entornos cuidados por personas','homes and environments cared for by people','casas e ambientes cuidados por pessoas','foyers et milieux entretenus par les humains','case e ambienti curati dalle persone','von Menschen betreute Lebensräume'],
 tropical:['bosques tropicales','tropical forests','florestas tropicais','forêts tropicales','foreste tropicali','tropische Wälder'],
 asia:['bosques templados de Asia','temperate forests in Asia','florestas temperadas da Ásia','forêts tempérées d’Asie','foreste temperate asiatiche','gemäßigte Wälder Asiens'],
 america:['pastizales y bosques de América','grasslands and forests in the Americas','campos e florestas das Américas','prairies et forêts des Amériques','praterie e foreste delle Americhe','Grasländer und Wälder Amerikas'],
 madagascar:['árboles y arbustos de África y Madagascar, según la especie','trees and shrubs in Africa and Madagascar, depending on the species','árvores e arbustos da África e de Madagascar, conforme a espécie','arbres et arbustes d’Afrique et de Madagascar, selon l’espèce','alberi e arbusti in Africa e Madagascar, secondo la specie','Bäume und Sträucher in Afrika und Madagaskar, je nach Art'],
 coastal:['costas y mares del hemisferio sur, según la especie','coasts and seas of the Southern Hemisphere, depending on the species','costas e mares do hemisfério sul, conforme a espécie','côtes et mers de l’hémisphère sud, selon l’espèce','coste e mari dell’emisfero australe, secondo la specie','Küsten und Meere der Südhalbkugel, je nach Art'],
 africaasia:['sabanas y bosques de África o Asia, según la especie','African or Asian savannas and forests, depending on the species','savanas e florestas da África ou Ásia, conforme a espécie','savanes et forêts d’Afrique ou d’Asie, selon l’espèce','savane e foreste africane o asiatiche, secondo la specie','Savannen und Wälder Afrikas oder Asiens, je nach Art'],
 waterland:['mares, ríos o tierra firme, según la especie','seas, rivers or land, depending on the species','mares, rios ou terra firme, conforme a espécie','mers, rivières ou terre, selon l’espèce','mari, fiumi o terraferma, secondo la specie','Meere, Flüsse oder Land, je nach Art'],
 woodland:['bosques y parques con árboles','woodlands and tree-filled parks','bosques e parques arborizados','bois et parcs arborés','boschi e parchi alberati','Wälder und Parks mit Bäumen'],
 plains:['praderas y zonas abiertas','grasslands and open areas','pradarias e áreas abertas','prairies et espaces ouverts','praterie e spazi aperti','Grasländer und offene Gebiete'],
 africa:['sabanas y bosques de África','African savannas and forests','savanas e florestas africanas','savanes et forêts d’Afrique','savane e foreste africane','Savannen und Wälder Afrikas'],
 asianForest:['bosques y zonas de vegetación de Asia','Asian forests and vegetated areas','florestas e áreas vegetadas da Ásia','forêts et zones boisées d’Asie','foreste e zone verdi dell’Asia','Wälder und bewachsene Gebiete Asiens'],
 austral:['bosques de eucaliptos de Australia','Australian eucalyptus woodlands','florestas de eucalipto da Austrália','forêts d’eucalyptus d’Australie','foreste di eucalipto australiane','Eukalyptuswälder Australiens'],
 freshwater:['humedales, charcas y cursos de agua','wetlands, ponds and waterways','pântanos, lagoas e cursos de água','zones humides, mares et cours d’eau','zone umide, stagni e corsi d’acqua','Feuchtgebiete, Teiche und Wasserläufe'],
 oceans:['mares y océanos','seas and oceans','mares e oceanos','mers et océans','mari e oceani','Meere und Ozeane'],
 rivers:['ríos, lagos y sus riberas','rivers, lakes and their banks','rios, lagos e suas margens','rivières, lacs et leurs rives','fiumi, laghi e rive','Flüsse, Seen und Ufer'],
 saltlakes:['lagunas salinas y humedales','saline lagoons and wetlands','lagoas salinas e pântanos','lagunes salées et zones humides','lagune salmastre e zone umide','Salzlagunen und Feuchtgebiete'],
 aust:['llanuras y bosques de Australia','Australian plains and woodlands','planícies e bosques da Austrália','plaines et bois d’Australie','pianure e boschi dell’Australia','Ebenen und Wälder Australiens'],
 tropicalriver:['ríos y humedales tropicales','tropical rivers and wetlands','rios e pântanos tropicais','rivières et zones humides tropicales','fiumi e zone umide tropicali','tropische Flüsse und Feuchtgebiete'],
 varied:['distintos hábitats, según la especie','different habitats depending on the species','habitats variados, conforme a espécie','divers habitats selon l’espèce','habitat diversi secondo la specie','unterschiedliche Lebensräume je nach Art'],
 extinct:['ambientes de la Tierra prehistórica, distintos según el dinosaurio','different prehistoric environments, depending on the dinosaur','ambientes pré-históricos variados, conforme o dinossauro','divers milieux préhistoriques, selon le dinosaure','ambienti preistorici diversi secondo il dinosauro','unterschiedliche vorzeitliche Lebensräume, je nach Dinosaurier'],
 fictional:['un mundo inventado, no un hábitat zoológico real','an imaginary world, not a real zoological habitat','um mundo imaginário, não um habitat zoológico real','un monde imaginaire, pas un habitat zoologique réel','un mondo immaginario, non un vero habitat zoologico','eine erfundene Welt, kein echter zoologischer Lebensraum']
};
const D={
 bamboo:['principalmente bambú','mostly bamboo','principalmente bambu','surtout du bambou','soprattutto bambù','vor allem Bambus'],
 omnivore:['alimentos vegetales y animales variados','various plant and animal foods','alimentos vegetais e animais variados','divers aliments végétaux et animaux','vari alimenti vegetali e animali','verschiedene pflanzliche und tierische Nahrung'],
 seal:['principalmente focas en la naturaleza','mainly seals in the wild','principalmente focas na natureza','surtout des phoques dans la nature','soprattutto foche in natura','in freier Wildbahn vor allem Robben'],
 petdog:['alimentación adecuada para perros, bajo cuidado humano','food suitable for dogs under human care','alimentação adequada a cães sob cuidados humanos','nourriture adaptée aux chiens sous soins humains','cibo adatto ai cani sotto cura umana','für Hunde geeignetes Futter unter menschlicher Betreuung'],
 petcat:['alimentación apropiada para gatos, que son carnívoros','suitable cat food, as cats are carnivores','ração adequada a gatos, que são carnívoros','nourriture adaptée aux chats carnivores','cibo adatto ai gatti carnivori','geeignetes Futter für fleischfressende Katzen'],
 fruitbugs:['frutas, hojas y algunos insectos, según la especie','fruit, leaves and some insects, depending on the species','frutos, folhas e alguns insetos conforme a espécie','fruits, feuilles et quelques insectes selon l’espèce','frutti, foglie e alcuni insetti secondo la specie','Früchte, Blätter und einige Insekten, je nach Art'],
 leaves:['hojas y vegetación','leaves and vegetation','folhas e vegetação','feuilles et végétation','foglie e vegetazione','Blätter und Pflanzen'],
 insects:['principalmente insectos','mostly insects','principalmente insetos','surtout des insectes','soprattutto insetti','vor allem Insekten'],
 fish:['pescados y otros animales acuáticos pequeños','fish and other small aquatic animals','peixes e pequenos animais aquáticos','poissons et petits animaux aquatiques','pesci e piccoli animali acquatici','Fische und andere kleine Wassertiere'],
 plants:['hierbas, hojas y otras plantas','grass, leaves and other plants','ervas, folhas e outras plantas','herbes, feuilles et autres plantes','erbe, foglie e altre piante','Gräser, Blätter und andere Pflanzen'],
 seeds:['semillas, granos y vegetales apropiados','seeds, grains and suitable vegetation','sementes, grãos e vegetais adequados','graines, céréales et végétaux adaptés','semi, cereali e vegetali adatti','Samen, Körner und passende Pflanzen'],
 nuts:['frutos secos y semillas, además de otros alimentos según la especie','nuts and seeds, alongside other foods depending on the species','nozes e sementes, além de outros alimentos conforme a espécie','noix et graines, ainsi que d’autres aliments selon l’espèce','noci e semi, oltre ad altri alimenti secondo la specie','Nüsse und Samen sowie andere Nahrung je nach Art'],
 meat:['otros animales; son carnívoros','other animals; they are carnivores','outros animais; são carnívoros','d’autres animaux ; ils sont carnivores','altri animali; sono carnivori','andere Tiere; sie sind Fleischfresser'],
 eucalyptus:['hojas de eucalipto','eucalyptus leaves','folhas de eucalipto','feuilles d’eucalyptus','foglie di eucalipto','Eukalyptusblätter'],
 aquaticplants:['plantas acuáticas y, según la especie, pequeños animales','aquatic plants and, depending on the species, small animals','plantas aquáticas e pequenos animais, conforme a espécie','plantes aquatiques et petits animaux selon l’espèce','piante acquatiche e piccoli animali secondo la specie','Wasserpflanzen und je nach Art kleine Tiere'],
 crustaceans:['pequeños crustáceos y otros organismos acuáticos','small crustaceans and other aquatic organisms','pequenos crustáceos e organismos aquáticos','petits crustacés et autres organismes aquatiques','piccoli crostacei e altri organismi acquatici','kleine Krebstiere und andere Wasserorganismen'],
 bark:['corteza, ramas y otras partes de plantas','bark, twigs and other plant parts','casca, galhos e partes de plantas','écorce, brindilles et autres parties de plantes','corteccia, rami e altre parti di piante','Rinde, Zweige und andere Pflanzenteile'],
 extinct:['dependía de la especie: algunos eran herbívoros y otros carnívoros','depended on the species: some ate plants and others meat','dependia da espécie: alguns comiam plantas e outros carne','dépendait de l’espèce : certains mangeaient des plantes, d’autres de la viande','dipendeva dalla specie: alcuni erbivori e altri carnivori','war artabhängig: manche fraßen Pflanzen, andere Fleisch'],
 fictional:['comida imaginaria; no existe una dieta biológica real','imaginary food; there is no real biological diet','comida imaginária; não há dieta biológica real','nourriture imaginaire ; aucun régime biologique réel','cibo immaginario; non esiste una dieta biologica reale','erfundene Nahrung; es gibt keine echte biologische Ernährung'],
 robot:['energía eléctrica en nuestra ficción; no es un animal','electricity in our story; this is not an animal','energia elétrica na nossa história; não é um animal','électricité dans notre histoire ; ce n’est pas un animal','elettricità nella nostra storia; non è un animale','Strom in unserer Geschichte; das ist kein Tier']
};
const F={
 bear:['otros osos','other bears','outros ursos','d’autres ours','altri orsi','anderen Bären'],
 dog:['otros cánidos','other canids','outros canídeos','d’autres canidés','altri canidi','anderen Hundeartigen'],
 cat:['otros felinos','other felines','outros felinos','d’autres félins','altri felini','anderen Katzenartigen'],
 primate:['otros primates','other primates','outros primatas','d’autres primates','altri primati','anderen Primaten'],
 reptile:['otros reptiles, pero no todos pertenecen al mismo grupo cercano','other reptiles, although not all are close relatives','outros répteis, embora nem todos sejam próximos','d’autres reptiles, sans être tous proches parents','altri rettili, non tutti parenti stretti','anderen Reptilien, aber nicht alle sind nah verwandt'],
 bird:['otras aves','other birds','outras aves','d’autres oiseaux','altri uccelli','anderen Vögeln'],
 rodent:['otros roedores','other rodents','outros roedores','d’autres rongeurs','altri roditori','anderen Nagetieren'],
 ungulate:['otros mamíferos ungulados','other hoofed mammals','outros mamíferos ungulados','d’autres mammifères à sabots','altri mammiferi ungulati','anderen Huftieren'],
 amphibian:['otros anfibios','other amphibians','outros anfíbios','d’autres amphibiens','altri anfibi','anderen Amphibien'],
 marsupial:['otros marsupiales','other marsupials','outros marsupiais','d’autres marsupiaux','altri marsupiali','anderen Beuteltieren'],
 marine:['otros mamíferos acuáticos, según la especie','other aquatic mammals, depending on the species','outros mamíferos aquáticos, conforme a espécie','d’autres mammifères aquatiques, selon l’espèce','altri mammiferi acquatici secondo la specie','anderen Wassersäugern, je nach Art'],
 insectivore:['otros mamíferos insectívoros, según el grupo','other insect-eating mammals, depending on the group','outros mamíferos insetívoros conforme o grupo','d’autres mammifères insectivores selon le groupe','altri mammiferi insettivori secondo il gruppo','anderen insektenfressenden Säugetieren, je nach Gruppe'],
 extinct:['otros dinosaurios; las aves evolucionaron de un linaje de dinosaurios','other dinosaurs; birds evolved from one dinosaur lineage','outros dinossauros; as aves evoluíram de uma linhagem de dinossauros','d’autres dinosaures ; les oiseaux descendent d’une lignée de dinosaures','altri dinosauri; gli uccelli discendono da un ramo dei dinosauri','anderen Dinosauriern; Vögel stammen von einer Dinosaurierlinie ab'],
 fictional:['ninguna familia animal real','no real animal family','nenhuma família animal real','aucune vraie famille animale','nessuna famiglia animale reale','keiner echten Tierfamilie']
};
// Short, checked natural-history facts grouped to avoid unsupported specifics.
const C={
 bamboo:['Puedo pasar muchas horas al día alimentándome de bambú.','I can spend many hours each day eating bamboo.','Posso passar muitas horas por dia comendo bambu.','Je peux passer de longues heures à manger du bambou.','Posso passare molte ore al giorno a mangiare bambù.','Ich kann täglich viele Stunden mit Bambusfressen verbringen.'],
 arctic:['Mi pelaje y mi grasa ayudan a conservar calor en el frío polar.','My fur and body fat help retain warmth in the polar cold.','Meu pelo e a gordura ajudam a conservar calor no frio polar.','Ma fourrure et ma graisse aident à conserver la chaleur polaire.','La pelliccia e il grasso aiutano a conservare calore nel gelo polare.','Fell und Fett helfen mir, in der Polarkälte warm zu bleiben.'],
 smell:['El olfato tiene un papel importante en cómo exploro el entorno.','Smell plays an important role in how I explore my surroundings.','O olfato é importante para explorar o ambiente.','L’odorat joue un grand rôle dans mon exploration.','L’olfatto è importante per esplorare l’ambiente.','Der Geruchssinn hilft mir, meine Umgebung zu erkunden.'],
 climber:['Mis extremidades me ayudan a trepar y moverme entre ramas.','My limbs help me climb and move among branches.','Meus membros me ajudam a subir em galhos.','Mes membres m’aident à grimper entre les branches.','Gli arti mi aiutano ad arrampicarmi sui rami.','Meine Gliedmaßen helfen mir beim Klettern.'],
 swimmer:['Mi cuerpo está adaptado a desplazarme en el agua.','My body is adapted for moving through water.','Meu corpo é adaptado para nadar.','Mon corps est adapté aux déplacements dans l’eau.','Il mio corpo è adattato a muoversi nell’acqua.','Mein Körper ist an Bewegungen im Wasser angepasst.'],
 camouflage:['El camuflaje es parte de cómo sobrevivo; en los camaleones el color también interviene en la comunicación y la temperatura, no solo en esconderse.','Camouflage helps me survive; chameleon colours also signal and help regulate temperature, not just hide.','A camuflagem me ajuda; a cor dos camaleões também comunica e regula o calor.','Le camouflage aide ; les couleurs du caméléon servent aussi à communiquer et réguler la chaleur.','Il mimetismo aiuta; i colori dei camaleonti comunicano e regolano anche il calore.','Tarnung hilft; Chamäleonfarben dienen auch der Kommunikation und Temperaturregulation.'],
 nocturnal:['Soy especialmente activo durante las horas oscuras, según mi especie.','I am often active during dark hours, depending on the species.','Sou mais ativo no escuro, conforme a espécie.','Je suis souvent actif la nuit, selon l’espèce.','Sono spesso attivo di notte, secondo la specie.','Ich bin je nach Art oft nachts aktiv.'],
 social:['La vida en grupo y la comunicación son importantes para mi especie.','Group life and communication matter to my species.','A vida em grupo e a comunicação são importantes.','La vie en groupe et la communication sont importantes.','La vita di gruppo e la comunicazione sono importanti.','Gruppenleben und Kommunikation sind wichtig.'],
 longneck:['Mi anatomía me ayuda a alcanzar hojas que otros herbívoros no alcanzan tan fácilmente.','My build helps me reach leaves that other grazers cannot easily reach.','Minha anatomia me ajuda a alcançar folhas altas.','Mon anatomie m’aide à atteindre les feuilles en hauteur.','La mia anatomia mi aiuta a raggiungere foglie alte.','Mein Körperbau hilft mir, hohe Blätter zu erreichen.'],
 slow:['Mis movimientos suelen ser pausados y ahorran energía.','My movements are generally slow and conserve energy.','Meus movimentos são lentos e economizam energia.','Mes mouvements sont lents et économisent l’énergie.','I miei movimenti sono lenti e risparmiano energia.','Meine Bewegungen sind langsam und energiesparend.'],
 hooves:['Mis patas están adaptadas a desplazarme por el suelo.','My legs are adapted for moving over land.','Minhas patas são adaptadas para andar em terra.','Mes pattes sont adaptées aux déplacements terrestres.','Le mie zampe sono adatte al movimento terrestre.','Meine Beine sind an die Fortbewegung an Land angepasst.'],
 armor:['Mi protección corporal me ayuda frente a ciertos peligros.','My body armour offers some protection from danger.','Minha proteção corporal ajuda contra perigos.','Ma protection corporelle m’aide face aux dangers.','La protezione del corpo mi aiuta contro i pericoli.','Mein Körperschutz hilft gegen manche Gefahren.'],
 flight:['Mis alas y plumas tienen funciones importantes para mi vida.','My wings and feathers play important roles in my life.','Minhas asas e penas têm funções importantes.','Mes ailes et mes plumes ont des fonctions importantes.','Ali e piume hanno funzioni importanti.','Flügel und Federn erfüllen wichtige Aufgaben.'],
 river:['El agua y las orillas son una parte importante de mi vida.','Water and shorelines are an important part of my life.','Água e margens são importantes para mim.','L’eau et les rives jouent un grand rôle dans ma vie.','L’acqua e le rive sono importanti nella mia vita.','Wasser und Ufer sind wichtig für mein Leben.'],
 extinct:['Los dinosaurios fueron animales reales, pero hoy no hay dinosaurios no avianos vivos.','Dinosaurs were real animals, but no non-avian dinosaurs survive today.','Dinossauros foram reais, mas não há dinossauros não aviários vivos hoje.','Les dinosaures étaient réels, mais les dinosaures non aviens ont disparu.','I dinosauri erano reali, ma i dinosauri non aviani sono estinti.','Dinosaurier waren echt, aber Nicht-Vogeldinosaurier sind ausgestorben.'],
 fictional:['Este es un personaje imaginario, no una especie natural.','I am an imaginary character, not a natural species.','Sou um personagem imaginário, não uma espécie natural.','Je suis un personnage imaginaire, pas une espèce naturelle.','Sono un personaggio immaginario, non una specie naturale.','Ich bin eine erfundene Figur, keine natürliche Art.'],
 unique:['Mi aspecto es solo una representación animada; los individuos reales pueden variar.','My appearance is an animation; real individuals can vary.','Minha aparência é animada; indivíduos reais podem variar.','Mon apparence est animée ; les vrais individus peuvent varier.','Il mio aspetto è animato; gli individui reali possono variare.','Mein Aussehen ist animiert; echte Tiere können variieren.']
};
const entries=[
 ['panda','bamboo','bamboo','bear','bamboo','🎋'],
 ['brown-bear','northern','omnivore','bear','smell','🫐'],
 ['polar-bear','arctic','seal','bear','arctic','🐟'],
 ['dog','domestic','petdog','dog','smell','🥣'],
 ['monkey','tropical','fruitbugs','primate','climber','🍌'],
 ['cat','domestic','petcat','cat','nocturnal','🐟'],
 ['red-panda','asia','bamboo','bear','climber','🎋'],
 ['iguana','tropical','leaves','reptile','climber','🥬'],
 ['chameleon','madagascar','insects','reptile','camouflage','🦗'],
 ['armadillo','america','insects','insectivore','armor','🐜'],
 ['penguin','coastal','fish','bird','swimmer','🐟'],
 ['elephant','africaasia','plants','ungulate','social','🥬'],
 ['turtle','waterland','aquaticplants','reptile','slow','🥬'],
 ['squirrel','woodland','nuts','rodent','climber','🥜'],
 ['mouse','varied','seeds','rodent','smell','🌾'],
 ['hamster','domestic','seeds','rodent','nocturnal','🌻'],
 ['rabbit','plains','plants','ungulate','hooves','🥬'],
 ['lion','africa','meat','cat','social','🍖'],
 ['tiger','asianForest','meat','cat','camouflage','🍖'],
 ['panther','tropical','meat','cat','camouflage','🍖'],
 ['fox','varied','omnivore','dog','smell','🫐'],
 ['koala','austral','eucalyptus','ungulate','slow','🌿'],
 ['pig','domestic','omnivore','ungulate','smell','🥕'],
 ['cow','plains','plants','ungulate','social','🌾'],
 ['frog','freshwater','insects','amphibian','river','🦗'],
 ['owl','woodland','meat','bird','nocturnal','🐭'],
 ['wolf','northern','meat','dog','social','🍖'],
 ['horse','plains','plants','ungulate','hooves','🌾'],
 ['unicorn','fictional','fictional','fictional','fictional','🍎'],
 ['dinosaur','extinct','extinct','extinct','extinct','🌿'],
 ['crocodile','tropicalriver','meat','reptile','swimmer','🐟'],
 ['dolphin','oceans','fish','marine','social','🐟'],
 ['zebra','africa','plants','ungulate','social','🌾'],
 ['deer','woodland','plants','ungulate','hooves','🌿'],
 ['hippopotamus','rivers','plants','ungulate','swimmer','🌾'],
 ['giraffe','africa','leaves','ungulate','longneck','🌿'],
 ['kangaroo','aust','plants','marsupial','hooves','🌿'],
 ['gorilla','tropical','fruitbugs','primate','social','🍌'],
 ['sheep','plains','plants','ungulate','social','🌾'],
 ['goat','northern','plants','ungulate','climber','🌿'],
 ['peacock','asianForest','omnivore','bird','flight','🌾'],
 ['swan','freshwater','aquaticplants','bird','swimmer','🌿'],
 ['flamingo','saltlakes','crustaceans','bird','river','🦐'],
 ['skunk','america','omnivore','insectivore','smell','🫐'],
 ['raccoon','america','omnivore','insectivore','smell','🫐'],
 ['otter','rivers','fish','marine','swimmer','🐟'],
 ['sloth','tropical','leaves','primate','slow','🌿'],
 ['beaver','rivers','bark','rodent','river','🌿'],
 ['hedgehog','woodland','insects','insectivore','armor','🐛'],
 ['robot','fictional','robot','fictional','fictional','⚡']
];
// Correct a few family relationships: red pandas belong to Ailuridae, rabbits
// to lagomorphs and koalas to marsupials (not bears or hoofed mammals).
F.redpanda=['otros pandas rojos (familia Ailuridae), no los osos panda','other red pandas (Ailuridae), not giant pandas','outros pandas-vermelhos (Ailuridae), não pandas-gigantes','d’autres pandas roux (Ailuridae), pas des pandas géants','altri panda rossi (Ailuridae), non panda giganti','anderen Roten Pandas (Ailuridae), nicht Großen Pandas'];
F.lagomorph=['otros lagomorfos, como liebres','other lagomorphs, like hares','outros lagomorfos, como lebres','d’autres lagomorphes, comme les lièvres','altri lagomorfi, come le lepri','anderen Hasenartigen, wie Feldhasen'];
F.marsupial=['otros marsupiales','other marsupials','outros marsupiais','d’autres marsupiaux','altri marsupiali','anderen Beuteltieren'];
F.otter=['otras nutrias y mustélidos','other otters and mustelids','outras lontras e mustelídeos','d’autres loutres et mustélidés','altre lontre e mustelidi','anderen Ottern und Marderartigen'];
F.sloth=['otros perezosos y xenartros','other sloths and xenarthrans','outras preguiças e xenartros','d’autres paresseux et xénarthres','altri bradipi e xenarthri','anderen Faultieren und Nebengelenktieren'];
F.armadillo=['otros armadillos y xenartros','other armadillos and xenarthrans','outros tatus e xenartros','d’autres tatous et xénarthres','altri armadilli e xenarthri','anderen Gürteltieren und Nebengelenktieren'];
F.raccoon=['otros mapaches y prociónidos','other raccoons and procyonids','outros guaxinins e procionídeos','d’autres ratons laveurs et procyonidés','altri procioni e procionidi','anderen Waschbären und Kleinbären'];
F.skunk=['otros zorrillos (familia Mephitidae)','other skunks (Mephitidae)','outros gambás (Mephitidae)','d’autres mouffettes (Mephitidae)','altre puzzole americane (Mephitidae)','anderen Stinktieren (Mephitidae)'];
F.hedgehog=['otros erizos verdaderos (familia Erinaceidae)','other true hedgehogs (Erinaceidae)','outros ouriços verdadeiros (Erinaceidae)','d’autres hérissons (Erinaceidae)','altri ricci veri (Erinaceidae)','anderen Igeln (Erinaceidae)'];
F.elephant=['otros elefantes y proboscídeos','other elephants and proboscideans','outros elefantes e proboscídeos','d’autres éléphants et proboscidiens','altri elefanti e proboscidati','anderen Elefanten und Rüsseltieren'];
F.dolphin=['otros delfines y cetáceos','other dolphins and cetaceans','outros golfinhos e cetáceos','d’autres dauphins et cétacés','altri delfini e cetacei','anderen Delfinen und Walen'];

const data=Object.fromEntries(entries.map(([id,h,d,f,c,emoji])=>[id,Object.freeze({id,habitat:h,diet:d,family:f,curiosity:c,foodEmoji:emoji})]));
data['red-panda']=Object.freeze({...data['red-panda'],family:'redpanda'});
data.rabbit=Object.freeze({...data.rabbit,family:'lagomorph',curiosity:'unique'});
data.koala=Object.freeze({...data.koala,family:'marsupial'});
data.sloth=Object.freeze({...data.sloth,family:'unique'});
data.otter=Object.freeze({...data.otter,family:'otter'});
data.sloth=Object.freeze({...data.sloth,family:'sloth'});
data.armadillo=Object.freeze({...data.armadillo,family:'armadillo'});
data.skunk=Object.freeze({...data.skunk,family:'skunk'});
data.raccoon=Object.freeze({...data.raccoon,family:'raccoon'});
data.hedgehog=Object.freeze({...data.hedgehog,family:'hedgehog'});
data.elephant=Object.freeze({...data.elephant,family:'elephant'});
data.dolphin=Object.freeze({...data.dolphin,family:'dolphin'});
const norm=s=>String(s||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[¿?¡!.,;:]/g,' ').replace(/\s+/g,' ').trim();
const prompts={
 identity:[/\b(?:que|cual)\s+(?:animal|especie|bicho)\s+(?:sos|eres|es)\b/,/\b(?:que|cual)\s+tipo\s+de\s+animal\s+(?:eres|sos)\b/,/\bwhat\s+(?:animal|species|kind of animal)\s+are\s+you\b/,/\b(?:qual|que)\s+animal\s+(?:voce e|es|tu es)\b/,/\bquel\s+animal\s+es\s+tu\b/,/\bche\s+(?:animale|specie)\s+sei\b/,/\bwas\s+fur\s+ein\s+tier\s+bist\s+du\b/],
 habitat:[/\b(?:donde|en que lugar)\s+(?:vivis|vives|vivirias|vive tu especie|viviria tu especie)\b/,/\b(?:cual|que)\s+es\s+(?:tu|el)\s+habitat\b/,/\b(?:where do you live|where does your species live|where would you live)\b/,/\b(?:onde voce mora|onde vive sua especie|onde vives)\b/,/\b(?:ou vis tu|ou habites tu|ou vit ton espece)\b/,/\b(?:dove vivi|qual e il tuo habitat)\b/,/\b(?:wo lebst du|wo lebt deine art)\b/],
 diet:[/\b(?:que|cual)\s+(?:comes|comerias|te gusta comer|es tu comida|me recomendas darte de comer)\b/,/\b(?:que le puedo dar de comer|que puedo darte de comer|con que te alimento)\b/,/\b(?:what do you eat|what would you eat|what can i feed you|what food do you like)\b/,/\b(?:o que voce come|o que posso te dar de comer)\b/,/\b(?:que manges tu|que peux je te donner a manger)\b/,/\b(?:cosa mangi|che cosa mangi|cosa posso darti da mangiare)\b/,/\b(?:was frisst du|was isst du|was kann ich dir zu fressen geben)\b/],
 family:[/\b(?:que|cuales)\s+(?:animales?|especies?)\s+(?:se parecen a vos|son tus parientes|son parientes tuyos)\b/,/\b(?:a que familia perteneces|que especies estan emparentadas contigo)\b/,/\b(?:what animals are related to you|what species are your relatives|what family are you in)\b/,/\b(?:quais animais sao seus parentes|a que familia voce pertence)\b/,/\b(?:quels animaux sont tes cousins|a quelle famille appartiens tu)\b/,/\b(?:quali animali sono tuoi parenti|a quale famiglia appartieni)\b/,/\b(?:welche tiere sind mit dir verwandt|zu welcher familie gehort deine art)\b/],
 habits:[/\b(?:que|cuales)\s+(?:habitos|costumbres|curiosidades|caracteristicas)\s+(?:tenes|tienes|tiene tu especie)\b/,/\b(?:contame algo sobre tu especie|que haces en la naturaleza|como vive tu especie|por que cambias de color|por que tu color cambia)\b/,/\b(?:tell me a fact about your species|what are your habits|tell me about yourself)\b/,/\b(?:quais sao seus habitos|conte uma curiosidade)\b/,/\b(?:raconte une curiosite|quelles sont tes habitudes)\b/,/\b(?:raccontami una curiosita|quali sono le tue abitudini)\b/,/\b(?:erzahl mir eine besonderheit|was sind deine gewohnheiten)\b/],
 origin:[/\b(?:donde|de que pais)\s+(?:sos|eres|es robotito|te crearon|fuiste creado|fue creado robotito)\b/,/\b(?:de donde viene robotito|donde se creo robotito)\b/,/\b(?:where are you from|where was robotito created|where were you made)\b/,/\b(?:onde robotito foi criado|de onde voce e)\b/,/\b(?:ou a ete cree robotito|d ou viens tu)\b/,/\b(?:dove e stato creato robotito|da dove vieni)\b/,/\b(?:wo wurde robotito entwickelt|woher kommst du)\b/]
};
// Only explicit feeding offers are treated as actions; ordinary biology questions
// and affectionate phrases must remain in the main conversation router.
const FOOD_TERMS=[
 ['bamboo',/\b(?:bambu|bamboo|bambou|bambus)\b/],
 ['fruit',/\b(?:banana|bananas|platano|fruta|frutas|fruits?|fruit|banane|bananen|maca|manzana|apple|apfel|pomme|mela|miel|honey|berries|bayas|amoras|baies)\b/],
 ['fish',/\b(?:pescado|pescadito|peixe|fish|poisson|pesce|fisch|sardina|sardine)\b/],
 ['meat',/\b(?:carne|meat|viande|fleisch|pollo|chicken|poulet|huhn)\b/],
 ['insects',/\b(?:insectos?|bugs?|insetos?|insectes?|insetti|insekten|grillos?|crickets?|grillons?|grilli)\b/],
 ['plants',/\b(?:hojas?|leaves|folhas?|feuilles?|foglie|blatter|hierba|grass|pasto|fenos?|hay|heu|heu|herbe|erba|lechuga|lettuce|salat|salada|verduras?|vegetables?)\b/],
 ['seeds',/\b(?:semillas?|seeds?|sementes?|graines?|semi|samen|nueces?|nuts?|noix|noci)\b/],
 ['kibble',/\b(?:alimento balanceado|comida para perros|dog food|cat food|racao|croquettes|mangime)\b/],
 ['power',/\b(?:energia|electricidad|electricity|elektrizitat|strom|power|energia elettrica)\b/],
 ['harmful',/\b(?:chocolate|alcohol|cerveza|beer|vinho|wine|vin|wein|bier|cafe|coffee|kaffee)\b/]
];
const allowed={
 bamboo:['bamboo','plants'],omnivore:['fruit','plants','seeds','insects','meat','fish'],
 seal:['fish'],petdog:['meat','kibble'],petcat:['meat','fish','kibble'],
 fruitbugs:['fruit','plants','insects'],leaves:['plants'],insects:['insects'],
 fish:['fish'],plants:['plants'],seeds:['seeds','plants'],nuts:['seeds','fruit'],
 meat:['meat','fish'],eucalyptus:['plants'],aquaticplants:['plants'],
 crustaceans:['fish'],bark:['plants'],extinct:[],fictional:[],robot:['power']
};
function feedingOffer(raw,{id='panda',lang='es'}={}){
 const fact=data[id],s=norm(raw);if(!fact||!s)return null;
 if(!/\b(?:te doy|te ofrezco|te traje|quiero darte|dale de comer|darte de comer|i give you|i offer you|feed you|here is some|eu te dou|eu te ofereco|je te donne|je t offre|ti do|ti offro|ich gebe dir|ich futtere dich)\b/.test(s))return null;
 const kind=FOOD_TERMS.find(([,re])=>re.test(s))?.[0]||null;
 if(!kind)return null; // Never steal unrelated commands such as 'te doy un abrazo'.
 const ok=kind!=='harmful'&&(allowed[fact.diet]||[]).includes(kind);
 const emoji=fact.foodEmoji;
 return {handled:true,ok,kind,emoji,text:COPY[LANGS.includes(lang)?lang:'es'][ok?'feed':'notSafe'](emoji)};
}
const COPY={
 es:{identity:n=>`Soy Robotito, con apariencia de ${n}. Es un avatar animado; no soy un animal real.`,habitat:(n,h)=>`En mi mundo soy ${n}. En la naturaleza, esa especie puede vivir en ${h}. Robotito es software creado en Uruguay.`,diet:(n,d)=>`Como avatar de ${n}, represento una especie cuya alimentación es: ${d}. Para jugar, te muestro una comida ilustrativa; no es una indicación de alimentar animales reales.`,family:(n,f)=>`Como ${n}, estoy emparentado con ${f}.`,habits:(n,c)=>`Una curiosidad de la especie que represento: ${c} Mi personaje es ficción animada.`,origin:n=>`Robotito fue creado en Uruguay. Mi avatar actual representa a ${n}; eso es diferente del hábitat natural del animal.`,feed:(emoji)=>`Esta es una comida ilustrativa apropiada para el avatar: ${emoji}.`,notSafe:emoji=>`No sé si ese alimento sería seguro para esta especie. Prefiero mostrarte ${emoji} en vez de arriesgarme.`},
 en:{identity:n=>`I'm Robotito, appearing as a ${n}. I'm an animated avatar, not a real animal.`,habitat:(n,h)=>`My avatar is a ${n}. In nature, this species may live in ${h}. Robotito is software created in Uruguay.`,diet:(n,d)=>`My ${n} avatar represents an animal whose diet involves ${d}. This is only illustrative, not advice for feeding real animals.`,family:(n,f)=>`As a ${n}, I'm related to ${f}.`,habits:(n,c)=>`One fact about the species I represent: ${c} My character is animated fiction.`,origin:n=>`Robotito was created in Uruguay. My current avatar represents a ${n}; that differs from the animal's native habitat.`,feed:emoji=>`Here's a suitable illustrative snack for this avatar: ${emoji}.`,notSafe:emoji=>`I'm not sure that food is safe for this species. I'd rather show ${emoji} than risk it.`},
 pt:{identity:n=>`Sou o Robotito, com aparência de ${n}. Sou um avatar animado, não um animal real.`,habitat:(n,h)=>`Meu avatar é ${n}. Na natureza, essa espécie pode viver em ${h}. Robotito é um software criado no Uruguai.`,diet:(n,d)=>`Como avatar de ${n}, represento uma espécie que come ${d}. Isso é apenas ilustrativo, não é orientação para alimentar animais reais.`,family:(n,f)=>`Como ${n}, tenho parentesco com ${f}.`,habits:(n,c)=>`Uma curiosidade sobre a espécie: ${c} Meu personagem é fictício.`,origin:n=>`Robotito foi criado no Uruguai. Meu avatar representa ${n}; isso é diferente do habitat natural.`,feed:emoji=>`Este lanche ilustrativo combina com o avatar: ${emoji}.`,notSafe:emoji=>`Não sei se esse alimento é seguro. Prefiro mostrar ${emoji}.`},
 fr:{identity:n=>`Je suis Robotito, sous l'apparence d'un ${n}. Je suis un avatar animé, pas un véritable animal.`,habitat:(n,h)=>`Mon avatar représente un ${n}. Dans la nature, cette espèce vit dans ${h}. Robotito est un logiciel créé en Uruguay.`,diet:(n,d)=>`Mon avatar ${n} représente un animal qui mange ${d}. C'est une illustration, pas un conseil pour nourrir des animaux réels.`,family:(n,f)=>`En tant que ${n}, je suis apparenté à ${f}.`,habits:(n,c)=>`Une curiosité de l'espèce : ${c} Mon personnage est fictif.`,origin:n=>`Robotito a été créé en Uruguay. Mon avatar est un ${n}, mais ce n'est pas l'origine du logiciel.`,feed:emoji=>`Voici une nourriture illustrative : ${emoji}.`,notSafe:emoji=>`Je ne sais pas si cet aliment est sûr. Je préfère montrer ${emoji}.`},
 it:{identity:n=>`Sono Robotito, con l'aspetto di ${n}. Sono un avatar animato, non un animale vero.`,habitat:(n,h)=>`Il mio avatar raffigura un ${n}. In natura questa specie vive in ${h}. Robotito è un software creato in Uruguay.`,diet:(n,d)=>`Il mio avatar ${n} raffigura una specie che si nutre di ${d}. È solo illustrativo, non un consiglio per nutrire animali veri.`,family:(n,f)=>`Come ${n}, sono imparentato con ${f}.`,habits:(n,c)=>`Una curiosità sulla specie: ${c} Il mio personaggio è immaginario.`,origin:n=>`Robotito è stato creato in Uruguay. Il mio avatar rappresenta un ${n}, ma questa non è l'origine del software.`,feed:emoji=>`Ecco uno spuntino illustrativo adatto all'avatar: ${emoji}.`,notSafe:emoji=>`Non so se questo alimento sia sicuro. Preferisco mostrare ${emoji}.`},
 de:{identity:n=>`Ich bin Robotito und sehe aus wie ein ${n}. Ich bin ein animierter Avatar, kein echtes Tier.`,habitat:(n,h)=>`Mein Avatar ist ein ${n}. In der Natur lebt diese Art in ${h}. Robotito ist Software, die in Uruguay entwickelt wurde.`,diet:(n,d)=>`Mein ${n}-Avatar steht für ein Tier, dessen Nahrung ${d} umfasst. Das ist nur illustrativ und keine Anleitung zum Füttern echter Tiere.`,family:(n,f)=>`Als ${n} bin ich mit ${f} verwandt.`,habits:(n,c)=>`Eine interessante Eigenschaft meiner Art: ${c} Meine Figur ist erfunden.`,origin:n=>`Robotito wurde in Uruguay entwickelt. Mein Avatar stellt ein ${n} dar; das ist nicht der Ursprung der Tierart.`,feed:emoji=>`Hier ist ein passender illustrativer Snack: ${emoji}.`,notSafe:emoji=>`Ich weiß nicht, ob das Futter sicher ist. Lieber zeige ich ${emoji}.`}
};
function get(id){return data[id]||null;}
function foodEmoji(id){return data[id]?.foodEmoji||'🍎';}
function parseQuestion(raw){const s=norm(raw);if(!s)return null;
 for(const category of ['origin','identity','habitat','diet','family','habits']){
  if(prompts[category].some(re=>re.test(s)))return category;
 }
 return null;
}
function answer(raw,{id='panda',lang='es',name='panda'}={}){
 const kind=parseQuestion(raw),fact=get(id);if(!kind||!fact)return null;
 const l=LANGS.includes(lang)?lang:'es';
 const n=String(name||id).slice(0,90),template=COPY[l][kind];
 const detail=kind==='habitat'?loc(H[fact.habitat],l):kind==='diet'?loc(D[fact.diet],l):kind==='family'?loc(F[fact.family],l):kind==='habits'?loc(C[fact.curiosity],l):null;
 const text=detail===null?template(n):template(n,detail);
 return {handled:true,kind,text};
}
function assertCatalog(requiredIds){const unknown=requiredIds.filter(id=>!data[id]);const invalid=entries.filter(([id,h,d,f,c,emoji])=>!H[h]||!D[d]||!F[f]||!C[c]||!emoji);return {count:entries.length,unknown,invalid:invalid.map(x=>x[0])};}
root.ROBOTITO_SPECIES_KNOWLEDGE={get,foodEmoji,answer,parseQuestion,feedingOffer,assertCatalog,lang:LANGS};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ROBOTITO_SPECIES_KNOWLEDGE;
})(typeof window!=='undefined'?window:globalThis);