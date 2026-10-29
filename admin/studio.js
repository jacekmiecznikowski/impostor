import { STUDIO_DEFAULTS } from './config.js';

// Partyjniak Content Studio — dependency-free, strictly authenticated editor.
// Only the public Supabase publishable key is stored locally.
// Bearer access/refresh tokens are kept in sessionStorage, never in the game.
// Supabase's free default mailer sends Magic Links; no custom SMTP or OTP template needed.
const NAMES = Object.freeze({
  impostor:'Impostor', 'ticking-bomb':'Tykająca Bomba',
  'co-mam-na-mysli':'Co mam na myśli?',naokolo:'Naokoło',
  synchronizacja:'Synchronizacja','trzy-w-piec':'Trzy w Pięć','dzika-karta':'Dzika Karta'
});
const TYPE = Object.freeze({
  impostor:'words','ticking-bomb':'words','co-mam-na-mysli':'words',
  naokolo:'cards',synchronizacja:'scales','trzy-w-piec':'prompts'
});
const $$ = id => document.getElementById(id);
const STORE_CONFIG = 'partyjniak.studio.public-config.v1';
const STORE_SESSION = 'partyjniak.studio.session.v1';
const STUDIO_REDIRECT_URL = 'https://jacekmiecznikowski.github.io/impostor/';
let config = { ...STUDIO_DEFAULTS };
let session = null;
let documents = [];
let record = null;
let data = null;
let activeCategory = 0;
let activeDeck = 'prompts';
let previewIndex = 0;
let dirty = false;
let toastTimer;

const clone = object => JSON.parse(JSON.stringify(object));
const create = (tag, cls, content) => {
  const node = document.createElement(tag);
  if(cls) node.className = cls;
  if(content !== undefined) node.textContent = String(content);
  return node;
};
const safeString = v => String(v ?? '').trim();
function showToast(message, error=false) {
  const node = $$('toast');
  node.textContent = message; node.classList.toggle('error',error); node.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('show'),4200);
}
function setBusy(state) {
  for (const id of ['save-btn','publish-btn','import-btn','add-category','add-item']) {
    $$(id).disabled = state;
  }
}
function getConfig() {
  const url = safeString($$('project-url').value).replace(/\/+$/,'');
  const key = safeString($$('publishable-key').value);
  const email = safeString($$('editor-email').value).toLowerCase();
  // Prevent accidental sending of credentials to random endpoints.
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url))
    throw new Error('Wpisz adres HTTPS swojego projektu *.supabase.co.');
  if(!key || key.length>1500 || /service_role|sb_secret_/.test(key))
    throw new Error('Wpisz wyłącznie klucz publishable/anon, nigdy service_role.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Nieprawidłowy adres e-mail.');
  return {url,key,email};
}
async function request(path,{method='POST',body,auth=true,retry=true}={}) {
  if(auth && !session) throw new Error('Najpierw się zaloguj.');
  if(auth && session.expires_at && Date.now()>session.expires_at-60000) await refreshSession();
  const headers={apikey:config.key,Accept:'application/json'};
  if(auth) headers.Authorization='Bearer '+session.access_token;
  if(body!==undefined) headers['Content-Type']='application/json';
  const response=await fetch(config.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',referrerPolicy:'no-referrer'});
  if(response.status===401 && auth && retry && session?.refresh_token) {
    await refreshSession();
    return request(path,{method,body,auth,retry:false});
  }
  const text=await response.text();
  let result; try{result=text?JSON.parse(text):null;}catch{result=text;}
  if(!response.ok) throw new Error(result?.message||result?.error_description||result?.hint||`Supabase HTTP ${response.status}`);
  return result;
}
function storeSession(value) {
  session={...value,expires_at:Date.now()+(value.expires_in||3600)*1000};
  sessionStorage.setItem(STORE_SESSION,JSON.stringify(session));
}
async function refreshSession() {
  if(!session?.refresh_token) throw new Error('Sesja wygasła. Zaloguj się ponownie.');
  const current=session;
  const result=await request('/auth/v1/token?grant_type=refresh_token',{body:{refresh_token:current.refresh_token},auth:false});
  storeSession(result);
}
async function sendMagicLink(e) {
  e.preventDefault();
  try {
    config=getConfig();
    localStorage.setItem(STORE_CONFIG,JSON.stringify(config)); // URL and public key only
    const redirect = encodeURIComponent(STUDIO_REDIRECT_URL);
    await request('/auth/v1/otp?redirect_to='+redirect,{
      body:{email:config.email,create_user:false},auth:false
    });
    showToast('Wysłano link logowania. Otwórz wiadomość i kliknij Sign in.');
  } catch(error){ showToast(error.message,true); }
}

// Supabase redirects the verified Magic Link to our allowed Site URL.
// The access and refresh tokens arrive in the URL fragment (#), not in server
// logs. Remove them from the address bar synchronously, before any network calls.
function consumeMagicLinkCallback(){
  const hash=window.location.hash;
  if(!hash || (!hash.includes('access_token=') && !hash.includes('error=')))return false;
  const params=new URLSearchParams(hash.slice(1));
  window.history.replaceState(null,'',window.location.pathname+window.location.search);
  if(params.has('error')){
    showToast('Link logowania wygasł lub jest nieprawidłowy. Wyślij nowy link.',true);
    return false;
  }
  const access=params.get('access_token');
  const refresh=params.get('refresh_token');
  const type=params.get('token_type');
  const expires=Number(params.get('expires_in')||3600);
  if(!access||!refresh||type!=='bearer'||!Number.isFinite(expires)||expires<=0){
    showToast('Niepełne dane logowania. Wyślij nowy link.',true);
    return false;
  }
  storeSession({access_token:access,refresh_token:refresh,expires_in:expires});
  return true;
}

async function logout() {
  if(dirty && !confirm('Niezapisane zmiany zostaną utracone. Wylogować?')) return;
  try { await request('/auth/v1/logout',{auth:true}); }catch{}
  sessionStorage.removeItem(STORE_SESSION);session=null;
  data=null;record=null;documents=[];
  $$('studio-view').hidden=true;$$('login-view').hidden=false;$$('logout').hidden=true;
  $$('connection').textContent='Niepołączono';$$('connection').classList.add('muted');
}
async function openStudio() {
  await loadDocuments();
  $$('login-view').hidden=true;$$('studio-view').hidden=false;$$('logout').hidden=false;
  $$('connection').textContent='Połączono · redaktor';
  $$('connection').classList.remove('muted');
  showToast('Dostęp do panelu potwierdzony.');
}
async function loadDocuments(wantedGame) {
  const rows=await request('/rest/v1/rpc/party_editor_list',{body:{}});
  if(!Array.isArray(rows)) throw new Error('Nie znaleziono dokumentów. Sprawdź seed bazy danych.');
  documents=rows;
  const picker=$$('game-picker');
  picker.replaceChildren();
  for(const [id,name] of Object.entries(NAMES)) {
    const doc=documents.find(d=>d.game_id===id&&d.locale==='pl');
    if(!doc) continue;
    const option=create('option','',name);option.value=id;picker.append(option);
  }
  if(!picker.options.length) throw new Error('Baza jest pusta. Uruchom plik supabase/seed.sql.');
  picker.value=documents.some(d=>d.game_id===wantedGame)?wantedGame:picker.options[0].value;
  chooseGame(picker.value,true);
  updateStats();
}
function updateStats(){
  $$('total-games').textContent=documents.length;
  $$('total-categories').textContent=documents.reduce((n,r)=>n+(r.draft?.categories?.length||0),0);
  $$('total-items').textContent=documents.reduce((n,r)=>n+(r.draft?.categories?.reduce((k,c)=>k+(c.words||c.cards||c.scales||c.prompts||[]).length,0)||((r.draft?.prompts?.length||0)+(r.draft?.answers?.length||0))),0);
}
function markDirty() {
  dirty=true;
  $$('revision-label').textContent=`Wersja ${record.revision} · niezapisane zmiany`;
  $$('published-pill').textContent='Zmieniony szkic';
  $$('published-pill').classList.add('muted');
}
function chooseGame(game,force=false) {
  if(dirty&&!force&&!confirm('Porzucić niezapisane zmiany w obecnej grze?')){
    $$('game-picker').value=record.game_id;return;
  }
  record=documents.find(d=>d.game_id===game&&d.locale==='pl');
  if(!record)return;
  data=clone(record.draft);dirty=false;activeCategory=0;activeDeck='prompts';previewIndex=0;
  $$('game-picker').value=game;
  $$('revision-label').textContent=`Wersja ${record.revision}`;
  $$('published-pill').textContent=record.published_revision===record.revision?'Opublikowana':'Szkic';
  $$('published-pill').classList.toggle('muted',record.published_revision!==record.revision);
  $$('group-search').value='';
  render();
}
function selectedList(){
  return data.game==='dzika-karta'?data[activeDeck]:data.categories[activeCategory]?.[TYPE[data.game]]||[];
}
function listOf(cat) {return cat[TYPE[data.game]]||[];}
function render(){
  if(!data)return;
  renderGroups();renderEditor();renderExtra();renderPreview();
}
function renderGroups(){
  const isDeck=data.game==='dzika-karta';
  $$('add-category').hidden=isDeck;
  $$('group-search').hidden=isDeck;
  $$('groups-title').textContent=isDeck?'Talie kart':'Kategorie';
  $$('groups-subtitle').textContent=isDeck?'Dwa niezależne zestawy':'Wybierz zestaw do edycji';
  const list=$$('category-list');list.replaceChildren();
  const groups=isDeck?[{id:'prompts',name:'Pytania',count:data.prompts.length},{id:'answers',name:'Odpowiedzi',count:data.answers.length}]:data.categories.map((c,i)=>({id:c.id,name:c.name,count:listOf(c).length,index:i}));
  const search=safeString($$('group-search').value).toLocaleLowerCase('pl');
  for(const group of groups){
    if(!isDeck && !group.name.toLocaleLowerCase('pl').includes(search))continue;
    const btn=create('button','category-item');
    btn.type='button';
    btn.classList.toggle('selected',isDeck?group.id===activeDeck:group.index===activeCategory);
    const label=create('span');
    label.append(create('strong','',group.name),create('small','',isDeck?'Talia Dzikiej Karty':'Zestaw haseł'));
    btn.append(label,create('span','number',group.count));
    btn.addEventListener('click',()=>{if(isDeck)activeDeck=group.id;else activeCategory=group.index;previewIndex=0;render();});
    list.append(btn);
  }
  if(!list.childElementCount)list.append(create('p','empty','Nie znaleziono kategorii.'));
}
function field(labelText,value,change,{multiline=false,wide=false,maxlength=180}={}){
  const label=create('label',wide?'wide':'');
  label.append(create('span','',labelText));
  const input=create(multiline?'textarea':'input');
  if(!multiline)input.type='text';
  input.value=String(value??'');input.maxLength=maxlength;
  input.addEventListener('input',()=>{change(input.value);markDirty();renderPreview();});
  input.addEventListener('change',()=>renderGroups());
  label.append(input);
  return label;
}
function renderEditor(){
  const deck=data.game==='dzika-karta';
  const cat=deck?null:data.categories[activeCategory];
  $$('editor-title').textContent=deck?(activeDeck==='prompts'?'Pytania':'Odpowiedzi'):(cat?.name||'Wybierz kategorię');
  $$('remove-category').hidden=deck||!cat;
  $$('category-fields').replaceChildren();
  if(cat){
    const fields=$$('category-fields');
    fields.append(
      field('Nazwa kategorii',cat.name,value=>{cat.name=value;$$('editor-title').textContent=value},{wide:true,maxlength:60}),
      field('Identyfikator (unikalny)',cat.id,value=>{cat.id=value},{maxlength:40}),
      field('Ikona Font Awesome',cat.icon,value=>{cat.icon=value},{maxlength:60}),
      field('Opis wewnętrzny (opcjonalny)',cat.desc||'',value=>{cat.desc=value},{wide:true,maxlength:160})
    );
  }
  const entries=selectedList();
  $$('items-title').textContent=deck?'Karty':{words:'Hasła',cards:'Karty zakazane',scales:'Skale',prompts:'Pytania'}[TYPE[data.game]];
  $$('items-subtitle').textContent=`${entries.length} elementów w zestawie`;
  const holder=$$('items-list');holder.replaceChildren();
  entries.forEach((entry,index)=>{
    const row=create('div','item-row');
    row.append(create('span','row-index',String(index+1).padStart(2,'0')));
    const fields=create('div','item-fields');
    const update=(key,value)=>{entry[key]=value;};
    if(deck){
      fields.append(field(activeDeck==='prompts'?'Tekst pytania':'Treść odpowiedzi',entry,value=>{entries[index]=value;markDirty();renderPreview();},{wide:true,multiline:activeDeck==='prompts',maxlength:activeDeck==='prompts'?180:120}));
    }else if(data.game==='naokolo'){
      fields.append(field('Hasło',entry.word,value=>update('word',value),{wide:true,maxlength:80}),
      field('Zakazane (oddziel przecinkami)',(entry.forbidden||[]).join(', '),value=>update('forbidden',value.split(',').map(x=>x.trim()).filter(Boolean)),{wide:true,multiline:true,maxlength:350}));
    }else if(data.game==='synchronizacja'){
      fields.append(field('ID skali',entry.id,value=>update('id',value),{maxlength:60}),
        field('Lewy biegun',entry.left,value=>update('left',value),{maxlength:80}),
        field('Prawy biegun',entry.right,value=>update('right',value),{maxlength:80}));
    }else if(data.game==='trzy-w-piec'){
      fields.append(field('ID pytania',entry.id,value=>update('id',value),{maxlength:60}),
        field('Treść pytania',entry.text,value=>update('text',value),{wide:true,multiline:true,maxlength:180}));
    }else{
      fields.append(field(data.game==='ticking-bomb'?'Pytanie / polecenie':'Hasło',entry.word,value=>update('word',value),{wide:true,maxlength:80}));
      if(data.game==='impostor'||data.game==='ticking-bomb')fields.append(field('Podpowiedź',entry.hint||'',value=>update('hint',value),{wide:true,maxlength:80}));
    }
    row.append(fields);
    const actions=create('div','row-actions');
    for(const [label,title,act] of [
      ['↑','W górę',()=>moveEntry(index,-1)],
      ['↓','W dół',()=>moveEntry(index,1)],
      ['×','Usuń pozycję',()=>removeEntry(index)]
    ]){
      const btn=create('button',label==='×'?'remove':'',label);btn.type='button';btn.title=title;
      if(label==='↑'&&index===0||label==='↓'&&index===entries.length-1)btn.disabled=true;
      btn.addEventListener('click',act);actions.append(btn);
    }
    row.append(actions);
    row.addEventListener('focusin',()=>{previewIndex=index;renderPreview();});
    holder.append(row);
  });
}
function renderExtra(){
  const view=$$('extra-settings');view.hidden=!Array.isArray(data.discussionTips);
  if(view.hidden)return;
  const list=$$('extra-list');list.replaceChildren();
  data.discussionTips.forEach((tip,index)=>{
    const row=create('div','item-row');
    row.append(create('span','row-index',String(index+1).padStart(2,'0')));
    const fields=create('div','item-fields');
    fields.append(field('Tekst wskazówki',tip,value=>{data.discussionTips[index]=value;},{wide:true,multiline:true,maxlength:160}));
    row.append(fields);
    const actions=create('div','row-actions');
    const button=create('button','remove','×');
    button.type='button';button.title='Usuń wskazówkę';
    button.addEventListener('click',()=>{
      data.discussionTips.splice(index,1);markDirty();renderExtra();
    });
    actions.append(button);row.append(actions);list.append(row);
  });
}
function addTip(){
  if(!Array.isArray(data?.discussionTips))return;
  if(data.discussionTips.length>=100)return showToast('Maksymalnie 100 wskazówek.',true);
  data.discussionTips.push('Nowa wskazówka');markDirty();renderExtra();
}

function makeEntry(){
  const list=selectedList(),category=data.categories[activeCategory];
  if(data.game==='dzika-karta')return activeDeck==='prompts'?'Nowe pytanie: ____.' :'Nowa odpowiedź';
  if(data.game==='synchronizacja'||data.game==='trzy-w-piec'){
    const ids=new Set(data.categories.flatMap(c=>listOf(c).map(x=>x.id)));
    let count=1;while(ids.has(`${category.id}-${String(count).padStart(2,'0')}`))count++;
    const id=`${category.id}-${String(count).padStart(2,'0')}`;
    return data.game==='synchronizacja'?{id,left:'Lewy biegun',right:'Prawy biegun'}:{id,text:'Wymień 3 rzeczy…'};
  }
  if(data.game==='naokolo')return{word:'Nowe hasło',forbidden:['Słowo 1','Słowo 2','Słowo 3']};
  return{word:data.game==='ticking-bomb'?'Wymieniajcie…':'Nowe hasło',hint:''};
}
function addEntry(){
  const list=selectedList();if(list.length>=500)return showToast('Limit 500 pozycji na zestaw.',true);
  list.push(makeEntry());previewIndex=list.length-1;markDirty();render();
  const last=$$('items-list').lastElementChild;last?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
}
function removeEntry(index){
  const list=selectedList();
  const min=data.game==='dzika-karta'?(activeDeck==='prompts'?3:10):1;
  if(list.length<=min)return showToast(`W tym zestawie musi pozostać co najmniej ${min} pozycji.`,true);
  list.splice(index,1);previewIndex=0;markDirty();render();
}
function moveEntry(index,delta){
  const list=selectedList(),other=index+delta;
  if(other<0||other>=list.length)return;
  [list[index],list[other]]=[list[other],list[index]];
  previewIndex=other;markDirty();render();
}
function addCategory(){
  if(data.categories.length>=100)return showToast('Maksymalnie 100 kategorii.',true);
  let n=1;while(data.categories.some(c=>c.id===`nowa-${n}`))n++;
  const id=`nowa-${n}`;
  const category={id,name:'Nowa kategoria',desc:'',icon:'fa-layer-group',[TYPE[data.game]]:[]};
  data.categories.push(category);activeCategory=data.categories.length-1;
  category[TYPE[data.game]].push(makeEntry());markDirty();render();
}
function removeCategory(){
  if(data.categories.length<=1)return showToast('Ostatniej kategorii nie można usunąć.',true);
  const cat=data.categories[activeCategory];
  if(!confirm(`Usunąć kategorię „${cat.name}” razem z ${listOf(cat).length} pozycjami? Ta operacja trafi tylko do szkicu.`))return;
  data.categories.splice(activeCategory,1);
  activeCategory=Math.max(0,activeCategory-1);markDirty();render();
}
function renderPreview(){
  const view=$$('preview');view.replaceChildren();
  const entries=selectedList(),item=entries[Math.max(0,Math.min(entries.length-1,previewIndex))];
  const category=data.game==='dzika-karta'?(activeDeck==='prompts'?'Karta pytania':'Karta odpowiedzi'):data.categories[activeCategory]?.name;
  view.append(create('div','preview-category',category||'Podgląd'));
  if(!item){view.append(create('p','', 'Brak pozycji do podglądu.'));return;}
  if(typeof item==='string')view.append(create('strong','',item));
  else if(data.game==='synchronizacja')view.append(create('strong','',`${item.left} ←  → ${item.right}`));
  else if(data.game==='trzy-w-piec')view.append(create('strong','',item.text));
  else {
    view.append(create('strong','',item.word||''));
    if(data.game==='impostor'&&item.hint)view.append(create('small','',`Podpowiedź: ${item.hint}`));
    if(data.game==='naokolo')view.append(create('small','forbidden',`Nie mów: ${(item.forbidden||[]).join(' · ')}`));
    if(data.game==='ticking-bomb'&&item.hint)view.append(create('small','',item.hint));
  }
}
function validate(){
  if(data.schemaVersion!==1||data.game!==record.game_id||data.locale!==record.locale)throw new Error('Gra, język lub wersja schematu są niezgodne.');
  if(data.game==='dzika-karta'){
    if(data.prompts?.length<3||data.answers?.length<10)throw new Error('Dzika Karta wymaga minimum 3 pytań i 10 odpowiedzi.');
    return;
  }
  if(!Array.isArray(data.categories)||data.categories.length<1||data.categories.length>100)throw new Error('Zła liczba kategorii.');
  const ids=new Set();const itemIds=new Set(),type=TYPE[data.game];
  for(const cat of data.categories){
    if(!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(cat.id||'')||ids.has(cat.id))throw new Error('ID kategorii musi być unikalne (małe litery, cyfry, _ i -).');
    ids.add(cat.id);
    if(!safeString(cat.name)||!/^fa-[a-z0-9-]+$/.test(cat.icon||''))throw new Error(`Nieprawidłowa nazwa lub ikona kategorii ${cat.id}.`);
    if(!cat[type]?.length||cat[type].length>500)throw new Error(`Kategoria ${cat.name} musi zawierać 1–500 pozycji.`);
    for(const x of cat[type]){
      if(data.game==='naokolo'&&(!safeString(x.word)||x.forbidden?.length<3||x.forbidden.length>6))throw new Error('Naokoło: każde hasło wymaga 3–6 zakazanych słów.');
      if(data.game==='synchronizacja'&&(!safeString(x.left)||!safeString(x.right)||x.left===x.right))throw new Error('Synchronizacja: bieguny muszą być różne.');
      if(data.game==='trzy-w-piec'&&!safeString(x.text))throw new Error('Trzy w Pięć: pytanie nie może być puste.');
      if(type==='words'&&!safeString(x.word))throw new Error('Hasło nie może być puste.');
      if(type==='scales'||(data.game==='trzy-w-piec')){
        if(!/^[a-z0-9][a-z0-9_-]{0,59}$/.test(x.id)||itemIds.has(x.id))throw new Error('ID skali/pytania musi być unikalne.');
        itemIds.add(x.id);
      }
    }
  }
}
async function saveDraft(){
  try{
    validate();setBusy(true);
    const newRevision=await request('/rest/v1/rpc/party_editor_save',{
      body:{p_game:record.game_id,p_locale:record.locale,p_draft:data,p_revision:record.revision}
    });
    record.revision=newRevision;record.draft=clone(data);record.updated_at=new Date().toISOString();
    dirty=false;$$('revision-label').textContent=`Wersja ${record.revision}`;
    $$('published-pill').textContent='Szkic zapisany';
    $$('published-pill').classList.add('muted');
    updateStats();showToast('Szkic zapisany. Gracze nadal widzą poprzednią wersję.');
    return true;
  }catch(error){showToast(error.message,true);return false;}finally{setBusy(false);}
}
async function publish(){
  if(dirty && !await saveDraft())return;
  if(!confirm(`Opublikować aktualną wersję gry „${NAMES[record.game_id]}” dla graczy? Zmiany będą pobierane przy uruchomieniu gry z dostępem do sieci.`))return;
  try{
    validate();setBusy(true);
    await request('/rest/v1/rpc/party_editor_publish',{body:{
      p_game:record.game_id,p_locale:record.locale,p_revision:record.revision
    }});
    record.published=clone(data);record.published_revision=record.revision;
    $$('published-pill').textContent='Opublikowana';$$('published-pill').classList.remove('muted');
    showToast('Opublikowano! Dostępne dla urządzeń z włączoną synchronizacją.');
  }catch(error){showToast(error.message,true);}finally{setBusy(false);}
}
function exportJson(){
  const text=JSON.stringify(data,null,2),blob=new Blob([text],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const anchor=create('a');anchor.href=url;anchor.download=`${data.game}.${data.locale}.json`;
  anchor.click();URL.revokeObjectURL(url);
}
async function importJson(event){
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>750000)return showToast('Plik przekracza limit 750 KB.',true);
  try{
    const imported=JSON.parse(await file.text());
    if(imported.game!==record.game_id||imported.locale!==record.locale)throw new Error('Plik dotyczy innej gry lub języka.');
    if(!confirm(`Wczytać nowy zestaw dla gry „${NAMES[record.game_id]}”? Dotychczasowy szkic zostanie zastąpiony, ale nie opublikowany.`))return;
    const old=data;data=imported;
    try{validate();}catch(error){data=old;throw error;}
    activeCategory=0;activeDeck='prompts';previewIndex=0;markDirty();render();
    showToast('Import gotowy. Zapisz szkic, aby zachować zmiany.');
  }catch(error){showToast(error.message,true);}
}
async function history(){
  try{
    const rows=await request('/rest/v1/rpc/party_editor_history',{body:{p_game:record.game_id,p_locale:record.locale}});
    const list=$$('history-list');list.replaceChildren();
    if(!rows.length)list.append(create('p','empty','Brak wcześniejszych zmian.'));
    for(const row of rows){
      const el=create('div','history-item');
      const text=create('span');
      text.append(create('strong','',`Wersja ${row.revision} · ${{save:'Zapis',publish:'Publikacja',restore:'Przywrócenie'}[row.action]||row.action}`),create('small','',new Date(row.created_at).toLocaleString('pl-PL')));
      const btn=create('button','secondary','Przywróć');
      btn.addEventListener('click',()=>restore(row.id));
      el.append(text,btn);list.append(el);
    }
    $$('history-dialog').showModal();
  }catch(error){showToast(error.message,true);}
}
async function restore(id){
  if(dirty&&!confirm('Masz niezapisane zmiany. Przywrócić wybraną wersję jako nowy szkic?'))return;
  if(!confirm('Przywrócić tę wersję do szkicu? Opublikowana wersja nie zostanie zmieniona.'))return;
  try{
    const game=record.game_id;
    await request('/rest/v1/rpc/party_editor_restore',{body:{
      p_game:record.game_id,p_locale:record.locale,p_history_id:id,p_revision:record.revision
    }});
    $$('history-dialog').close();await loadDocuments(game);
    showToast('Wersja przywrócona do szkicu. Możesz ją sprawdzić i opublikować.');
  }catch(error){showToast(error.message,true);}
}
function bootstrap(){
  try{
    const stored=JSON.parse(localStorage.getItem(STORE_CONFIG)||'null');
    config={...STUDIO_DEFAULTS,...(stored && typeof stored==='object'?stored:{})};
    $$('project-url').value=config.url;
    $$('publishable-key').value=config.key;
    $$('editor-email').value=config.email;
    session=JSON.parse(sessionStorage.getItem(STORE_SESSION)||'null');
    consumeMagicLinkCallback();
    if(session&&config.url&&config.key)openStudio().catch(error=>{
      sessionStorage.removeItem(STORE_SESSION);session=null;
      showToast('Nie udało się zalogować. Sprawdź uprawnienia konta lub spróbuj ponownie. '+error.message,true);
    });
  }catch{}
  $$('connect-form').addEventListener('submit',sendMagicLink);
  $$('logout').addEventListener('click',logout);
  $$('game-picker').addEventListener('change',e=>chooseGame(e.target.value));
  $$('group-search').addEventListener('input',renderGroups);
  $$('add-category').addEventListener('click',addCategory);
  $$('remove-category').addEventListener('click',removeCategory);
  $$('add-item').addEventListener('click',addEntry);
  $$('add-tip').addEventListener('click',addTip);
  $$('save-btn').addEventListener('click',saveDraft);
  $$('publish-btn').addEventListener('click',publish);
  $$('export-btn').addEventListener('click',exportJson);
  $$('import-btn').addEventListener('click',()=>$$('import-file').click());
  $$('import-file').addEventListener('change',importJson);
  $$('history-btn').addEventListener('click',history);
  $$('close-history').addEventListener('click',()=>$$('history-dialog').close());
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
}
bootstrap();
