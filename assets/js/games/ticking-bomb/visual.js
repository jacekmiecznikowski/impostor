function assembleTickingBombVisual() {
    const visual = document.getElementById('bomb-visual');
    const body = visual?.querySelector('.bomb-body');
    const fuse = visual?.querySelector('.bomb-fuse');
    if (!body || !fuse || fuse.parentElement === body) return;
    body.appendChild(fuse);
}

const tickingBombVisualObserver = new MutationObserver(() => {
    assembleTickingBombVisual();
});

tickingBombVisualObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', assembleTickingBombVisual, { once: true });
window.addEventListener('load', assembleTickingBombVisual, { once: true });
