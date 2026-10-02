const assert = require('node:assert/strict');
const Motion = require('../assets/js/games/co-mam-na-mysli/motion.js');

assert.equal(Motion.normalizeOrientationAngle(-90), 270);
assert.equal(Motion.normalizeAngleDelta(5, 355), 10);
assert.equal(Motion.normalizeAngleDelta(350, 10), -20);
assert.equal(Motion.getTiltValue({ beta: 18, gamma: 32 }, 0), 18);
assert.equal(Motion.getTiltValue({ beta: 18, gamma: 32 }, 90), 32);
assert.equal(Motion.getTiltValue({ beta: 18, gamma: 32 }, 270), -32);
assert.equal(Motion.classifyTilt(30, 0, 28), 'correct');
assert.equal(Motion.classifyTilt(-30, 0, 28), 'passed');
assert.equal(Motion.classifyTilt(20, 0, 28), null);
assert.equal(Motion.isNeutral(10, 0, 12), true);
assert.equal(Motion.isNeutral(18, 0, 12), false);

console.log('Co mam na myśli motion tests: OK');
