// Internationalization shared across interface, commands, and spoken responses.
// Unknown dynamic text is not falsely claimed translated.
(function(root){
"use strict";
const LOCALES={es:"es-UY",en:"en-US",pt:"pt-BR",fr:"fr-FR",it:"it-IT",de:"de-DE"};
const NAMES={
 es:["espanol","español","castellano","spanish","espanhol","espagnol","spagnolo","spanisch"],
 en:["ingles","inglês","english","anglais","inglese","englisch"],
 pt:["portugues","português","portuguese","portugais","portoghese","portugiesisch"],
 fr:["frances","français","francais","french","francese","franzosisch"],
 it:["italiano","italian","italien","italienisch"],
 de:["aleman","alemán","german","allemand","tedesco","deutsch"]
};
const LABELS={
 asrUnsupported:{"es":"Este navegador no ofrece el servicio de reconocimiento de voz.","en":"This browser does not provide speech recognition.","pt":"Este navegador não oferece reconhecimento de voz.","fr":"Ce navigateur ne propose pas de reconnaissance vocale.","it":"Questo browser non offre il riconoscimento vocale.","de":"Dieser Browser unterstützt keine Spracherkennung."},
 asrActivating:{"es":"Activando micrófono…","en":"Activating microphone…","pt":"Ativando microfone…","fr":"Activation du microphone…","it":"Attivazione del microfono…","de":"Mikrofon wird aktiviert…"},
 startupPermissions:{"es":"Pidiendo permisos…","en":"Requesting permissions…","pt":"Solicitando permissões…","fr":"Demande d’autorisations…","it":"Richiesta delle autorizzazioni…","de":"Berechtigungen werden angefordert…"},
 startupRequestingMedia:{"es":"Pidiendo cámara y micrófono…","en":"Requesting camera and microphone…","pt":"Solicitando câmera e microfone…","fr":"Demande d’accès à la caméra et au microphone…","it":"Richiesta di accesso a fotocamera e microfono…","de":"Kamera- und Mikrofonzugriff wird angefordert…"},
 startupMobileHint:{"es":"En celular Robotito usa reconocimiento local continuo. La primera vez puede demorar mientras se prepara el modelo de voz.","en":"On mobile, Robotito uses continuous on-device speech recognition. Preparing the speech model may take a little longer the first time.","pt":"No celular, Robotito usa reconhecimento de voz local contínuo. A primeira preparação do modelo pode demorar.","fr":"Sur mobile, Robotito utilise la reconnaissance vocale continue sur l’appareil. La première préparation du modèle peut prendre du temps.","it":"Su cellulare Robotito usa il riconoscimento vocale continuo sul dispositivo. La prima preparazione del modello può richiedere tempo.","de":"Auf Mobilgeräten verwendet Robotito kontinuierliche Spracherkennung auf dem Gerät. Die erste Vorbereitung des Modells kann etwas dauern."},
 startupListening:{"es":"Cámara y micrófono activos. Escucha local continua encendida.","en":"Camera and microphone active. Continuous local listening is on.","pt":"Câmera e microfone ativos. Escuta local contínua ligada.","fr":"Caméra et microphone actifs. L’écoute locale continue est activée.","it":"Fotocamera e microfono attivi. L’ascolto locale continuo è attivato.","de":"Kamera und Mikrofon sind aktiv. Kontinuierliches lokales Zuhören ist eingeschaltet."},
 startupSpeechFailed:{"es":"Cámara activa, pero falló el reconocimiento local.","en":"Camera active, but local speech recognition failed.","pt":"Câmera ativa, mas o reconhecimento local de voz falhou.","fr":"Caméra active, mais la reconnaissance vocale locale a échoué.","it":"Fotocamera attiva, ma il riconoscimento vocale locale non ha funzionato.","de":"Kamera aktiv, aber die lokale Spracherkennung ist fehlgeschlagen."},
 startupMediaActive:{"es":"Cámara y micrófono activos.","en":"Camera and microphone active.","pt":"Câmera e microfone ativos.","fr":"Caméra et microphone actifs.","it":"Fotocamera e microfono attivi.","de":"Kamera und Mikrofon sind aktiv."},
 startupAwake:{"es":"¡Ya estoy despierto!","en":"I'm awake!","pt":"Já acordei!","fr":"Je suis réveillé !","it":"Sono sveglio!","de":"Ich bin wach!"},
 startupMediaFailed:{"es":"No pude activar cámara y micrófono.","en":"I couldn't activate the camera and microphone.","pt":"Não consegui ativar a câmera e o microfone.","fr":"Je n’ai pas pu activer la caméra et le microphone.","it":"Non sono riuscito ad attivare fotocamera e microfono.","de":"Ich konnte Kamera und Mikrofon nicht aktivieren."},
 startupAllowMedia:{"es":"Permití cámara y micrófono para este sitio.","en":"Allow camera and microphone access for this site.","pt":"Permita o acesso à câmera e ao microfone neste site.","fr":"Autorisez l’accès à la caméra et au microphone pour ce site.","it":"Consenti l’accesso alla fotocamera e al microfono per questo sito.","de":"Erlaube dieser Website den Zugriff auf Kamera und Mikrofon."},
 status:{es:"Estado",en:"Status",pt:"Estado",fr:"État",it:"Stato",de:"Status"},
 people:{es:"Personas",en:"People",pt:"Pessoas",fr:"Personnes",it:"Persone",de:"Personen"},
 memory:{es:"Memoria",en:"Memory",pt:"Memória",fr:"Mémoire",it:"Memoria",de:"Gedächtnis"},
 mood:{es:"Humor",en:"Mood",pt:"Humor",fr:"Humeur",it:"Umore",de:"Stimmung"},
 hunger:{es:"Hambre",en:"Hunger",pt:"Fome",fr:"Faim",it:"Fame",de:"Hunger"},
 vision:{es:"Veo",en:"I see",pt:"Vejo",fr:"Je vois",it:"Vedo",de:"Ich sehe"},
 hearing:{es:"Escucho",en:"I hear",pt:"Escuto",fr:"J'entends",it:"Sento",de:"Ich höre"},
 speaker:{es:"Habla",en:"Speaking",pt:"Falando",fr:"Parole",it:"Parla",de:"Sprecher"},
 pet:{es:"🤍 Acariciar",en:"🤍 Pet",pt:"🤍 Acariciar",fr:"🤍 Caresser",it:"🤍 Accarezza",de:"🤍 Streicheln"},
 feed:{es:"🍓 Alimentar",en:"🍓 Feed",pt:"🍓 Alimentar",fr:"🍓 Nourrir",it:"🍓 Nutri",de:"🍓 Füttern"},
 highfive:{es:"✋ Chocar los cinco",en:"✋ High five",pt:"✋ Toca aqui",fr:"✋ Tape-m'en cinq",it:"✋ Batti cinque",de:"✋ High Five"},
 play:{es:"🧸 Jugar",en:"🧸 Play",pt:"🧸 Brincar",fr:"🧸 Jouer",it:"🧸 Gioca",de:"🧸 Spielen"},
 scare:{es:"👻 Asustar",en:"👻 Surprise",pt:"👻 Assustar",fr:"👻 Surprendre",it:"👻 Sorprendi",de:"👻 Erschrecken"},
 poke:{es:"👉 Molestar",en:"👉 Poke",pt:"👉 Cutucar",fr:"👉 Taquiner",it:"👉 Stuzzica",de:"👉 Anstupsen"},
 typedChat:{es:"Escribile a Robotito",en:"Write to Robotito",pt:"Escreva ao Robotito",fr:"Écris à Robotito",it:"Scrivi a Robotito",de:"Schreibe Robotito"},
 send:{es:"Enviar",en:"Send",pt:"Enviar",fr:"Envoyer",it:"Invia",de:"Senden"},
 whatsHappening:{es:"¿Qué está pasando?",en:"What's happening?",pt:"O que está acontecendo?",fr:"Que se passe-t-il ?",it:"Che succede?",de:"Was passiert gerade?"},
 start:{es:"Despertar sentidos",en:"Wake up senses",pt:"Despertar sentidos",fr:"Activer les sens",it:"Attiva i sensi",de:"Sinne aktivieren"},
 active:{es:"Sentidos activos",en:"Senses active",pt:"Sentidos ativos",fr:"Sens actifs",it:"Sensi attivi",de:"Sinne aktiv"},
 voice:{es:"Voz de Robotito",en:"Robotito's voice",pt:"Voz do Robotito",fr:"Voix de Robotito",it:"Voce di Robotito",de:"Robotitos Stimme"},
 speak:{es:"Hablar en voz alta",en:"Speak aloud",pt:"Falar em voz alta",fr:"Parler à voix haute",it:"Parla ad alta voce",de:"Laut sprechen"},
 selectLanguage:{es:"Idioma",en:"Language",pt:"Idioma",fr:"Langue",it:"Lingua",de:"Sprache"},
 selectVoice:{es:"Voz",en:"Voice",pt:"Voz",fr:"Voix",it:"Voce",de:"Stimme"},
 voiceUnavailable:{es:"No hay una voz disponible para este idioma; Robotito puede mostrar la respuesta por escrito.",en:"No voice is available for this language; Robotito can still show the reply as text.",pt:"Não há voz disponível para este idioma; o Robotito ainda pode mostrar a resposta em texto.",fr:"Aucune voix n’est disponible pour cette langue ; Robotito peut afficher la réponse en texte.",it:"Nessuna voce disponibile per questa lingua; Robotito può comunque mostrare la risposta scritta.",de:"Für diese Sprache ist keine Stimme verfügbar; Robotito kann die Antwort weiterhin als Text anzeigen."},
 voiceStyle:{es:"Estilo de voz",en:"Voice style",pt:"Estilo de voz",fr:"Style vocal",it:"Stile vocale",de:"Stimmstil"},
 pitch:{es:"Tono",en:"Pitch",pt:"Tom",fr:"Hauteur",it:"Tono",de:"Tonhöhe"},
 speed:{es:"Velocidad",en:"Speed",pt:"Velocidade",fr:"Vitesse",it:"Velocità",de:"Geschwindigkeit"},
 testVoice:{es:"Probar voz",en:"Test voice",pt:"Testar voz",fr:"Tester la voix",it:"Prova voce",de:"Stimme testen"},
 class:{es:"Clase",en:"Class",pt:"Aula",fr:"Cours",it:"Lezione",de:"Unterricht"},
 books:{es:"Libros",en:"Books",pt:"Livros",fr:"Livres",it:"Libri",de:"Bücher"},
 memories:{es:"Recuerdos",en:"Memories",pt:"Memórias",fr:"Souvenirs",it:"Ricordi",de:"Erinnerungen"},
 tasks:{es:"Tareas",en:"Tasks",pt:"Tarefas",fr:"Tâches",it:"Compiti",de:"Aufgaben"},
 birthday:{es:"Cumpleaños",en:"Birthday",pt:"Aniversário",fr:"Anniversaire",it:"Compleanno",de:"Geburtstag"},
 today:{es:"Hoy",en:"Today",pt:"Hoje",fr:"Aujourd'hui",it:"Oggi",de:"Heute"},
 noEvidence:{es:"No encontré evidencia suficiente en las fuentes correspondientes.",en:"I couldn't find enough evidence in the relevant sources.",pt:"Não encontrei evidências suficientes nas fontes adequadas.",fr:"Je n'ai pas trouvé suffisamment de preuves dans les sources pertinentes.",it:"Non ho trovato prove sufficienti nelle fonti pertinenti.",de:"Ich habe in den passenden Quellen nicht genügend Belege gefunden."},
 notSure:{es:"No estoy seguro. ¿Podés aclararlo?",en:"I'm not sure. Could you clarify?",pt:"Não tenho certeza. Você pode esclarecer?",fr:"Je ne suis pas sûr. Peux-tu préciser ?",it:"Non sono sicuro. Puoi chiarire?",de:"Ich bin mir nicht sicher. Kannst du das präzisieren?"},
 greeting:{es:"¡Hola! Soy Robotito.",en:"Hello! I'm Robotito.",pt:"Olá! Sou o Robotito.",fr:"Bonjour ! Je suis Robotito.",it:"Ciao! Sono Robotito.",de:"Hallo! Ich bin Robotito."},
 languageSet:{es:"Perfecto, ahora hablamos en español.",en:"All right, we'll speak in English.",pt:"Perfeito, agora vamos falar em português.",fr:"D'accord, nous allons parler français.",it:"Va bene, parleremo in italiano.",de:"Alles klar, wir sprechen jetzt Deutsch."},
 synthesised:{es:"Voz sintetizada; no es una grabación de una persona real.",en:"Synthetic voice; not a recording of a real person.",pt:"Voz sintetizada; não é a gravação de uma pessoa real.",fr:"Voix synthétique ; ce n'est pas l'enregistrement d'une vraie personne.",it:"Voce sintetica; non è una registrazione di una persona reale.",de:"Synthetische Stimme; keine Aufnahme einer echten Person."},
 audioModelOptIn:{es:"Activar clasificación avanzada de sonidos (modelo descargado)",en:"Enable advanced sound classification (downloads model)",pt:"Ativar classificação avançada de sons (baixa modelo)",fr:"Activer la classification avancée des sons (télécharge un modèle)",it:"Attiva la classificazione avanzata dei suoni (scarica modello)",de:"Erweiterte Geräuscherkennung aktivieren (Modell-Download)"},
 audioModelPrivacy:{es:"Opcional: descarga YAMNet y MediaPipe de terceros, que pueden recopilar métricas de uso. El audio se clasifica en tu dispositivo; no se envían grabaciones al servidor.",en:"Optional: downloads third-party YAMNet and MediaPipe, which may collect usage metrics. Audio is classified on your device; recordings are not uploaded.",pt:"Opcional: baixa YAMNet e MediaPipe de terceiros, que podem coletar métricas de uso. O áudio é classificado no dispositivo; gravações não são enviadas.",fr:"Facultatif : télécharge YAMNet et MediaPipe de tiers qui peuvent recueillir des métriques d'utilisation. L'audio est classé sur l'appareil, sans envoi des enregistrements.",it:"Opzionale: scarica YAMNet e MediaPipe di terze parti, che possono raccogliere metriche d'uso. L'audio è classificato sul dispositivo, senza inviare registrazioni.",de:"Optional: lädt YAMNet und MediaPipe von Drittanbietern, die Nutzungsmetriken erfassen können. Audio wird auf dem Gerät eingestuft; Aufnahmen werden nicht hochgeladen."},
 audioModelOff:{es:"Clasificador avanzado desactivado.",en:"Advanced classifier disabled.",pt:"Classificador avançado desativado.",fr:"Classificateur avancé désactivé.",it:"Classificatore avanzato disattivato.",de:"Erweiterte Klassifikation deaktiviert."},
 audioModelLoading:{es:"Descargando modelo de sonido…",en:"Downloading sound model…",pt:"Baixando modelo de som…",fr:"Téléchargement du modèle audio…",it:"Download del modello audio…",de:"Audiomodell wird heruntergeladen…"},
 audioModelReady:{es:"Modelo activo: clasificación tentativa, sin reacciones automáticas.",en:"Model active: tentative detection, no automatic reactions.",pt:"Modelo ativo: detecção provisória, sem reações automáticas.",fr:"Modèle actif : détection provisoire, aucune réaction automatique.",it:"Modello attivo: rilevamento provvisorio, senza reazioni automatiche.",de:"Modell aktiv: vorläufige Erkennung, keine automatischen Reaktionen."},
 audioModelError:{es:"No se pudo cargar el modelo opcional.",en:"Optional model could not be loaded.",pt:"Não foi possível carregar o modelo opcional.",fr:"Impossible de charger le modèle facultatif.",it:"Impossibile caricare il modello opzionale.",de:"Das optionale Modell konnte nicht geladen werden."},
 audioModelCaptureUnsupported:{es:"La captura avanzada de audio no está disponible en este navegador.",en:"Advanced audio capture is not available in this browser.",pt:"A captura avançada de áudio não está disponível neste navegador.",fr:"La capture audio avancée n'est pas disponible dans ce navigateur.",it:"La cattura audio avanzata non è disponibile in questo browser.",de:"Erweiterte Audioaufnahme ist in diesem Browser nicht verfügbar."},
  audioModelMicrophoneUnavailable:{es:"El micrófono se desconectó; se detuvo la escucha avanzada.",en:"Microphone disconnected; advanced listening stopped.",pt:"O microfone foi desconectado; a escuta avançada foi interrompida.",fr:"Le microphone a été déconnecté ; l'écoute avancée s'est arrêtée.",it:"Microfono disconnesso; ascolto avanzato interrotto.",de:"Mikrofon getrennt; erweitertes Zuhören wurde beendet."},
 audioModelPossible:{es:"Posible sonido",en:"Possible sound",pt:"Som possível",fr:"Son possible",it:"Suono possibile",de:"Mögliches Geräusch"},
 soundSilence:{es:"silencio",en:"silence",pt:"silêncio",fr:"silence",it:"silenzio",de:"Stille"},
 soundNoise:{es:"ruido",en:"noise",pt:"ruído",fr:"bruit",it:"rumore",de:"Geräusch"},
 soundUnknown:{es:"sonido",en:"sound",pt:"som",fr:"son",it:"suono",de:"Ton"},
 soundVoice:{es:"voz",en:"voice",pt:"voz",fr:"voix",it:"voce",de:"Stimme"},
 soundMusic:{es:"música",en:"music",pt:"música",fr:"musique",it:"musica",de:"Musik"},
 soundImpact:{es:"golpe",en:"impact",pt:"impacto",fr:"choc",it:"colpo",de:"Aufprall"},
 soundClap:{es:"aplausos",en:"clapping",pt:"palmas",fr:"applaudissements",it:"applausi",de:"Applaus"},
 soundLaugh:{es:"risa",en:"laughter",pt:"riso",fr:"rire",it:"risata",de:"Lachen"},
 soundCry:{es:"llanto",en:"crying",pt:"choro",fr:"pleurs",it:"pianto",de:"Weinen"},
 soundCough:{es:"tos",en:"cough",pt:"tosse",fr:"toux",it:"tosse",de:"Husten"},
 soundSneeze:{es:"estornudo",en:"sneeze",pt:"espirro",fr:"éternuement",it:"starnuto",de:"Niesen"},
 soundComfort:{es:"¿Está todo bien?",en:"Is everything okay?",pt:"Está tudo bem?",fr:"Est-ce que tout va bien ?",it:"Va tutto bene?",de:"Ist alles in Ordnung?"},
 bless:{es:"¡Salud!",en:"Bless you!",pt:"Saúde!",fr:"À tes souhaits !",it:"Salute!",de:"Gesundheit!"},
 weatherUnavailable:{es:"No pude consultar el clima ahora.",en:"I couldn't check the weather right now.",pt:"Não consegui consultar o tempo agora.",fr:"Je n'ai pas pu consulter la météo.",it:"Non sono riuscito a controllare il meteo.",de:"Ich konnte das Wetter gerade nicht abrufen."},
 noPermission:{es:"Necesito permiso del micrófono.",en:"Microphone permission is needed.",pt:"Preciso da permissão do microfone.",fr:"L'autorisation du micro est nécessaire.",it:"Serve il permesso per il microfono.",de:"Mikrofonberechtigung erforderlich."},
 noBattery:{es:"No puedo consultar el porcentaje de batería en este dispositivo.",en:"I can't access the battery percentage on this device.",pt:"Não consigo acessar a bateria neste dispositivo.",fr:"Je ne peux pas accéder au niveau de batterie sur cet appareil.",it:"Non posso leggere la batteria di questo dispositivo.",de:"Ich kann den Akkustand dieses Geräts nicht lesen."}
};
function fold(x){return String(x||"").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function supported(code){return Object.prototype.hasOwnProperty.call(LOCALES,code);}
function t(key,lang="es"){return LABELS[key]?.[lang]||LABELS[key]?.es||key;}
function parseCommand(raw){
 const q=fold(raw).trim().replace(/^[¿?¡!\s]+/,""),words=q.split(/\s+/);
 if(words.length>24||words.length===0)return null;
 const desire=/\b(habl(?:a|ame|ar|amos|e)?|respond(?:e|eme|er|a)?|contest(?:a|ame|ar)|cambi(?:a|ame|ar|emos)|pas(?:emos|amos)|desde ahora|a partir de ahora|quiero practicar|quiero aprender|volv(?:e|er|amos)|solamente|solo en|english please|please speak|speak|switch|change|answer|from now on|parler|parlez|fale|responda|francais svp|deutsch bitte|auf|parla|sprich|praticar|practicar|practise|practice)\b/;
 if(!desire.test(q))return null;
 let lang=null;for(const [code,names] of Object.entries(NAMES)){
  if(names.some(name=>new RegExp("(?:^|\\s)"+fold(name)+"(?:\\s|[.!?]|$)").test(q))){lang=code;break;}
 }
 if(!lang)return null;
 // An incidental language mention in a class/topic question is not a command.
 if(/\b(clase de|curso de|examen de|historia del|translation of|traducir del)\b/.test(q)||/^(que dijo|que significa|what did|what is|por que)/.test(q))return null;
 const scope=/\b(solo esta vez|una sola respuesta|esta respuesta|just once|only this time|apenas desta vez|juste cette fois)\b/.test(q)?"once":
 /(?:por esta sesion|durante esta sesion|this session|esta sessao|cette session)/.test(q)?"session":"persistent";
 return {language:lang,scope,confidence:.94};
}
function apply(lang,rootElement){
 if(!supported(lang))return false;
 const doc=rootElement||root.document;
 if(!doc)return false;
 if(doc.documentElement)doc.documentElement.lang=lang;
 for(const el of doc.querySelectorAll("[data-i18n]")){
  const key=el.getAttribute("data-i18n");
  if(key&&LABELS[key])el.textContent=t(key,lang);
 }
 for(const el of doc.querySelectorAll("[data-i18n-title]")){
  el.title=t(el.getAttribute("data-i18n-title"),lang);
 }
 return true;
}
root.ROBOTITO_I18N={supported,locale:code=>LOCALES[code]||LOCALES.es,t,parseCommand,apply,languages:Object.keys(LOCALES)};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_I18N;
})(typeof window!=="undefined"?window:globalThis);