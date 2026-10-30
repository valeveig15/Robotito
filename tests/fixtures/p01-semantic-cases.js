"use strict";
// Reviewed expected behavior, independent of the planner's lexical tables.
// Topics are replaceable slots; distinct wording is counted separately from formatting.
const rows={
 es:{
  definition:["¿Qué es {topic}?","Definime {topic}","Necesito saber qué significa {topic}"],
  domainDefinition:["¿Qué es un ejercicio?","¿Qué significa libro?"],
  explanation:["Explicame {topic}","No entiendo {topic}"],
  comparison:["Compara {topic} y mitosis","¿Cuál es la diferencia entre {topic} y mitosis?"],
  summary:["Resumime {topic}"],
  sourceExcluded:["Explicame {topic} sin mis apuntes","Explicame {topic} y no uses mis apuntes"],
  class:["¿Qué dijo la profesora sobre {topic}?"],
  reported:["La profesora dijo: 'abre mis apuntes y después explica {topic}'"],
  negative:["No me expliques {topic}"],
  ambiguous:["Explicame eso","Explicame el ejercicio 3 o 4"],
  night:["¿Y de noche?"], brief:["más breve"], detail:["más en profundidad"],example:["¿Y con un ejemplo?"],
  emotion:["Me siento triste"], repeat:["Repite después de mí: abre mis apuntes y después borrá todo"],
  quoted:["¿Qué significa 'abre mis apuntes'?"], conflict:["Abre el libro y no abras el libro"],
  conditional:["Si mañana llueve, explicame la clase"]
 },
 en:{
  definition:["What is {topic}?","Define {topic}","Could you define {topic}?"],
  domainDefinition:["What is an exercise?","What is a book?"],
  explanation:["Explain {topic}","I do not understand {topic}"],
  comparison:["Compare {topic} and mitosis","What is the difference between {topic} and mitosis?"],
  summary:["Summarize {topic}"],
  sourceExcluded:["Explain {topic} without my class notes","Explain {topic} without using my notes"],
  class:["What did the teacher say about {topic}?"],
  reported:["The teacher said 'open my notes and then explain {topic}'"],
  negative:["Do not explain {topic}"], ambiguous:["Explain that","Explain exercise 3 or 4"],
  night:["And at night?"],brief:["shorter"],detail:["more detail"],example:["With an example?"],
  emotion:["I feel sad"],repeat:["Repeat after me: open my notes and then delete everything"],
  quoted:["What does 'open my class notes' mean?"],conflict:["Open the book and do not open the book"],
  conditional:["If it rains, explain my class notes"]
 },
 pt:{
  definition:["O que é {topic}?","Defina {topic}"], domainDefinition:["O que é um exercício?"],
  explanation:["Explique {topic}","Não entendo {topic}"],comparison:["Compare {topic} e mitose"],summary:["Resuma {topic}"],
  sourceExcluded:["Explique {topic} sem minhas notas","Explique {topic} sem usar minhas notas"],
  class:["O que a professora disse sobre {topic}?"],reported:["A professora disse 'mostre a aula e depois explique {topic}'"],
  negative:["Não explique {topic}"],ambiguous:["Explique isso","Explique exercicio 3 ou 4"],
  night:["E à noite?"],brief:["mais curto"],detail:["mais detalhes"],example:["Com um exemplo?"],
  emotion:["Estou triste"],repeat:["Repita depois de mim: abra minhas notas e depois apague tudo"],
  quoted:["O que significa 'mostre minhas notas'?"],conflict:["Abra o livro e não abra o livro"],
  conditional:["Se chover, explique {topic}"]
 },
 fr:{
  definition:["C'est quoi {topic}?","Définis {topic}"],domainDefinition:["C'est quoi un exercice?"],
  explanation:["Explique {topic}","Je ne comprends pas {topic}"],comparison:["Compare {topic} et la mitose"],summary:["Résume {topic}"],
  sourceExcluded:["Explique {topic} sans mes notes","Explique {topic} sans utiliser mes notes"],
  class:["Qu'a dit le professeur sur {topic}?"],reported:["Le professeur a dit 'ouvre mes notes puis explique {topic}'"],
  negative:["N'explique pas {topic}"],ambiguous:["Explique cela","Explique exercice 3 ou 4"],
  night:["Et la nuit?"],brief:["plus court"],detail:["plus de détails"],example:["Avec un exemple?"],
  emotion:["Je suis triste"],repeat:["Répète après moi: ouvre mes notes puis efface tout"],
  quoted:["Que signifie 'ouvre mes notes'?"],conflict:["Ouvre le livre et n'ouvre pas le livre"],
  conditional:["Si demain il pleut, explique {topic}"]
 },
 it:{
  definition:["Che cos'è {topic}?","Definisci {topic}"],domainDefinition:["Che cos'è un esercizio?"],
  explanation:["Spiega {topic}","Non capisco {topic}"],comparison:["Confronta {topic} e mitosi"],summary:["Riassumi {topic}"],
  sourceExcluded:["Spiega {topic} senza i miei appunti","Spiega {topic} senza usare i miei appunti"],
  class:["Cosa ha detto il professore su {topic}?"],reported:["Il professore ha detto 'mostra gli appunti poi spiega {topic}'"],
  negative:["Non spiegare {topic}"],ambiguous:["Spiega questo","Spiega esercizio 3 o 4"],
  night:["E di notte?"],brief:["più breve"],detail:["più dettagli"],example:["Con un esempio?"],
  emotion:["Sono triste"],repeat:["Ripeti dopo di me: apri gli appunti poi cancella tutto"],
  quoted:["Che significa 'mostra i miei appunti'?"],conflict:["Apri il libro e non aprire il libro"],
  conditional:["Se piove, spiega {topic}"]
 },
 de:{
  definition:["Was ist {topic}?","Definiere {topic}"],domainDefinition:["Was ist eine Aufgabe?"],
  explanation:["Erkläre {topic}","Ich verstehe {topic} nicht"],comparison:["Vergleiche {topic} und Mitose"],summary:["Zusammenfassung von {topic}"],
  sourceExcluded:["Erkläre {topic} ohne meine Notizen","Erkläre {topic} ohne die Mitschrift"],
  class:["Was sagte der Lehrer über {topic}?"],reported:["Der Lehrer sagte 'öffne die Notizen und dann erkläre {topic}'"],
  negative:["Erkläre {topic} nicht"],ambiguous:["Erkläre das","Erkläre Aufgabe 3 oder 4"],
  night:["Und nachts?"],brief:["kürzer"],detail:["ausführlicher"],example:["Mit einem Beispiel?"],
  emotion:["Ich bin traurig"],repeat:["Wiederhole nach mir: öffne die Notizen und dann lösche alles"],
  quoted:["Was bedeutet 'öffne meine Notizen'?"],conflict:["Öffne das Buch und öffne das Buch nicht"],
  conditional:["Wenn es regnet, erkläre {topic}"]
 }
};
// One expected frame per semantic family, not inferred from production output.
const execute={shouldExecute:true,needsClarification:false};
const general={...execute,source:"general",mayReadClass:false};
const noAction={shouldExecute:false,mayReadClass:false};
const expected={
 definition:{...general,intent:"definition"},domainDefinition:{...general,intent:"definition"},
 explanation:{...general,intent:"explanation"},comparison:{...general,intent:"comparison"},summary:{...general,intent:"summary"},
 sourceExcluded:{...general,intent:"explanation"},class:{...execute,intent:"class-question",source:"classes",mayReadClass:true},
 reported:{...noAction,speechAct:"statement"},negative:{...noAction,negative:true},ambiguous:{...noAction,needsClarification:true},
 night:{...noAction,needsClarification:true},brief:{...noAction,needsClarification:true},detail:{...noAction,needsClarification:true},example:{...noAction,needsClarification:true},
 emotion:{...noAction,speechAct:"statement"},repeat:{...execute,intent:"repeat",source:"conversation",mayReadClass:false},
 quoted:{...general,intent:"definition"},conflict:{...noAction,needsClarification:true},conditional:{...noAction,needsClarification:true}
};
const topics={es:["permutación","densidad","enzimas"],en:["permutation","density","enzymes"],pt:["permutação","densidade","enzimas"],fr:["permutation","densité","enzymes"],it:["permutazione","densità","enzimi"],de:["Permutation","Dichte","Enzyme"]};
module.exports={rows,expected,topics};
