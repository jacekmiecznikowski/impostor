(function exposeCoMamNaMysliMotion(root) {
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

    function classifyTilt(current, baseline, threshold = 28) {
        const delta = normalizeAngleDelta(current, baseline);
        if (delta >= threshold) return 'correct';
        if (delta <= -threshold) return 'passed';
        return null;
    }

    function isNeutral(current, baseline, releaseThreshold = 12) {
        return Math.abs(normalizeAngleDelta(current, baseline)) <= releaseThreshold;
    }

    const api = {
        normalizeOrientationAngle,
        normalizeAngleDelta,
        getTiltValue,
        classifyTilt,
        isNeutral
    };

    root.CoMamNaMysliMotion = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
