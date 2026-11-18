// P37/P38: accessible book details, locally scoped shelves and opt-in ISBN camera scan.
(function(root){
"use strict";
const policy=root.ROBOTITO_BOOK_POLICY;
let services=null,scanStream=null,scanTimer=null,reading=null,revision=0;
const $=id=>document.getElementById(id);
function lang(){return services?.language?.()||document.documentElement.lang||"es";}
const labels={
 es:{read:"Escuchar descripción",stop:"Detener lectura",full:"Descripción completa",translate:"Traducir al idioma elegido",source:"Fuente: descripción del catálogo; no se inventa texto",missing:"No hay descripción disponible",save:"Agregar a mi biblioteca",saved:"Guardado en tu biblioteca",waiting:"Consultando ISBN…",noScan:"Escaneo no disponible: ingresá el ISBN manualmente",scan:"Escanear código",cancel:"Cancelar escaneo",invalid:"ISBN inválido",notFound:"Libro no encontrado: completá título y autor manualmente",empty:"Tu estantería está vacía",duplicate:"Ese libro ya figura en tu biblioteca"},
 en:{read:"Read description aloud",stop:"Stop reading",full:"Full description",translate:"Translate to chosen language",source:"Source: catalog description; no invented text",missing:"No description available",save:"Add to my library",saved:"Saved to your library",waiting:"Looking up ISBN…",noScan:"Scanner unavailable: enter ISBN manually",scan:"Scan barcode",cancel:"Cancel scan",invalid:"Invalid ISBN",notFound:"Book not found: enter title and author manually",empty:"This shelf is empty",duplicate:"This book is already in your library"},
 pt:{read:"Ouvir descrição",stop:"Parar leitura",full:"Descrição completa",translate:"Traduzir para o idioma escolhido",source:"Fonte: catálogo; nenhum texto inventado",missing:"Descrição indisponível",save:"Adicionar à biblioteca",saved:"Salvo na biblioteca",waiting:"Consultando ISBN…",noScan:"Escâner indisponível: insira o ISBN",scan:"Escanear código",cancel:"Cancelar",invalid:"ISBN inválido",notFound:"Livro não encontrado: digite título e autor",empty:"Estante vazia",duplicate:"Livro já cadastrado"},
 fr:{read:"Écouter la description",stop:"Arrêter la lecture",full:"Description complète",translate:"Traduire dans la langue choisie",source:"Source : catalogue ; aucun texte inventé",missing:"Description indisponible",save:"Ajouter à ma bibliothèque",saved:"Ajouté à la bibliothèque",waiting:"Recherche de l’ISBN…",noScan:"Scanner indisponible : saisir l’ISBN",scan:"Scanner le code",cancel:"Annuler",invalid:"ISBN invalide",notFound:"Livre introuvable : saisir titre et auteur",empty:"Étagère vide",duplicate:"Livre déjà présent"},
 it:{read:"Ascolta descrizione",stop:"Interrompi lettura",full:"Descrizione completa",translate:"Traduci nella lingua scelta",source:"Fonte: catalogo; nessun testo inventato",missing:"Descrizione non disponibile",save:"Aggiungi alla biblioteca",saved:"Salvato in biblioteca",waiting:"Ricerca ISBN…",noScan:"Scanner non disponibile: inserisci ISBN",scan:"Scansiona codice",cancel:"Annulla",invalid:"ISBN non valido",notFound:"Libro non trovato: inserisci titolo e autore",empty:"Scaffale vuoto",duplicate:"Libro già presente"},
 de:{read:"Beschreibung vorlesen",stop:"Vorlesen beenden",full:"Vollständige Beschreibung",translate:"In gewählte Sprache übersetzen",source:"Quelle: Katalog; kein erfundener Text",missing:"Keine Beschreibung verfügbar",save:"Zur Bibliothek hinzufügen",saved:"In Bibliothek gespeichert",waiting:"ISBN wird gesucht…",noScan:"Scanner nicht verfügbar: ISBN eingeben",scan:"Barcode scannen",cancel:"Abbrechen",invalid:"Ungültige ISBN",notFound:"Buch nicht gefunden: Titel und Autor eingeben",empty:"Regal ist leer",duplicate:"Buch bereits vorhanden"}
};
function t(key){return (labels[lang()]||labels.es)[key]||labels.es[key]||key;}
const shelfTitles={
 es:["Leídos","Leyendo","Por leer"],en:["Read","Reading","To read"],
 pt:["Lidos","Lendo","Para ler"],fr:["Lus","En cours","À lire"],
 it:["Letti","In lettura","Da leggere"],de:["Gelesen","Lese ich","Noch zu lesen"]
};
function shelfLabel(key){
 const index=policy.shelves.findIndex(x=>x.key===key);
 return (shelfTitles[lang()]||shelfTitles.es)[index]||key;
}
function localizeShelves(){
 const dictionary={
 es:["Mi biblioteca y estanterías","Organizá tus libros en estanterías decoradas. Podés cargarlos manualmente, buscar su ISBN o escanear el código de barras con permiso de cámara.","Título","Autor","ISBN (opcional)","Estantería","Buscar por ISBN","Agregar libro"],
 en:["My bookshelves","Organize your books locally. Add manually, look up ISBN or scan a barcode with camera permission.","Title","Author","ISBN (optional)","Shelf","Look up ISBN","Add book"],
 pt:["Minhas estantes","Organize seus livros localmente. Adicione manualmente, pesquise ISBN ou escaneie com permissão.","Título","Autor","ISBN (opcional)","Estante","Buscar ISBN","Adicionar livro"],
 fr:["Mes étagères","Organisez vos livres localement. Saisie manuelle, recherche ISBN ou scan autorisé.","Titre","Auteur","ISBN (facultatif)","Étagère","Rechercher ISBN","Ajouter un livre"],
 it:["I miei scaffali","Organizza i libri localmente. Inserimento manuale, ricerca ISBN o scansione autorizzata.","Titolo","Autore","ISBN (facoltativo)","Scaffale","Cerca ISBN","Aggiungi libro"],
 de:["Meine Bücherregale","Bücher lokal organisieren. Manuell hinzufügen, ISBN suchen oder Barcode mit Erlaubnis scannen.","Titel","Autor","ISBN (optional)","Regal","ISBN suchen","Buch hinzufügen"]
 };
 const txt=dictionary[lang()]||dictionary.es,card=$("personalLibraryCard");
 if(!card)return;
 const h=card.querySelector("h2"),desc=card.querySelector("h2 + p");
 if(h)h.textContent="📚 "+txt[0];if(desc)desc.textContent=txt[1];
 ["shelfTitle","shelfAuthor","shelfISBN","shelfSelect"].forEach((id,i)=>{
  const field=$(id),label=field?.closest("label");
  if(label){for(const node of label.childNodes)if(node.nodeType===3){node.textContent=txt[i+2]+" ";break;}}
 });
 for(const [id,label] of [["shelfLookupISBN",txt[6]],["shelfScan","📷 "+t("scan")],["shelfScanCancel",t("cancel")],["shelfAddBook",txt[7]]]){
  const button=id==="shelfAddBook"?card.querySelector('#shelfAddBook button[type="submit"]'):$(id);
  if(button)button.textContent=label;
 }
 for(const option of $("shelfSelect")?.options||[])option.textContent=shelfLabel(option.value);
}

function status(text){const node=$("shelfStatus");if(node)node.textContent=text;}
function safeText(value,max=16000){return String(value??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,max);}
function currentOwner(){return services?.owner?.()||null;}
function addBook(book){
 const owner=currentOwner(),previous=services?.getBooks?.()||[];
 if(!owner||!Array.isArray(previous))return false;
 const title=safeText(book.title||book.Title,300),author=safeText(book.author||book.Author||book.authors?.join(", "),250);
 if(!title)return false;
 const item={Title:title,Author:author,ISBN:policy.isbn(book.isbn||book.ISBN)||"",
  "Exclusive Shelf":book.shelf||"to-read",Bookshelves:"", "My Review":"",language:book.language||"und"};
 const key=policy.uniqueKey(item);
 if(previous.some(row=>policy.uniqueKey(row)===key)){status(t("duplicate"));return false;}
 if(currentOwner()!==owner)return false;
 services.saveBooks([...previous,item]);
 renderShelves();status(t("saved"));return true;
}
function stopReading(){
 if(reading){services?.stopSpeech?.();reading=null;}
}
function readDescription(text,sourceLang){
 const description=safeText(text,16000);if(!description){status(t("missing"));return false;}
 stopReading();
 // Reuse Robotito's speaking pipeline; it suspends microphone recognition and
 // honors quiet mode, permissions, language and the user's selected voice.
 const ok=services?.speak?.(description,sourceLang||lang())===true;
 if(!ok){status("No se pudo reproducir: revisá la voz, el idioma y el modo silencio.");return false;}
 reading={text:description};return true;
}
function attachDescriptions(results){
 const cards=[...document.querySelectorAll("#bookResults .book-card")];
 cards.forEach((card,index)=>{
  const book=results[index]?.book;if(!book)return;
  const container=card.querySelector(".book-description")?.parentElement||card;
  const wrapper=document.createElement("div");wrapper.className="book-description-controls";
  const details=document.createElement("details"),summary=document.createElement("summary");
  summary.textContent=t("full");details.append(summary);
  const paragraph=document.createElement("p");paragraph.className="book-full-description";
  const original=safeText(book.description,16000);paragraph.textContent=original||t("missing");
  paragraph.lang=book.language||"und";details.append(paragraph);
  const translation=document.createElement("div");translation.className="book-translation";
  const translateButton=document.createElement("button");translateButton.type="button";translateButton.className="ghost";
  translateButton.textContent=t("translate");
  translateButton.addEventListener("click",()=>{
   if(!original)return;
   root.ROBOTITO_LOCALIZED_CONTENT?.render?.(translation,original,book.language||"und");
   translateButton.disabled=true;
  });
  const play=document.createElement("button");play.type="button";play.textContent="🔊 "+t("read");
  play.addEventListener("click",()=>readDescription(original,book.language));
  const stop=document.createElement("button");stop.type="button";stop.textContent=t("stop");
  stop.addEventListener("click",stopReading);
  const save=document.createElement("button");save.type="button";save.textContent="＋ "+t("save");
  save.addEventListener("click",()=>{if(addBook(book)){save.disabled=true;save.textContent=t("saved");}});
  const attribution=document.createElement("small");attribution.textContent=t("source");
  wrapper.append(details,translation,translateButton,play,stop,save,attribution);
  container.append(wrapper);
 });
}
function renderShelves(){
 const host=$("personalBookShelves");if(!host||!services)return;
 const books=services.getBooks()||[];
 host.replaceChildren();
 for(const shelf of policy.shelves){
  const section=document.createElement("section");section.className="personal-shelf shelf-"+shelf.color;
  section.setAttribute("aria-label",shelfLabel(shelf.key));
  const heading=document.createElement("h3");heading.textContent=shelf.ornament+" "+shelfLabel(shelf.key);
  const row=document.createElement("div");row.className="shelf-books";
  const matching=books.filter(book=>policy.categorize(book)===shelf.key);
  if(!matching.length){const empty=document.createElement("p");empty.textContent=t("empty");row.append(empty);}
  for(const book of matching){
   const cover=document.createElement("div");cover.className="shelf-book";cover.tabIndex=0;
   const title=safeText(book.Title,300),author=safeText(book.Author,250);
   cover.title=title+(author?" — "+author:"");
   cover.style.setProperty("--book-hue",String(title.length*17%340));
   const spine=document.createElement("span");spine.textContent=title;cover.append(spine);
   const select=document.createElement("select");select.setAttribute("aria-label","Mover "+title+" a estantería");
   for(const other of policy.shelves){const opt=document.createElement("option");opt.value=other.key;opt.textContent=shelfLabel(other.key);select.append(opt);}
   select.value=shelf.key;
   select.addEventListener("change",()=>{
    const owner=currentOwner();if(!owner)return;
    const updated=services.getBooks().map(item=>item===book?{...item,"Exclusive Shelf":select.value}:item);
    if(owner===currentOwner()){services.saveBooks(updated);renderShelves();}
   });
   const item=document.createElement("div");item.className="shelf-book-item";item.append(cover,select);row.append(item);
  }
  const plank=document.createElement("div");plank.className="shelf-plank";section.append(heading,row,plank);host.append(section);
 }
}
async function lookupIsbn(raw){
 const value=policy.isbn(raw);if(!value){status(t("invalid"));return null;}
 const owner=currentOwner(),ticket=++revision;status(t("waiting"));
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  let response;try{response=await fetch("https://www.googleapis.com/books/v1/volumes?q=isbn:"+encodeURIComponent(value)+"&maxResults=5",{signal:controller.signal});}finally{clearTimeout(timer);}
  if(!response.ok)throw Error("catalog HTTP "+response.status);
  const json=await response.json();
  if(ticket!==revision||owner!==currentOwner())return null;
  const selected=(json.items||[]).find(item=>item.volumeInfo?.title&&
    (item.volumeInfo.industryIdentifiers||[]).some(id=>policy.isbn(id.identifier)===value));
  if(!selected){status(t("notFound"));return null;}
  const b=selected.volumeInfo;
  const item={title:b.title,author:(b.authors||[]).join(", "),isbn:value,language:b.language||"und"};
  $("shelfTitle").value=item.title;$("shelfAuthor").value=item.author;$("shelfISBN").value=value;
  status("Google Books · "+item.title);return item;
 }catch(err){if(owner===currentOwner())status(t("notFound"));return null;}
}
async function stopScan(){
 clearTimeout(scanTimer);scanTimer=null;
 if(scanStream){scanStream.getTracks().forEach(track=>track.stop());scanStream=null;}
 const video=$("bookScanPreview");if(video){video.pause();video.srcObject=null;video.hidden=true;}
}
async function scanBarcode(){
 await stopScan();
 if(!root.BarcodeDetector||!navigator.mediaDevices?.getUserMedia){status(t("noScan"));return;}
 const owner=currentOwner(),ticket=++revision;
 try{
  const detector=new BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e"]});
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
  if(owner!==currentOwner()||ticket!==revision){stream.getTracks().forEach(x=>x.stop());return;}
  scanStream=stream;const video=$("bookScanPreview");
  video.hidden=false;video.srcObject=stream;await video.play();
  const deadline=Date.now()+12000;
  async function frame(){
   if(!scanStream||ticket!==revision||owner!==currentOwner()||document.hidden||Date.now()>deadline){await stopScan();return;}
   try{
    const results=await detector.detect(video);
    for(const result of results){const value=policy.isbn(result.rawValue);if(value){await stopScan();$("shelfISBN").value=value;await lookupIsbn(value);return;}}
   }catch{}
   scanTimer=setTimeout(frame,350);
  }
  await frame();
 }catch(error){await stopScan();status(t("noScan"));}
}
function init(options){
 services=options;
 $("shelfAddBook")?.addEventListener("submit",event=>{
  event.preventDefault();
  addBook({title:$("shelfTitle").value,author:$("shelfAuthor").value,isbn:$("shelfISBN").value,
    shelf:$("shelfSelect").value});
 });
 $("shelfLookupISBN")?.addEventListener("click",()=>void lookupIsbn($("shelfISBN").value));
 $("shelfScan")?.addEventListener("click",()=>void scanBarcode());
 $("shelfScanCancel")?.addEventListener("click",()=>{++revision;void stopScan();});
 document.addEventListener("visibilitychange",()=>{if(document.hidden){++revision;void stopScan();stopReading();}});
 root.addEventListener("pagehide",()=>{++revision;void stopScan();stopReading();});
 root.addEventListener("robotito:memoryscopechange",()=>{++revision;void stopScan();stopReading();$("personalBookShelves")?.replaceChildren();});
 root.addEventListener("robotito:memoryscopeready",renderShelves);
 document.addEventListener("robotito:languagechange",()=>{localizeShelves();renderShelves();});
 localizeShelves();renderShelves();
}
root.ROBOTITO_BOOK_EXTRAS={init,renderShelves,attachDescriptions,addBook,lookupIsbn,stopScan,readDescription,stopReading};
})(window);
