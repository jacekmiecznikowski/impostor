const assert=require('node:assert/strict');const Rules=require('../assets/js/games/trzy-rundy/rules.js');
assert.equal(Rules.ROUND_MODES.length,3);assert.deepEqual(Rules.ROUND_MODES.map(x=>x.id),['describe','act','one-word']);
assert.equal(Rules.normalizePoolSize(1),12);assert.equal(Rules.normalizePoolSize(99),36);assert.equal(Rules.normalizeTurnSeconds(1),20);assert.equal(Rules.normalizeTurnSeconds(999),90);
const players=[{name:'A'},{name:'B'},{name:'C'},{name:'D'},{name:'E'}];const teams=Rules.assignTeams(players);assert.deepEqual(teams[0].map(p=>p.name),['A','C','E']);assert.deepEqual(teams[1].map(p=>p.name),['B','D']);
const cats=[{id:'x',name:'X',words:[{id:'x1',text:'A'},{id:'x2',text:'B'}]}];assert.equal(Rules.createPool(cats,['x'],12,()=>0).length,2);
assert.equal(Rules.nextTeam(0),1);assert.equal(Rules.nextTeam(1),0);assert.equal(Rules.nextClueOffset(1,2),0);assert.equal(Rules.isGameComplete(4),true);assert.equal(Rules.teamWinner([3,3]),-1);assert.equal(Rules.teamWinner([4,2]),0);assert.equal(Rules.teamWinner([1,5]),1);
console.log('Trzy Rundy rules tests: OK');
