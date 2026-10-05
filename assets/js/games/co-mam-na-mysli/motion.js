(function exposeCoMamNaMysliMotion(root) {
    const GESTURE_COOLDOWN_MS = 1200;
    let gestureCooldownUntil = 0;

    function normalizeOrientationAngle(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        return ((numeric % 360) + 360) % 360;
    }

    function normalizeAngleDelta(current, baseline) {
        let delta = (Number(current) || 0) - (Number(baseline) || 0);
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        return delta;
    }

    function getTiltValue(event, orientationAngle = 0) {
        const angle = normalizeOrientationAngle(orientationAngle);
        const beta = Number(event?.beta) || 0;
        const gamma = Number(event?.gamma) || 0;
        if (angle === 90) return gamma;
        if (angle === 270) return -gamma;
        if (angle === 180) return -beta;
        return beta;
    }

    function getGravityTiltValue(event, orientationAngle = 0) {
        const acceleration = event?.accelerationIncludingGravity;
        if (!acceleration) return null;
        const angle = normalizeOrientationAngle(orientationAngle);
        const x = Number(acceleration.x);
        const y = Number(acceleration.y);
        const z = Number(acceleration.z);
        if (![x, y, z].every(Number.isFinite)) return null;
        const verticalGravity = angle === 90 || angle === 270 ? Math.abs(x) : Math.abs(y);
        const safeVertical = Math.max(0.25, verticalGravity);
        return Math.atan2(z, safeVertical) * (180 / Math.PI);
    }

    function armGestureCooldown(now = Date.now()) {
        gestureCooldownUntil = Number(now) + GESTURE_COOLDOWN_MS;
        return gestureCooldownUntil;
    }

    function classifyTilt(current, baseline, threshold = 28, now = Date.now()) {
        const delta = normalizeAngleDelta(current, baseline);
        if (delta >= threshold) {
            armGestureCooldown(now);
            return 'correct';
        }
        if (delta <= -threshold) {
            armGestureCooldown(now);
            return 'passed';
        }
        return null;
    }

    function isNeutral(current, baseline, releaseThreshold = 12, now = Date.now()) {
        if (Number(now) < gestureCooldownUntil) return false;
        return Math.abs(normalizeAngleDelta(current, baseline)) <= releaseThreshold;
    }

    function resetGestureCooldown() {
        gestureCooldownUntil = 0;
    }

    function getGestureCooldownUntil() {
        return gestureCooldownUntil;
    }

    const api = {
        GESTURE_COOLDOWN_MS,
        normalizeOrientationAngle,
        normalizeAngleDelta,
        getTiltValue,
        getGravityTiltValue,
        classifyTilt,
        isNeutral,
        resetGestureCooldown,
        getGestureCooldownUntil
    };
    root.CoMamNaMysliMotion = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
