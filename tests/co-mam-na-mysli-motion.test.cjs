const assert = require('node:assert/strict');
const Motion = require('../assets/js/games/co-mam-na-mysli/motion.js');

assert.equal(Motion.normalizeOrientationAngle(-90), 270);
assert.equal(Motion.normalizeAngleDelta(5, 355), 10);
assert.equal(Motion.normalizeAngleDelta(350, 10), -20);
assert.equal(Motion.getTiltValue({ beta: 18, gamma: 32 }, 0), 18);
assert.equal(Motion.getTiltValue({ beta: 18, gamma: 32 }, 90), 32);
assert.equal(Motion.getTiltValue({ beta: 18, gamma: 32 }, 270), -32);

const neutralGravity = Motion.getGravityTiltValue({ accelerationIncludingGravity: { x: 9.81, y: 0, z: 0 } }, 90);
assert.ok(Math.abs(neutralGravity) < 0.001);
const tiltedGravity = Motion.getGravityTiltValue({ accelerationIncludingGravity: { x: 8.66, y: 0, z: 5 } }, 90);
assert.ok(Math.abs(tiltedGravity - 30) < 0.2);
assert.equal(Motion.getGravityTiltValue({}, 90), null);

Motion.resetGestureCooldown();
assert.equal(Motion.isNeutral(10, 0, 12, 1000), true);
assert.equal(Motion.isNeutral(18, 0, 12, 1000), false);
assert.equal(Motion.classifyTilt(30, 0, 28, 1000), 'correct');
assert.equal(Motion.getGestureCooldownUntil(), 1000 + Motion.GESTURE_COOLDOWN_MS);
assert.equal(Motion.isNeutral(0, 0, 12, 1000 + Motion.GESTURE_COOLDOWN_MS - 1), false);
assert.equal(Motion.isNeutral(0, 0, 12, 1000 + Motion.GESTURE_COOLDOWN_MS), true);

Motion.resetGestureCooldown();
assert.equal(Motion.classifyTilt(-30, 0, 28, 5000), 'passed');
assert.equal(Motion.isNeutral(0, 0, 12, 5000 + 600), false);
assert.equal(Motion.isNeutral(30, 0, 12, 5000 + Motion.GESTURE_COOLDOWN_MS), false);
assert.equal(Motion.isNeutral(0, 0, 12, 5000 + Motion.GESTURE_COOLDOWN_MS), true);

Motion.resetGestureCooldown();
assert.equal(Motion.classifyTilt(20, 0, 28, 9000), null);
assert.equal(Motion.getGestureCooldownUntil(), 0);

console.log('Co mam na myśli motion tests: OK');
