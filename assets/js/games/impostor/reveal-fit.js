let revealWordFitObserver = null;
let revealWordResizeObserver = null;
let revealWordFitFrame = 0;

function scheduleRevealWordFit() {
    cancelAnimationFrame(revealWordFitFrame);
    revealWordFitFrame = requestAnimationFrame(fitRevealSecretWord);
}

function fitRevealSecretWord() {
    const word = document.getElementById('secret-word-display');
    const block = word?.closest('.reveal-secret-block');
    const label = document.getElementById('secret-label-type');
    if (!word || !block || !label || block.clientWidth <= 0) return;

    const style = getComputedStyle(block);
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const gap = parseFloat(style.rowGap || style.gap) || 0;
    const availableWidth = Math.max(40, block.clientWidth - paddingX - 2);
    const availableHeight = Math.max(34, block.clientHeight - paddingY - label.offsetHeight - gap - 2);

    const compact = document.querySelector('.reveal-card')?.classList.contains('hold-upper');
    const maxSize = compact ? 42 : 58;
    const minSize = compact ? 23 : 26;

    word.dataset.fitMin = 'false';
    word.style.removeProperty('font-size');
    word.style.removeProperty('max-height');
    word.style.setProperty('max-height', `${availableHeight}px`);

    const fits = size => {
        word.style.setProperty('font-size', `${size}px`, 'important');
        // Force layout because the element can contain balanced multi-line text.
        void word.offsetHeight;
        return word.scrollWidth <= availableWidth + 1 && word.scrollHeight <= availableHeight + 1;
    };

    let low = minSize;
    let high = maxSize;
    let best = minSize;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (fits(mid)) {
            best = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    word.style.setProperty('font-size', `${best}px`, 'important');

    if (!fits(best)) {
        word.dataset.fitMin = 'true';
        word.style.setProperty('font-size', `${minSize}px`, 'important');
    }
}

function setupRevealWordFitting() {
    const word = document.getElementById('secret-word-display');
    const block = word?.closest('.reveal-secret-block');
    const card = document.querySelector('.reveal-card');
    if (!word || !block || !card) return;

    revealWordFitObserver?.disconnect();
    revealWordFitObserver = new MutationObserver(scheduleRevealWordFit);
    revealWordFitObserver.observe(word, { childList: true, characterData: true, subtree: true });
    revealWordFitObserver.observe(card, { attributes: true, attributeFilter: ['class'] });

    revealWordResizeObserver?.disconnect();
    if ('ResizeObserver' in window) {
        revealWordResizeObserver = new ResizeObserver(scheduleRevealWordFit);
        revealWordResizeObserver.observe(block);
        revealWordResizeObserver.observe(card);
    }

    window.addEventListener('orientationchange', scheduleRevealWordFit, { passive: true });
    window.addEventListener('resize', scheduleRevealWordFit, { passive: true });
    document.fonts?.ready?.then(scheduleRevealWordFit).catch(() => {});
    scheduleRevealWordFit();
}
