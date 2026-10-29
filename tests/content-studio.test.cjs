const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname,'..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const packs = ['co-mam-na-mysli','dzika-karta','naokolo','synchronizacja','ticking-bomb','trzy-w-piec'];
const counts = { 'co-mam-na-mysli':90,'dzika-karta':165,impostor:114,naokolo:50,synchronizacja:48,'ticking-bomb':96,'trzy-w-piec':100 };
const html=read('admin/index.html');
const editor=read('admin/studio.js');
const sql=read('supabase/migrations/20261029_content_studio.sql');
for (const f of ['admin/studio.js','assets/js/shared/content-repository.js','assets/js/shared/content-config.js','tools/generate-content-seed.mjs']) {
  execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'pipe'});
}
for (const text of ['party_editor_save','party_editor_publish','party_editor_restore','party_get_published','party_editor_history']) {
  assert.ok(sql.includes('function public.'+text), 'Database RPC missing: '+text);
}
assert.match(sql,/enable row level security/g);
assert.match(sql,/revoke all on table public\.party_content_documents from public, anon, authenticated/);
assert.match(sql,/security definer set search_path = ''/);
assert.match(sql,/private\.party_is_editor\(\)/);
assert.doesNotMatch(html,/https?:\/\/.*(?:script|stylesheet)/);
assert.match(html,/Content-Security-Policy/);
assert.match(editor,/textContent =/);
assert.doesNotMatch(editor,/\.innerHTML\s*=/);
assert.doesNotMatch(editor,/service_role.*Authorization/i);

let requested = [];
let networkEnabled = true;
const storage = new Map();
const sandbox = {
  window: {
    location:{origin:'https://partyjniak.test'},
    PARTYJNIAK_CONTENT_SUPABASE:{url:'https://test-project.supabase.co',publishableKey:'sb_publishable_demo'}
  },
  localStorage: {
    getItem:k=>storage.get(k)||null,
    setItem:(k,v)=>storage.set(k,v),
    removeItem:k=>storage.delete(k)
  },
  URL, console, AbortController, setTimeout, clearTimeout,
  fetch: async (url,opts) => {
    if (!networkEnabled) throw new Error('offline');
    requested.push({url,options:opts});
    const {p_game}=JSON.parse(opts.body);
    const payload=p_game==='impostor'?impostor:JSON.parse(read('content/'+p_game+'.pl.json'));
    return {ok:true,json:async()=>payload};
  }
};
const dataSrc=read('assets/js/games/impostor/data.js');
const impre=vm.runInNewContext(dataSrc+'\n({WORD_DATABASE,CATEGORY_NAMES,DISCUSSION_TIPS})');
const impostor={
  schemaVersion:1,game:'impostor',locale:'pl',
  categories:Object.entries(impre.WORD_DATABASE).map(([id,words])=>({id,name:impre.CATEGORY_NAMES[id].name,icon:impre.CATEGORY_NAMES[id].icon,desc:impre.CATEGORY_NAMES[id].desc,words})),
  discussionTips:impre.DISCUSSION_TIPS
};
vm.createContext(sandbox);
vm.runInContext(read('assets/js/shared/content-repository.js'),sandbox);
const repo=sandbox.window.PartyjniakContent.repository;
(async()=>{
  for(const game of ['impostor',...packs]){
    const data=game==='impostor'?impostor:JSON.parse(read('content/'+game+'.pl.json'));
    const validated=repo.validate(data,game,'pl');
    assert.equal(validated.game,game);
    const count=validated.categories
      ? validated.categories.reduce((n,c)=>n+(c.words||c.cards||c.scales||c.prompts).length,0)
      : validated.prompts.length+validated.answers.length;
    assert.equal(count,counts[game],game);
    const remote=await repo.loadRemote(game,'pl',{force:true});
    assert.ok(remote,game+' did not load remote document');
  }
  assert.equal(requested.length,7);
  assert.ok(requested.every(r=>r.url.endsWith('/rest/v1/rpc/party_get_published')));
  assert.ok(requested.every(r=>r.options.headers.apikey==='sb_publishable_demo'));
  assert.ok(requested.every(r=>!r.options.headers.Authorization.includes('service_role')));
  networkEnabled=false;
  const stale=await repo.loadRemote('impostor','pl',{force:true});
  assert.equal(stale.categories.length,16,'Cached published data should survive offline');
  assert.throws(()=>repo.validate({...impostor,categories:[]},'impostor','pl'));
  assert.throws(()=>repo.validate({...impostor,game:'naokolo'},'impostor','pl'));
  assert.throws(()=>repo.validate({...impostor,categories:[{id:'x',name:'X',icon:'fa-x" onclick',words:[{word:'a'}]}]},'impostor','pl'));
  execFileSync(process.execPath,[path.join(root,'tools/generate-content-seed.mjs'),'--check'],{stdio:'pipe'});
  assert.equal((read('supabase/seed.sql').match(/on conflict \(game_id, locale\) do nothing/g)||[]).length,7);
  console.log('Content Studio schemas, seven-game import, Supabase public API and offline caching: OK');
})().catch(error=>{console.error(error);process.exitCode=1;});

assert.match(read('admin/index.html'), /id="extra-settings"/);
assert.match(read('admin/studio.js'), /function renderExtra\(/);
assert.match(sql, /'restore',restored,auth\.uid\(\)/);
