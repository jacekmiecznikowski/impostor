const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const payload=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/trzy-rundy.pl.json'),'utf8'));
assert.equal(payload.game,'trzy-rundy');assert.ok(Array.isArray(payload.categories));assert.ok(payload.categories.length>=5);
const words=payload.categories.flatMap(c=>c.words||[]);assert.ok(words.length>=90,'Trzy Rundy should ship a substantial word pool');
assert.equal(new Set(words.map(w=>String(w).toLocaleLowerCase('pl-PL'))).size,words.length,'words must be unique');
payload.categories.forEach(c=>{assert.ok(c.id&&c.name&&c.icon);assert.ok(c.words.length>=12,`category ${c.id} should work on its own`);});
console.log('Trzy Rundy content tests: OK');
