import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.join(import.meta.dirname, '..');
globalThis.window = {};
globalThis.document = { body: { dataset: { screen: 'home' } } };

const registryUrl = `${pathToFileURL(path.join(root, 'assets/js/shared/game-registry.js')).href}?test=registry-behavior`;
const registry = await import(registryUrl);

assert.throws(
  () => registry.registerGameModule({ id: 'broken', session: { load() {} } }),
  /musi implementować save\(\)/
);

const events = [];
const players = [{ id: 1, name: 'Ala' }, { id: 2, name: 'Bartek' }];
const session = {
  load() { events.push('load'); return 'loaded'; },
  save() { events.push('save'); return 'saved'; },
  reset() { events.push('reset'); return 'reset'; },
  hasResume() { events.push('hasResume'); return true; },
  getPlayers() { events.push('getPlayers'); return players; },
  syncUi() { events.push('syncUi'); }
};

const module = registry.registerGameModule({
  id: 'demo',
  screens: ['demo-menu', 'demo-play'],
  session,
  ping(value) { events.push(`ping:${value}`); return value * 2; }
});

assert.equal(registry.getGameModule('demo'), module);
assert.equal(registry.getGameSession('demo'), session);
assert.equal(registry.getGameIdForScreen('demo-play'), 'demo');
assert.equal(registry.getGameIdForScreen('unknown'), 'home');
assert.equal(registry.callGameHook('demo', 'ping', 7), 14);
assert.equal(registry.callGameHook('demo', 'missing'), undefined);

const loadResults = registry.loadGameSessions();
assert.equal(loadResults.get('demo'), 'loaded');
registry.syncGameSessionUi();
assert.equal(registry.saveGameSession('demo'), 'saved');
assert.equal(registry.resetGameSession('demo'), 'reset');
assert.equal(registry.hasGameResume('demo'), true);
assert.deepEqual(registry.getGamePlayers('demo'), players);

window.getCurrentScreenName = () => 'demo-play';
assert.equal(registry.getActiveGameId(), 'demo');
assert.equal(registry.getActiveGameModule(), module);
assert.equal(registry.getActiveGameSession(), session);

assert.deepEqual(events, [
  'ping:7',
  'load',
  'syncUi',
  'save',
  'reset',
  'hasResume',
  'getPlayers'
]);

assert.equal(window.registerGameModule, registry.registerGameModule);
assert.equal(window.getGamePlayers, registry.getGamePlayers);

console.log('Game registry behavior tests: OK');
