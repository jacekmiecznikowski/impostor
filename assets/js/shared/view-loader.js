const APP_VIEW_FRAGMENTS = [
    { target: '#app-main', url: './views/impostor-setup.html' },
    { target: '#app-main', url: './views/impostor-round.html' },
    { target: '#modal-root', url: './views/modals.html' }
];

async function loadAppViews() {
    for (const fragment of APP_VIEW_FRAGMENTS) {
        const target = document.querySelector(fragment.target);
        if (!target) throw new Error(`Brak kontenera widoku: ${fragment.target}`);

        const response = await fetch(fragment.url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Nie udało się załadować widoku ${fragment.url} (HTTP ${response.status})`);

        const template = document.createElement('template');
        template.innerHTML = await response.text();
        target.appendChild(template.content.cloneNode(true));
    }
}
