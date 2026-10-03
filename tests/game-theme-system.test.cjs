const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const app = read('assets/js/app.js');
const index = read('index.html');
const runtime = read('assets/js/shared/game-themes.js');
const background = read('assets/js/shared/background.js');
const colors = read('assets/css/game-color-system.css');
const brand = read('assets/css/brand-theme.css');
const impostor = read('assets/js/games/impostor/integration.js');
const bomb = read('assets/js/games/ticking-bomb/integration.js');
const naokolo = read('assets/js/games/naokolo/integration.js');
const cmm = read('assets/js/games/co-mam-na-mysli/integration.js');
const prototypes = read('assets/js/games/prototypes/integration.js');

for (const [name, source] of [['impostor', impostor], ['ticking-bomb', bomb], ['naokolo', naokolo], ['co-mam-na-mysli', cmm], ['prototypes', prototypes]]) {
  assert.match(source, /theme:\s*\{/ , `${name} must own a theme`);
  assert.match(source, /palette:\s*\{/ , `${name} must own a palette`);
  assert.match(source, /backgrounds:\s*\{/ , `${name} must own background definitions`);
}

assert.match(naokolo, /id:\s*'naokolo'[\s\S]*?theme:/);
assert.match(cmm, /id:\s*'co-mam-na-mysli'[\s\S]*?theme:/);
assert.match(prototypes, /id:\s*'dzika-karta'[\s\S]*?theme:/);
assert.doesNotMatch(prototypes, /id:\s*'co-mam-na-mysli'/);

assert.match(runtime, /getGameModule\?\.\(gameId\)\?\.theme/);
assert.match(runtime, /registerPartyjniakBackgroundModes/);
assert.match(runtime, /applyPartyjniakGameTheme/);
assert.match(runtime, /--ui-accent/);
assert.match(runtime, /previewBackground/);
assert.match(runtime, /overlayMotif:\s*'party-aurora'/);
assert.match(app, /registerGameModules\(\);\s*initializePartyjniakThemes\?\.\(\);/);

// game-themes owns metadata/palette wiring only. Phaser rendering must live in one place.
assert.doesNotMatch(runtime, /buildParticleField|partyjniakThemeMotifs|schedulePartyjniakThemeMotifs|scene\.add|setBlendMode/);

assert.match(impostor, /overlayMotif:\s*'suspect-radar'/);
assert.match(impostor, /overlayMotif:\s*'dialogue-network'/);
assert.match(impostor, /overlayMotif:\s*'verdict'/);
assert.match(impostor, /overlayMotif:\s*'victory-rings'/);
assert.match(bomb, /overlayMotif:\s*'fuse-sparks'/);
assert.match(bomb, /overlayMotif:\s*'shockwave'/);
assert.match(naokolo, /overlayMotif:\s*'orbit-words'/);
assert.match(naokolo, /overlayMotif:\s*'orbit-fast'/);
assert.match(naokolo, /overlayMotif:\s*'orbit-celebrate'/);
assert.match(cmm, /overlayMotif:\s*'thought-field'/);
assert.match(cmm, /overlayMotif:\s*'gyro'/);
assert.match(cmm, /overlayMotif:\s*'thought-celebrate'/);
assert.match(prototypes, /overlayMotif:\s*'wild-cards'/);

// One responsive Phaser renderer: soft glow layer + medium accents + fine dust.
assert.match(background, /this\.glows\s*=\s*\[\]/);
assert.match(background, /this\.accents\s*=\s*\[\]/);
assert.match(background, /this\.dust\s*=\s*\[\]/);
assert.match(background, /ensureGlowTexture\(\)/);
assert.match(background, /createRadialGradient/);
assert.match(background, /resolveVisualProfile\(modeName, mode\)/);
assert.match(background, /createParticleLayer\('accent'\)/);
assert.match(background, /createParticleLayer\('dust'\)/);
assert.match(background, /updateGlows\(time\)/);
assert.match(background, /short\s*\/\s*390/);
assert.match(background, /densityScale/);
assert.match(background, /setBlendMode\?\.\('ADD'\)/);
assert.match(background, /prefers-reduced-motion/);
assert.match(background, /window\.addEventListener\('resize'/);

// Distinct motion language per game.
assert.match(background, /'suspect-radar':[\s\S]*?behavior:\s*modeName === 'mystery' \? 'stealth' : 'scan'/);
assert.match(background, /'fuse-sparks':[\s\S]*?behavior:\s*'embers'/);
assert.match(background, /shockwave:[\s\S]*?behavior:\s*'blast'/);
assert.match(background, /'orbit-fast':[\s\S]*?behavior:\s*'rush'/);
assert.match(background, /gyro:[\s\S]*?behavior:\s*'tilt'/);
assert.match(background, /'thought-field':[\s\S]*?behavior:\s*'bokeh'/);
assert.match(background, /'wild-cards':[\s\S]*?behavior:\s*'cards'/);
assert.doesNotMatch(background, /clearPartyjniakThemeMotifs|buildImpostorBackdrop|buildBombBackdrop|buildPartyBackdrop/);

assert.doesNotMatch(colors, /body\[data-game=/);
assert.doesNotMatch(brand, /body\[data-bg-mode=/);
assert.doesNotMatch(brand, /data-game-id="/);
assert.match(colors, /var\(--ui-accent\)/);
assert.match(colors, /var\(--page-glow-rgb\)/);
assert.match(brand, /var\(--game-rgb\)/);

assert.doesNotMatch(index, /ticking-bomb-theme\.css/);
assert.doesNotMatch(index, /impostor:\s*\{/);
assert.doesNotMatch(index, /bomb:\s*\{/);
assert.equal(fs.existsSync(path.join(root, 'assets/css/ticking-bomb-theme.css')), false);

new Function(runtime);
new Function(background);
console.log('Module-owned single-renderer Phaser theme system tests: OK');
