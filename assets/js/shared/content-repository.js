const CONTENT_REMOTE_STORAGE_KEY = 'partyjniak.content.remoteBase.v1';
const CONTENT_CACHE_STORAGE_KEY = 'partyjniak.content.cache.v1';

class ContentRepository {
    constructor() {
        this.memoryCache = new Map();
    }

    getRemoteBaseUrl() {
        if (typeof window.PARTYJNIAK_CONTENT_API === 'string' && window.PARTYJNIAK_CONTENT_API.trim()) {
            return window.PARTYJNIAK_CONTENT_API.trim().replace(/\/+$/, '');
        }
        try {
            return (localStorage.getItem(CONTENT_REMOTE_STORAGE_KEY) || '').replace(/\/+$/, '');
        } catch (_) {
            return '';
        }
    }

    setRemoteBaseUrl(url) {
        const normalized = String(url || '').trim().replace(/\/+$/, '');
        try {
            if (normalized) localStorage.setItem(CONTENT_REMOTE_STORAGE_KEY, normalized);
            else localStorage.removeItem(CONTENT_REMOTE_STORAGE_KEY);
        } catch (_) {}
        this.memoryCache.clear();
    }

    validate(payload, gameId, locale) {
        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        if (!data || typeof data !== 'object') throw new Error('Nieprawidłowy format treści.');
        if (data.game !== gameId) throw new Error(`Nieprawidłowy typ gry: ${data.game || 'brak'}.`);
        if (data.locale && data.locale !== locale) throw new Error(`Nieprawidłowy język: ${data.locale}.`);
        if (!Array.isArray(data.categories)) throw new Error('Brak listy kategorii.');

        data.categories.forEach(category => {
            if (!category?.id || !category?.name || !Array.isArray(category.words)) throw new Error('Nieprawidłowa kategoria treści.');
            category.words.forEach(entry => {
                if (!entry?.word || typeof entry.word !== 'string') throw new Error('Nieprawidłowe hasło.');
                if (entry.hint != null && typeof entry.hint !== 'string') throw new Error('Nieprawidłowa podpowiedź.');
            });
        });
        return data;
    }

    readCache(cacheKey) {
        try {
            const cache = JSON.parse(localStorage.getItem(CONTENT_CACHE_STORAGE_KEY) || '{}');
            return cache[cacheKey] || null;
        } catch (_) {
            return null;
        }
    }

    writeCache(cacheKey, data) {
        try {
            const cache = JSON.parse(localStorage.getItem(CONTENT_CACHE_STORAGE_KEY) || '{}');
            cache[cacheKey] = data;
            localStorage.setItem(CONTENT_CACHE_STORAGE_KEY, JSON.stringify(cache));
        } catch (_) {}
    }

    async loadRemote(gameId, locale = 'pl', { force = false } = {}) {
        const base = this.getRemoteBaseUrl();
        if (!base) return null;
        const cacheKey = `${gameId}:${locale}`;
        if (!force && this.memoryCache.has(cacheKey)) return this.memoryCache.get(cacheKey);

        try {
            const response = await fetch(`${base}/${encodeURIComponent(gameId)}.${encodeURIComponent(locale)}.json`, {
                cache: 'no-store',
                headers: { Accept: 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = this.validate(await response.json(), gameId, locale);
            this.memoryCache.set(cacheKey, data);
            this.writeCache(cacheKey, data);
            return data;
        } catch (error) {
            console.warn('Zdalna baza Partyjniaka jest niedostępna. Używam lokalnych danych gry.', error);
            const cached = this.readCache(cacheKey);
            if (!cached) return null;
            try {
                const data = this.validate(cached, gameId, locale);
                this.memoryCache.set(cacheKey, data);
                return data;
            } catch (_) {
                return null;
            }
        }
    }
}

const contentRepository = new ContentRepository();
window.PartyjniakContent = {
    repository: contentRepository,
    setRemoteBaseUrl: url => contentRepository.setRemoteBaseUrl(url),
    clearRemoteBaseUrl: () => contentRepository.setRemoteBaseUrl(''),
    refresh: (gameId = 'impostor', locale = 'pl') => contentRepository.loadRemote(gameId, locale, { force: true })
};
