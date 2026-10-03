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
assert.match(runtime, /family:\s*entry\.id/);
assert.match(runtime, /activeBackgroundFamily/);
assert.match(runtime, /if \(activeBackgroundFamily === family\) return;/);
assert.match(runtime, /applyPartyjniakGameTheme/);
assert.match(runtime, /--ui-accent/);
assert.match(runtime, /previewBackground/);
assert.match(app, /registerGameModules\(\);\s*initializePartyjniakThemes\?\.\(\);/);

// game-themes owns metadata/palette wiring only. Phaser rendering must live in one place.
assert.doesNotMatch(runtime, /buildParticleField|partyjniakThemeMotifs|schedulePartyjniakThemeMotifs|scene\.add|setBlendMode/);

assert.match(impostor, /overlayMotif:\s*'suspect-radar'/);
assert.match(bomb, /overlayMotif:\s*'fuse-sparks'/);
assert.match(naokolo, /overlayMotif:\s*'orbit-words'/);
assert.match(cmm, /overlayMotif:\s*'thought-field'/);
assert.match(prototypes, /overlayMotif:\s*'wild-cards'/);

// One renderer owns the whole animated background. Halos are vector layers,
// not giant stretched CanvasTextures that can expose rectangular WebGL artifacts.
assert.match(background, /this\.halos\s*=\s*\[\]/);
assert.match(background, /this\.accents\s*=\s*\[\]/);
assert.match(background, /this\.dust\s*=\s*\[\]/);
assert.match(background, /createHalo\(definition, index\)/);
assert.match(background, /this\.add\.container/);
assert.match(background, /this\.add\.circle/);
assert.doesNotMatch(background, /createCanvas|textures\.createCanvas|createRadialGradient|glowTextureKey/);

// Visual scale follows the short viewport edge so desktop/landscape stays readable.
assert.match(background, /short\s*\/\s*390/);
assert.match(background, /uiScale/);
assert.match(background, /densityScale/);
assert.match(background, /createParticleLayer\('accent'\)/);
assert.match(background, /createParticleLayer\('dust'\)/);
assert.match(background, /setBlendMode\?\.\('ADD'\)/);
assert.match(background, /prefers-reduced-motion/);
assert.match(background, /window\.addEventListener\('resize'/);

// A whole game owns one continuous composition. Screen changes inside that family
// must not destroy/reseed particles or recolor the page-level background.
assert.match(background, /resolveFamily\(modeName, mode\)/);
assert.match(background, /this\.visualFamily/);
assert.match(background, /if \(!force && this\.visualFamily === nextFamily && this\.profile && this\.mode\) return;/);
assert.match(background, /family:\s*'impostor'/);
assert.match(background, /family:\s*'ticking-bomb'/);
assert.match(background, /profiles\[family\] \|\| profiles\.home/);
assert.match(background, /backgroundScene\?\.rebuildVisuals\(\)/);

// Distinct motion language still exists per game family.
assert.match(background, /impostor:[\s\S]*?behavior:\s*'scan'/);
assert.match(background, /'ticking-bomb':[\s\S]*?behavior:\s*'embers'/);
assert.match(background, /naokolo:[\s\S]*?behavior:\s*'ribbon'/);
assert.match(background, /'co-mam-na-mysli':[\s\S]*?behavior:\s*'tilt'/);
assert.match(background, /'dzika-karta':[\s\S]*?behavior:\s*'cards'/);

// Bomb is intentionally calmer than the first particle pass: fewer accent sparks,
// lower base velocity and gentler lateral ember sway.
assert.match(bomb, /'ticking-bomb':[\s\S]*?speed:\s*0\.55/);
assert.match(background, /'ticking-bomb':[\s\S]*?accent:\s*\{\s*count:\s*24[\s\S]*?speed:\s*\[\.14, \.34\]/);
assert.match(background, /dust:\s*\{\s*count:\s*52[\s\S]*?speed:\s*\[\.06, \.17\]/);
assert.match(background, /behavior === 'embers'[\s\S]*?\* \.92/);
assert.match(background, /Math\.sin\(time \* \.00075 \+ node\.phase\) \* \.065/);

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
console.log('Stable module-owned Phaser background system tests: OK');
