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
 prepareLocalized:{es:"Preparando la respuesta…",en:"Preparing the answer…",pt:"Preparando a resposta…",fr:"Préparation de la réponse…",it:"Preparazione della risposta…",de:"Antwort wird vorbereitet…"},
 uiUnderstood:{"es":"Última cosa que entendí","en":"Last thing understood","pt":"Última coisa entendida","fr":"Dernière chose comprise","it":"Ultima cosa capita","de":"Zuletzt verstanden"},
 uiClassMode:{"es":"Modo clase","en":"Class mode","pt":"Modo aula","fr":"Mode cours","it":"Modalità lezione","de":"Unterrichtsmodus"},
 uiSubject:{"es":"Materia","en":"Subject","pt":"Matéria","fr":"Matière","it":"Materia","de":"Fach"},
 uiClassTopic:{"es":"Tema de esta clase","en":"Topic of this class","pt":"Tema desta aula","fr":"Sujet de ce cours","it":"Argomento di questa lezione","de":"Thema dieser Unterrichtsstunde"},
 uiStartClass:{"es":"▶ Empezar clase","en":"▶ Start class","pt":"▶ Iniciar aula","fr":"▶ Commencer le cours","it":"▶ Inizia lezione","de":"▶ Unterricht starten"},
 uiStopClass:{"es":"■ Terminar clase","en":"■ End class","pt":"■ Encerrar aula","fr":"■ Terminer le cours","it":"■ Termina lezione","de":"■ Unterricht beenden"},
 uiSavedClasses:{"es":"Clases guardadas","en":"Saved classes","pt":"Aulas salvas","fr":"Cours enregistrés","it":"Lezioni salvate","de":"Gespeicherte Unterrichtsstunden"},
 uiClassEdit:{"es":"Editar datos de la clase","en":"Edit class details","pt":"Editar dados da aula","fr":"Modifier les informations du cours","it":"Modifica i dati della lezione","de":"Unterrichtsdaten bearbeiten"},
 uiTopic:{"es":"Tema","en":"Topic","pt":"Tema","fr":"Sujet","it":"Argomento","de":"Thema"},
 uiDateTime:{"es":"Fecha y hora","en":"Date and time","pt":"Data e hora","fr":"Date et heure","it":"Data e ora","de":"Datum und Uhrzeit"},
 uiCancel:{"es":"Cancelar","en":"Cancel","pt":"Cancelar","fr":"Annuler","it":"Annulla","de":"Abbrechen"},
 uiSaveChanges:{"es":"Guardar cambios","en":"Save changes","pt":"Salvar alterações","fr":"Enregistrer les modifications","it":"Salva modifiche","de":"Änderungen speichern"},
 uiClassRecordings:{"es":"Grabaciones de clase","en":"Class recordings","pt":"Gravações de aula","fr":"Enregistrements de cours","it":"Registrazioni delle lezioni","de":"Unterrichtsaufnahmen"},
 uiLearned:{"es":"Lo que aprendió","en":"What it learned","pt":"O que aprendeu","fr":"Ce qu’il a appris","it":"Ciò che ha imparato","de":"Was es gelernt hat"},
 uiRefreshSummary:{"es":"Actualizar resumen","en":"Refresh summary","pt":"Atualizar resumo","fr":"Actualiser le résumé","it":"Aggiorna il riassunto","de":"Zusammenfassung aktualisieren"},
 uiVideoTitle:{"es":"Video de YouTube","en":"YouTube video","pt":"Vídeo do YouTube","fr":"Vidéo YouTube","it":"Video YouTube","de":"YouTube-Video"},
 uiVideoURL:{"es":"Enlace del video","en":"Video link","pt":"Link do vídeo","fr":"Lien de la vidéo","it":"Link del video","de":"Videolink"},
 uiVideoName:{"es":"Título del video","en":"Video title","pt":"Título do vídeo","fr":"Titre de la vidéo","it":"Titolo del video","de":"Videotitel"},
 uiYoutubeOpen:{"es":"Abrir en YouTube","en":"Open in YouTube","pt":"Abrir no YouTube","fr":"Ouvrir sur YouTube","it":"Apri su YouTube","de":"Auf YouTube öffnen"},
 uiVideoStop:{"es":"■ Terminar video","en":"■ Stop video","pt":"■ Encerrar vídeo","fr":"■ Arrêter la vidéo","it":"■ Ferma video","de":"■ Video beenden"},
 uiUploadMaterials:{"es":"Cargar material académico","en":"Upload study materials","pt":"Enviar materiais de estudo","fr":"Importer des supports de cours","it":"Carica materiali di studio","de":"Lernmaterial hochladen"},
 uiAskClasses:{"es":"Preguntarle sobre clases","en":"Ask about classes","pt":"Perguntar sobre aulas","fr":"Poser des questions sur les cours","it":"Chiedi delle lezioni","de":"Fragen zum Unterricht"},
 uiAsk:{"es":"Preguntar","en":"Ask","pt":"Perguntar","fr":"Poser une question","it":"Chiedi","de":"Fragen"},
 uiFlashcards:{"es":"Tarjetas de estudio","en":"Study cards","pt":"Cartões de estudo","fr":"Fiches de révision","it":"Schede di studio","de":"Lernkarten"},
 uiVisualMath:{"es":"Matemática visual","en":"Visual mathematics","pt":"Matemática visual","fr":"Mathématiques visuelles","it":"Matematica visiva","de":"Visuelle Mathematik"},
 uiRecognizeObject:{"es":"Reconocer objeto","en":"Recognize object","pt":"Reconhecer objeto","fr":"Reconnaître l’objet","it":"Riconosci oggetto","de":"Objekt erkennen"},
 uiTasksSheet:{"es":"Tu hoja de tareas","en":"Your task sheet","pt":"Sua planilha de tarefas","fr":"Ta feuille de tâches","it":"Il tuo elenco di compiti","de":"Deine Aufgabenliste"},
 uiConnectTasks:{"es":"Conectar tareas","en":"Connect tasks","pt":"Conectar tarefas","fr":"Connecter les tâches","it":"Collega attività","de":"Aufgaben verbinden"},
 uiPendingTasks:{"es":"Pendientes","en":"Pending","pt":"Pendentes","fr":"En attente","it":"Da fare","de":"Offen"},
 uiRefresh:{"es":"Actualizar","en":"Refresh","pt":"Atualizar","fr":"Actualiser","it":"Aggiorna","de":"Aktualisieren"},
 uiRegisterPerson:{"es":"Registrar una persona","en":"Register a person","pt":"Cadastrar uma pessoa","fr":"Enregistrer une personne","it":"Registra una persona","de":"Person registrieren"},
 uiName:{"es":"Nombre","en":"Name","pt":"Nome","fr":"Nom","it":"Nome","de":"Name"},
 uiBirthday:{"es":"Cumpleaños","en":"Birthday","pt":"Aniversário","fr":"Anniversaire","it":"Compleanno","de":"Geburtstag"},
 uiEnroll:{"es":"Registrar cara y voz","en":"Register face and voice","pt":"Registrar rosto e voz","fr":"Enregistrer visage et voix","it":"Registra volto e voce","de":"Gesicht und Stimme registrieren"},
 uiPeopleRemembered:{"es":"Personas que recuerda","en":"Remembered people","pt":"Pessoas lembradas","fr":"Personnes reconnues","it":"Persone ricordate","de":"Gemerkte Personen"},
 uiMyBooks:{"es":"Tu biblioteca (opcional)","en":"Your library (optional)","pt":"Sua biblioteca (opcional)","fr":"Ta bibliothèque (facultatif)","it":"La tua biblioteca (facoltativa)","de":"Deine Bibliothek (optional)"},
 uiReadingChoice:{"es":"¿Qué querés leer?","en":"What would you like to read?","pt":"O que você quer ler?","fr":"Que veux-tu lire ?","it":"Che cosa vuoi leggere?","de":"Was möchtest du lesen?"},
 uiDescription:{"es":"Descripción","en":"Description","pt":"Descrição","fr":"Description","it":"Descrizione","de":"Beschreibung"},
 uiBookRecommendations:{"es":"Buscar recomendaciones","en":"Find recommendations","pt":"Buscar recomendações","fr":"Chercher des recommandations","it":"Cerca consigli","de":"Empfehlungen finden"},
 uiAutoMemory:{"es":"Memoria automática","en":"Automatic memory","pt":"Memória automática","fr":"Mémoire automatique","it":"Memoria automatica","de":"Automatischer Speicher"},
 uiAddMemory:{"es":"Agregar un recuerdo manual","en":"Add a memory manually","pt":"Adicionar uma lembrança","fr":"Ajouter un souvenir","it":"Aggiungi un ricordo","de":"Erinnerung hinzufügen"},
 uiSaveMemory:{"es":"Guardar recuerdo","en":"Save memory","pt":"Salvar lembrança","fr":"Enregistrer le souvenir","it":"Salva ricordo","de":"Erinnerung speichern"},
 uiMemories:{"es":"Recuerdos","en":"Memories","pt":"Lembranças","fr":"Souvenirs","it":"Ricordi","de":"Erinnerungen"},
 uiDeleteMemory:{"es":"Borrar recuerdos","en":"Delete memories","pt":"Apagar lembranças","fr":"Supprimer les souvenirs","it":"Elimina ricordi","de":"Erinnerungen löschen"},
 uiVoiceSampleTitle:{"es":"Muestra voluntaria de voz (sin clonación)","en":"Voluntary voice sample (no cloning)","pt":"Amostra voluntária de voz (sem clonagem)","fr":"Échantillon vocal volontaire (sans clonage)","it":"Campione vocale volontario (senza clonazione)","de":"Freiwillige Stimmprobe (kein Klonen)"},
 uiRecordSample:{"es":"Grabar muestra (3 segundos)","en":"Record sample (3 seconds)","pt":"Gravar amostra (3 segundos)","fr":"Enregistrer un échantillon (3 secondes)","it":"Registra campione (3 secondi)","de":"Probe aufnehmen (3 Sekunden)"},
 uiDeleteSample:{"es":"Eliminar muestra","en":"Delete sample","pt":"Excluir amostra","fr":"Supprimer l’échantillon","it":"Elimina campione","de":"Sprachprobe löschen"},
 avatarAvailable:{"es":"Avatares disponibles","en":"Available avatars","pt":"Avatares disponíveis","fr":"Avatars disponibles","it":"Avatar disponibili","de":"Verfügbare Avatare"},
 avatarStepTitle:{"es":"Elegí el avatar de Robotito","en":"Choose Robotito's avatar","pt":"Escolha o avatar do Robotito","fr":"Choisis l’avatar de Robotito","it":"Scegli l’avatar di Robotito","de":"Wähle Robotitos Avatar"},
 avatarStepDescription:{"es":"Elegí el amigo que querés ver. Se guardará en este dispositivo.","en":"Choose the friend you want to see. Your choice will be saved on this device.","pt":"Escolha o amigo que você quer ver. Sua escolha ficará salva neste dispositivo.","fr":"Choisis ton compagnon. Ton choix sera enregistré sur cet appareil.","it":"Scegli il tuo compagno. La scelta verrà salvata su questo dispositivo.","de":"Wähle deinen Begleiter. Die Auswahl wird auf diesem Gerät gespeichert."},
 avatarBack:{"es":"Volver al idioma","en":"Back to language","pt":"Voltar ao idioma","fr":"Retour à la langue","it":"Torna alla lingua","de":"Zurück zur Sprache"},
 avatarReady:{"es":"Robotito está listo para despertarse.","en":"Robotito is ready to wake up.","pt":"Robotito está pronto para despertar.","fr":"Robotito est prêt à se réveiller.","it":"Robotito è pronto a svegliarsi.","de":"Robotito ist bereit aufzuwachen."},
 voiceSampleRequesting:{"es":"Pidiendo permiso para grabar…","en":"Requesting recording permission…","pt":"Solicitando permissão para gravar…","fr":"Demande d’autorisation d’enregistrement…","it":"Richiesta del permesso di registrazione…","de":"Aufnahmeberechtigung wird angefordert…"},
 voiceSampleRecording:{"es":"Grabando durante tres segundos…","en":"Recording for three seconds…","pt":"Gravando por três segundos…","fr":"Enregistrement de trois secondes…","it":"Registrazione per tre secondi…","de":"Aufnahme für drei Sekunden…"},
 voiceSampleSaving:{"es":"Guardando la muestra localmente…","en":"Saving the sample locally…","pt":"Salvando a amostra localmente…","fr":"Enregistrement local de l’échantillon…","it":"Salvataggio locale del campione…","de":"Sprachprobe wird lokal gespeichert…"},
 voiceSampleSaved:{"es":"Muestra local guardada; la voz no se clona.","en":"Local sample saved; no voice cloning.","pt":"Amostra local salva; sem clonagem de voz.","fr":"Échantillon local enregistré ; aucune imitation vocale.","it":"Campione locale salvato; nessuna clonazione vocale.","de":"Lokale Sprachprobe gespeichert; keine Stimmklonung."},
 voiceSampleDiscarded:{"es":"Grabación cancelada y descartada.","en":"Recording canceled and discarded.","pt":"Gravação cancelada e descartada.","fr":"Enregistrement annulé et supprimé.","it":"Registrazione annullata e scartata.","de":"Aufnahme abgebrochen und verworfen."},
 voiceSampleDeleted:{"es":"Muestra eliminada del almacenamiento local.","en":"Sample deleted from local storage.","pt":"Amostra excluída do armazenamento local.","fr":"Échantillon supprimé du stockage local.","it":"Campione eliminato dalla memoria locale.","de":"Sprachprobe aus dem lokalen Speicher gelöscht."},
 voiceSampleError:{"es":"No pude guardar la muestra; revisá los permisos.","en":"Couldn't save the sample; check permissions.","pt":"Não foi possível salvar a amostra; verifique as permissões.","fr":"Impossible d’enregistrer l’échantillon ; vérifiez les autorisations.","it":"Impossibile salvare il campione; controlla i permessi.","de":"Sprachprobe konnte nicht gespeichert werden; Berechtigungen prüfen."},
 voiceSampleNeedsName:{"es":"Indicá quién autorizó esta grabación y confirmá su consentimiento.","en":"Name the consenting person and confirm explicit permission.","pt":"Informe quem autorizou a gravação e confirme o consentimento.","fr":"Indiquez la personne qui a consenti et confirmez son autorisation.","it":"Indica chi ha dato il consenso e conferma l’autorizzazione.","de":"Bitte Namen und ausdrückliche Zustimmung der Person angeben."},
 voiceSampleNeedsConsent:{"es":"Confirmá el consentimiento antes de grabar.","en":"Confirm consent before recording.","pt":"Confirme o consentimento antes de gravar.","fr":"Confirmez le consentement avant d’enregistrer.","it":"Conferma il consenso prima di registrare.","de":"Vor der Aufnahme die Einwilligung bestätigen."},
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
const FIXED_REPLIES=[{"es":"Ya puedo hablar de nuevo.","en":"I can speak again.","pt":"Já posso falar de novo.","fr":"Je peux parler à nouveau.","it":"Posso parlare di nuovo.","de":"Ich kann wieder sprechen."},{"es":"Todavía no importaste tu biblioteca de Goodreads.","en":"You haven't imported your Goodreads library yet.","pt":"Você ainda não importou sua biblioteca do Goodreads.","fr":"Tu n’as pas encore importé ta bibliothèque Goodreads.","it":"Non hai ancora importato la tua libreria Goodreads.","de":"Du hast deine Goodreads-Bibliothek noch nicht importiert."},{"es":"No tengo tu cumpleaños registrado.","en":"I don't have your birthday saved.","pt":"Ainda não tenho seu aniversário registrado.","fr":"Je n’ai pas enregistré ton anniversaire.","it":"Non ho ancora registrato il tuo compleanno.","de":"Ich habe deinen Geburtstag noch nicht gespeichert."},{"es":"Hoy todavía no escuché ninguna clase.","en":"I haven't listened to a class today yet.","pt":"Ainda não ouvi nenhuma aula hoje.","fr":"Je n’ai pas encore écouté de cours aujourd’hui.","it":"Oggi non ho ancora ascoltato lezioni.","de":"Ich habe heute noch keinen Unterricht gehört."},{"es":"Ahora mismo no veo a nadie.","en":"I can't see anyone right now.","pt":"Não vejo ninguém agora.","fr":"Je ne vois personne pour le moment.","it":"Al momento non vedo nessuno.","de":"Ich sehe gerade niemanden."},{"es":"Ahora mismo no veo ninguna mano.","en":"I can't see any hands right now.","pt":"Não vejo nenhuma mão agora.","fr":"Je ne vois aucune main pour le moment.","it":"Al momento non vedo nessuna mano.","de":"Ich sehe gerade keine Hand."},{"es":"No tengo una edad humana. Soy una mascota virtual.","en":"I don't have a human age. I'm a virtual pet.","pt":"Não tenho uma idade humana. Sou um bichinho virtual.","fr":"Je n’ai pas d’âge humain. Je suis un compagnon virtuel.","it":"Non ho un’età umana. Sono un animaletto virtuale.","de":"Ich habe kein menschliches Alter. Ich bin ein virtuelles Haustier."},{"es":"Soy Robotito, un panda virtual.","en":"I'm Robotito, a virtual panda.","pt":"Sou o Robotito, um panda virtual.","fr":"Je suis Robotito, un panda virtuel.","it":"Sono Robotito, un panda virtuale.","de":"Ich bin Robotito, ein virtueller Panda."},{"es":"Estoy durmiendo.","en":"I'm sleeping.","pt":"Estou dormindo.","fr":"Je dors.","it":"Sto dormendo.","de":"Ich schlafe."},{"es":"Estoy bailando porque detecté música.","en":"I'm dancing because I detected music.","pt":"Estou dançando porque detectei música.","fr":"Je danse parce que j’ai détecté de la musique.","it":"Sto ballando perché ho rilevato della musica.","de":"Ich tanze, weil ich Musik erkannt habe."},{"es":"No encontré información suficiente para contestar eso.","en":"I couldn't find enough information to answer that.","pt":"Não encontrei informações suficientes para responder.","fr":"Je n’ai pas trouvé assez d’informations pour répondre.","it":"Non ho trovato informazioni sufficienti per rispondere.","de":"Ich habe nicht genug Informationen gefunden, um das zu beantworten."},{"es":"No encontré evidencia suficiente en las transcripciones para contestar eso.","en":"I couldn't find enough evidence in the transcripts to answer that.","pt":"Não encontrei evidências suficientes nas transcrições para responder.","fr":"Je n’ai pas trouvé assez d’éléments dans les transcriptions pour répondre.","it":"Non ho trovato abbastanza elementi nelle trascrizioni per rispondere.","de":"Ich habe in den Transkripten nicht genug Belege gefunden, um das zu beantworten."},{"es":"No encontré ese cumpleaños entre las personas registradas.","en":"I couldn't find that birthday among registered people.","pt":"Não encontrei esse aniversário entre as pessoas cadastradas.","fr":"Je n’ai pas trouvé cet anniversaire parmi les personnes enregistrées.","it":"Non ho trovato quel compleanno tra le persone registrate.","de":"Ich habe diesen Geburtstag bei den registrierten Personen nicht gefunden."},{"es":"No veo tareas pendientes en la hoja conectada.","en":"I don't see any pending tasks in the connected sheet.","pt":"Não vejo tarefas pendentes na planilha conectada.","fr":"Je ne vois aucune tâche en attente dans la feuille connectée.","it":"Non vedo attività in sospeso nel foglio collegato.","de":"Ich sehe keine offenen Aufgaben in der verbundenen Tabelle."},{"es":"No tengo registrada una comida todavía.","en":"I haven't recorded a meal yet.","pt":"Ainda não registrei nenhuma refeição.","fr":"Je n’ai pas encore enregistré de repas.","it":"Non ho ancora registrato un pasto.","de":"Ich habe noch keine Mahlzeit erfasst."},{"es":"No pude encontrar una recomendación ahora mismo.","en":"I couldn't find a recommendation right now.","pt":"Não consegui encontrar uma recomendação agora.","fr":"Je n’ai pas trouvé de recommandation pour le moment.","it":"Non sono riuscito a trovare un consiglio al momento.","de":"Ich konnte gerade keine Empfehlung finden."},{"es":"Entendido, no voy a hacer eso.","en":"Understood, I won't do that.","pt":"Entendido, não vou fazer isso.","fr":"Compris, je ne le ferai pas.","it":"Capito, non lo farò.","de":"Verstanden, das werde ich nicht tun."},{"es":"Todavía no había dicho nada.","en":"I hadn't said anything yet.","pt":"Ainda não tinha dito nada.","fr":"Je n’avais encore rien dit.","it":"Non avevo ancora detto nulla.","de":"Ich hatte noch nichts gesagt."}];
function fixedReply(text,language="es"){
 if(!supported(language))return null;
 const clean=String(text||"").trim();
 if(!clean)return null;
 const row=FIXED_REPLIES.find(entry=>Object.values(entry).includes(clean));
 return row?.[language]||null;
}
function fold(x){return String(x||"").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function supported(code){return Object.prototype.hasOwnProperty.call(LOCALES,code);}
function t(key,lang="es"){return LABELS[key]?.[lang]||LABELS[key]?.es||key;}
function parseCommand(raw){
 const q=fold(raw).trim().replace(/^[¿?¡!\s]+/,""),words=q.split(/\s+/);
 if(words.length>24||words.length===0)return null;
 const desire=/\b(habl(?:a|ame|ar|amos|e)?|respond(?:e|eme|er|a)?|contest(?:a|ame|ar)|cambi(?:a|ame|ar|emos)|pas(?:emos|amos)|desde ahora|a partir de ahora|quiero practicar|quiero aprender|volv(?:e|er|amos)|solamente|solo en|english please|please speak|speak|switch|change|answer|from now on|parler|parlez|fale|responda|francais svp|deutsch bitte|auf|parla|sprich|sprech(?:e|en|t|st)?|antwort(?:e|en|est|et)?|repond(?:s|ez|re)?|praticar|practicar|practise|practice)\b/;
 // Reported commands and explicit negative requests are not language changes.
 if(/\b(?:teacher|profesora?|maestra?|dijo|dijeron|said|told|quoted|lehrer|professeur)\b/.test(q))return null;
 const prohibited=/(?:^|\s)(?:don't|do not|never|nao|non|nicht|nunca)\b(?:[\s,]+\S+){0,3}[\s,]+(?:speak\w*|switch\w*|change\w*|answer\w*|fal\w*|parl\w*|repond\w*|habl\w*|respond\w*|cambi\w*|sprech\w*|sprich|antwort\w*|auf)\b/;
 if(prohibited.test(q)||/\bno\s+(?:(?:me|nos|les|te)\s+)?(?:habl\w*|respond\w*|contest\w*|cambi\w*)\b/.test(q)||
    /\bne\s+(?:me\s+)?(?:parl\w*|repond\w*)\s+pas\b/.test(q))return null;
 if(!desire.test(q))return null;
 let lang=null;for(const [code,names] of Object.entries(NAMES)){
  if(names.some(name=>new RegExp("(?:^|\\s)"+fold(name)+"(?:\\s|[.!?]|$)").test(q))){lang=code;break;}
 }
 if(!lang)return null;
 // An incidental language mention in a class/topic question is not a command.
 if(/\b(clase de|curso de|examen de|historia del|translation of|traducir del)\b/.test(q)||/^(que dijo|que significa|what did|what is|por que)/.test(q))return null;
 const scope=/\b(solo esta vez|una sola respuesta|esta respuesta|just once|only this time|apenas desta vez|juste cette fois|solo questa volta|nur dieses mal|nur einmal)\b/.test(q)?"once":
 /(?:por esta sesion|durante esta sesion|this session|esta sessao|cette session|per questa sessione|fur diese sitzung|in dieser sitzung)/.test(q)?"session":"persistent";
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
root.ROBOTITO_I18N={supported,locale:code=>LOCALES[code]||LOCALES.es,t,fixedReply,parseCommand,apply,languages:Object.keys(LOCALES)};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_I18N;
})(typeof window!=="undefined"?window:globalThis);