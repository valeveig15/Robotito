// Robotito — semantic emotional reactions to things people say.
(()=>{
  "use strict";
  let reactionToken=0;

  function normalize(input){
    return String(input||"")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/(.)\1{2,}/g,"$1$1")
      .replace(/\b(?:mounstro|monstro|mostruo|mostro|mosntruo)\b/g,"monstruo")
      .replace(/\b(?:tullo|tuyo|tuio)\b/g,"tuyo")
      .replace(/\b(?:atraz|detrasito)\b/g,"atras")
      .replace(/\b(?:kiero|quero)\b/g,"quiero")
      .replace(/\b(?:cayas|cayate|callate)\b/g,"callate")
      .replace(/[^a-z0-9ñ\s]/g," ")
      .replace(/\s+/g," ")
      .trim();
  }
  function words(text){return new Set(normalize(text).split(" ").filter(Boolean));}
  function any(text,patterns){return patterns.some(re=>re.test(text));}
  function hasAny(set,list){return list.some(word=>set.has(word));}

  function isQuotedOrAcademic(text){
    return /^(?:que significa|que quiere decir|como se dice|como se escribe|traduce|traduci|repeti|repite|dame un ejemplo|la frase)\b/.test(text)
      || /\b(?:significado|traduccion|transcripcion)\s+de\b/.test(text);
  }

  const DETECTORS=[
    {
      id:"reassurance",mood:"calm",delta:2,duration:4200,
      bond:{trust:.25,fear:-.65,irritation:-.15},
      strong:[
        /\b(?:no hay|no existe|no era|era (?:una )?broma|estaba bromeando) (?:ningun )?(?:monstruo|fantasma|peligro)\b/,
        /\b(?:tranquilo|calmate|no tengas miedo|estas a salvo|yo te cuido|te voy a cuidar)\b/
      ]
    },
    {
      id:"fear",mood:"scared",delta:-2,duration:6500,
      bond:{trust:-.08,fear:.28},
      strong:[
        /\b(?:hay|tenes|tienes|veo|esta|aparecio) (?:un |una |algo )?(?:monstruo|fantasma|demonio|zombi|criatura|sombra)\b/,
        /\b(?:monstruo|fantasma|demonio|zombi|criatura|sombra)\b.{0,35}\b(?:atras|detras|cerca|al lado|arriba|abajo|viene|mira)\b/,
        /\b(?:atras|detras) (?:de )?(?:ti|tuyo|tuya)\b/,
        /\b(?:cuidado|corre|escondete|te van a atacar|te va a atacar|viene por ti|viene por vos)\b/,
        /\b(?:te voy a|voy a) (?:romper|golpear|borrar|destruir|apagar para siempre)\b/
      ],
      combos:[
        [["monstruo","fantasma","criatura","sombra"],["atras","detras","cerca","viene"]],
        [["cuidado","corre","escondete"],["peligro","ataque","monstruo","fantasma"]]
      ]
    },
    {
      id:"grief",mood:"sad",delta:-4,duration:9000,
      bond:{affection:.08,trust:.08},
      strong:[
        /\b(?:mama|madre) (?:de )?bambi\b/,
        /\b(?:mufasa|ellie de up|mama de dumbo)\b/,
        /\b(?:murio|fallecio|se murio|perdimos|perdi)\b.{0,45}\b(?:mama|madre|papa|padre|amigo|amiga|abuelo|abuela|mascota|perro|gato|animal)\b/,
        /\b(?:le paso|lo que le pasa|viste lo de)\b.{0,35}\b(?:bambi|mufasa|dumbo)\b/,
        /\b(?:algo muy triste|malas noticias|una tragedia|esta muy enfermo|esta muy enferma)\b/
      ],
      combos:[
        [["mama","madre"],["bambi"]],
        [["murio","fallecio","perdi","perdimos"],["familia","amigo","amiga","mascota","perro","gato"]]
      ]
    },
    {
      id:"rejection",mood:"sad",delta:-5,duration:8500,
      bond:{affection:-.9,trust:-.55,irritation:.25},
      block:[/\bno me caes mal\b/],
      strong:[
        /\b(?:me caes|me cais) (?:muy )?mal\b/,
        /\b(?:no te quiero|no te amo|ya no te quiero|no me gustas|te odio)\b/,
        /\b(?:nadie te quiere|ojala no existieras|prefiero otro robot|no quiero ser tu amig[oa])\b/,
        /\b(?:sos|eres) (?:feo|horrible|desagradable)\b/
      ]
    },
    {
      id:"anger",mood:"angry",delta:-4,duration:7200,
      bond:{affection:-.45,trust:-.7,irritation:1.25},
      strong:[
        /\b(?:callate|cerra la boca|no hables mas|deja de molestar)\b/,
        /\b(?:sos|eres) (?:un |una )?(?:idiota|estupido|estupida|inutil|basura|imbecil|tonto|tonta|molesto|molesta)\b/,
        /\b(?:no servis|no sirves|haces todo mal|arruinas todo)\b/,
        /\b(?:me estas haciendo enojar|quiero que te enojes|enojate)\b/
      ],
      combos:[
        [["sos","eres"],["idiota","estupido","inutil","basura","imbecil","tonto"]],
        [["siempre","todo"],["mal","rompes","arruinas"]]
      ]
    },
    {
      id:"apology",mood:"affectionate",delta:3,duration:5600,
      bond:{affection:.35,trust:.65,irritation:-.8,fear:-.25},
      strong:[
        /\b(?:perdon|perdona|disculpame|lo siento)\b.{0,45}\b(?:robotito|trate mal|dije algo feo|lastime|ofendi)\b/,
        /\b(?:no quise lastimarte|no quise ofenderte|me arrepiento)\b/
      ]
    },
    {
      id:"affection",mood:"affectionate",delta:5,duration:7200,
      bond:{affection:1.05,trust:.72,irritation:-.45,fear:-.25},
      hearts:true,
      strong:[
        /\b(?:te quiero|te amo|te adoro|te tengo cariño|te quiero mucho|te quiero un monton)\b/,
        /\b(?:me caes|me cais) (?:muy )?bien\b/,
        /\bno me caes mal\b/,
        /\b(?:sos|eres) (?:mi )?(?:mejor amigo|mejor amiga|amigo favorito|amiga favorita|persona favorita|robot favorito)\b/,
        /\b(?:me haces feliz|me alegra tenerte|te extrañe|te extrañaba|quiero darte un abrazo)\b/,
        /\b(?:i love you|love you|i adore you|you are my friend)\b/,
        /\b(?:eu te amo|gosto muito de voce|gosto muito de você|voce e meu amigo|você é meu amigo)\b/
      ],
      block:[/\b(?:no|nunca|jamas)\b.{0,18}\b(?:te quiero|te amo|me gustas)\b/]
    },
    {
      id:"praise",mood:"proud",delta:4,duration:6500,
      bond:{affection:.45,trust:.35,irritation:-.2},
      strong:[
        /\b(?:bien hecho|buen trabajo|excelente trabajo|lo hiciste muy bien|lo lograste)\b/,
        /\b(?:estoy orgullos[oa] de (?:ti|vos)|me siento orgullos[oa] de (?:ti|vos))\b/,
        /\b(?:sos|eres|que) (?:muy )?(?:inteligente|capaz|genial|increible|maravilloso|maravillosa)\b/,
        /\b(?:que|sos|eres) (?:muy )?(?:lindo|linda|tierno|tierna|adorable|precioso|preciosa)\b/
      ]
    },
    {
      id:"excitement",mood:"excited",delta:4,duration:6200,
      bond:{affection:.25,trust:.18},
      strong:[
        /\b(?:tengo una sorpresa|te tengo una sorpresa|buenas noticias|ganaste|ganamos|aprobaste|lo conseguimos)\b/,
        /\b(?:vamos de paseo|vamos a festejar|vamos a celebrar|hoy es tu cumpleaños)\b/,
        /\b(?:que emocion|esto es emocionante|no vas a creer lo que paso)\b/
      ]
    }
  ];

  function classify(input){
    const text=normalize(input);
    if(!text||text.length<3||isQuotedOrAcademic(text))return null;
    const tokenSet=words(text);
    let best=null;

    for(let order=0;order<DETECTORS.length;order++){
      const intent=DETECTORS[order];
      if(intent.block?.some(re=>re.test(text)))continue;
      let score=0;
      for(const re of intent.strong||[])if(re.test(text))score+=5;
      for(const groups of intent.combos||[]){
        if(groups.every(group=>hasAny(tokenSet,group)))score+=3.4;
      }
      if(score>0){
        const candidate={...intent,score,order,text};
        if(!best||candidate.score>best.score||(candidate.score===best.score&&candidate.order<best.order))best=candidate;
      }
    }
    return best&&best.score>=3.4?best:null;
  }

  const RESPONSES={
    es:{
      reassurance:["Uf, menos mal. Ya estaba por esconderme.","Ah, era una broma. Me quedo mucho más tranquilo."],
      fear:["¿¡Qué!? No quiero mirar atrás…","¡Ay! Decime que no se está acercando.","Me asusté. Quedate conmigo, por favor."],
      grief:["Sí… eso es muy triste. Me da mucha pena.","Ay, no… esas historias me ponen muy triste.","Pobrecito… ahora necesito un abrazo."],
      rejection:["Eso me pone un poquito triste.","Ay… pensé que nos llevábamos bien.","Eso me dolió un poquito."],
      anger:["Eso fue bastante feo. Estoy enojado.","No me gusta que me hablen así.","Ey, eso me molestó de verdad."],
      apology:["Gracias por decírmelo. Está bien, te perdono.","Acepto tu disculpa. Hagamos las paces."],
      affection:["Ay… yo también te quiero mucho. ♡","Eso me pone muy, muy feliz. ♡","¡Qué lindo escuchar eso! Yo también te tengo mucho cariño."],
      praise:["¡Gracias! Ahora me siento muy orgulloso.","Eso me hizo sentir genial. ¡Voy a seguir esforzándome!"],
      excitement:["¡Qué emoción! Contame todo.","¡Sí! Ahora estoy súper emocionado."]
    },
    en:{
      reassurance:["Oh, good! I was about to hide.","It was a joke. I feel much safer now."],
      fear:["What?! I don't want to look behind me…","That scared me. Please stay with me."],
      grief:["That is really sad. I need a hug.","Oh no… that story makes me very sad."],
      rejection:["That makes me a little sad.","Ouch… that hurt my feelings."],
      anger:["That was mean. I'm angry.","I don't like being spoken to that way."],
      apology:["Thank you for saying that. I forgive you.","Apology accepted. Let's make peace."],
      affection:["Aww… I love you too. ♡","That makes me very, very happy. ♡"],
      praise:["Thank you! I feel very proud now.","That made me feel wonderful."],
      excitement:["How exciting! Tell me everything.","Yay! Now I'm really excited."]
    },
    pt:{
      reassurance:["Ufa, ainda bem. Eu já ia me esconder.","Ah, era brincadeira. Agora estou tranquilo."],
      fear:["O quê?! Não quero olhar para trás…","Isso me assustou. Fica comigo, por favor."],
      grief:["Isso é muito triste. Preciso de um abraço.","Ai, não… essa história me deixa triste."],
      rejection:["Isso me deixa um pouco triste.","Ai… isso magoou meus sentimentos."],
      anger:["Isso foi maldoso. Fiquei bravo.","Não gosto que falem comigo assim."],
      apology:["Obrigado por dizer isso. Eu te perdoo.","Desculpas aceitas. Vamos fazer as pazes."],
      affection:["Ah… eu também te amo. ♡","Isso me deixa muito, muito feliz. ♡"],
      praise:["Obrigado! Agora estou muito orgulhoso.","Isso me fez sentir incrível."],
      excitement:["Que emoção! Conta tudo.","Oba! Agora estou super animado."]
    }
  };

  function respond(id){
    const lang=typeof responseLanguage==="function"?responseLanguage():"es";
    const choices=RESPONSES[lang]?.[id]||RESPONSES.es[id]||["Te escuché."];
    const answer=typeof sample==="function"?sample(choices):choices[Math.floor(Math.random()*choices.length)];
    if(typeof sayInLanguage==="function")sayInLanguage(answer,lang);
    else if(typeof say==="function")say(answer);
  }

  function handle(input,context={}){
    if(typeof state!=="undefined"&&(state.classMode||state.sleeping))return false;
    const reaction=classify(input);
    if(!reaction)return false;
    const token=++reactionToken;
    const who=context.who||(typeof state!=="undefined"?(state.currentVoicePerson||state.currentPerson):null);

    if(typeof changeMoodScore==="function")changeMoodScore(reaction.delta||0);
    if(typeof adjustBond==="function")adjustBond(who,reaction.bond||{});
    if(typeof setMood==="function"){
      const reasons={
        affection:"Robotito recibió unas palabras muy cariñosas.",
        praise:"Robotito se sintió orgulloso por el elogio.",
        excitement:"Robotito escuchó una noticia emocionante.",
        rejection:"Lo que escuchó puso triste a Robotito.",
        grief:"La historia puso triste a Robotito.",
        fear:"Robotito creyó que había un peligro cerca.",
        anger:"Robotito se enojó por la forma en que le hablaron.",
        apology:"Robotito aceptó la disculpa.",
        reassurance:"Robotito entendió que ya no había peligro."
      };
      setMood(reaction.mood,reasons[reaction.id]||"Robotito reaccionó a lo que escuchó.");
    }

    if(reaction.hearts&&typeof animateAffection==="function")animateAffection();
    respond(reaction.id);

    const moodAtReaction=reaction.mood;
    setTimeout(()=>{
      if(token!==reactionToken||typeof state==="undefined"||state.sleeping||state.classMode)return;
      if(state.emotion!==moodAtReaction)return;
      if(typeof setMood==="function")setMood(moodAtReaction==="affectionate"||moodAtReaction==="proud"||moodAtReaction==="excited"?"happy":"calm");
    },reaction.duration||6000);
    return true;
  }

  window.ROBOTITO_EMOTION_DIALOGUE={classify,handle,normalize};
})();
