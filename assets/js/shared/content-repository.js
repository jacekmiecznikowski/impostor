const CONTENT_REMOTE_STORAGE_KEY = 'partyjniak.content.remoteBase.v1';
const CONTENT_CACHE_STORAGE_KEY = 'partyjniak.content.cache.v1';
const CONTENT_SCHEMA_VERSION = 1;
const DEFAULT_CONTENT_TIMEOUT_MS = 2500;

class ContentRepository {
    constructor() {
        this.memoryCache = new Map();
    }

    normalizeRemoteBaseUrl(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        try {
            const url = new URL(raw, window.location.origin);
            if (!['http:', 'https:'].includes(url.protocol)) return '';
            return url.href.replace(/\/+$/, '');
        } catch (_) {
            return '';
        }
    }

    getRemoteBaseUrl() {
        if (typeof window.PARTYJNIAK_CONTENT_API === 'string') {
            const configured = this.normalizeRemoteBaseUrl(window.PARTYJNIAK_CONTENT_API);
            if (configured) return configured;
        }
        try {
            return this.normalizeRemoteBaseUrl(localStorage.getItem(CONTENT_REMOTE_STORAGE_KEY));
        } catch (_) {
            return '';
        }
    }

    setRemoteBaseUrl(url) {
        const raw = String(url || '').trim();
        const normalized = this.normalizeRemoteBaseUrl(raw);
        if (raw && !normalized) throw new Error('Adres API treści musi używać HTTP lub HTTPS.');
        try {
            if (normalized) localStorage.setItem(CONTENT_REMOTE_STORAGE_KEY, normalized);
            else localStorage.removeItem(CONTENT_REMOTE_STORAGE_KEY);
        } catch (_) {}
        this.memoryCache.clear();
    }

    validate(payload, gameId, locale) {
        const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        if (!source || typeof source !== 'object') throw new Error('Nieprawidłowy format treści.');
        if ((source.schemaVersion ?? CONTENT_SCHEMA_VERSION) !== CONTENT_SCHEMA_VERSION) throw new Error('Nieobsługiwana wersja schematu treści.');
        if (source.game !== gameId) throw new Error(`Nieprawidłowy typ gry: ${source.game || 'brak'}.`);
        if (source.locale && source.locale !== locale) throw new Error(`Nieprawidłowy język: ${source.locale}.`);
        if (!Array.isArray(source.categories) || source.categories.length < 1 || source.categories.length > 100) {
            throw new Error('Nieprawidłowa lista kategorii.');
        }

        const categoryIds = new Set();
        const categories = source.categories.map(category => {
            const id = String(category?.id || '');
            const name = String(category?.name || '').trim();
            const desc = String(category?.desc || '').trim();
            const icon = String(category?.icon || 'fa-layer-group').trim();

            if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) || categoryIds.has(id)) throw new Error('Nieprawidłowe lub powtórzone ID kategorii.');
            if (!name || name.length > 60) throw new Error('Nieprawidłowa nazwa kategorii.');
            if (desc.length > 160) throw new Error('Opis kategorii jest zbyt długi.');
            if (!/^fa-[a-z0-9-]+$/.test(icon)) throw new Error('Nieprawidłowa ikona kategorii.');
            if (!Array.isArray(category.words) || category.words.length < 1 || category.words.length > 500) {
                throw new Error(`Kategoria ${id} nie zawiera poprawnej listy haseł.`);
            }
            categoryIds.add(id);

            const words = category.words.map(entry => {
                const word = String(entry?.word || '').trim();
                const hint = entry?.hint == null ? '' : String(entry.hint).trim();
                if (!word || word.length > 80) throw new Error('Nieprawidłowe hasło.');
                if (hint.length > 80) throw new Error('Podpowiedź jest zbyt długa.');
                return { word, hint };
            });

            return { id, name, desc, icon, words };
        });

        const discussionTips = Array.isArray(source.discussionTips)
            ? source.discussionTips
                .filter(tip => typeof tip === 'string')
                .map(tip => tip.trim())
                .filter(Boolean)
                .slice(0, 100)
                .map(tip => tip.slice(0, 160))
            : [];

        return {
            schemaVersion: CONTENT_SCHEMA_VERSION,
            game: gameId,
            locale,
            categories,
            discussionTips
        };
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

    async fetchJson(url, timeoutMs) {
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
        try {
            const response = await fetch(url, {
                cache: 'no-store',
                headers: { Accept: 'application/json' },
                signal: controller?.signal
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        } finally {
            if (timeout) clearTimeout(timeout);
        }
    }

    async loadRemote(gameId, locale = 'pl', { force = false, timeoutMs = DEFAULT_CONTENT_TIMEOUT_MS } = {}) {
        const base = this.getRemoteBaseUrl();
        if (!base) return null;
        const cacheKey = `${gameId}:${locale}`;
        if (!force && this.memoryCache.has(cacheKey)) return this.memoryCache.get(cacheKey);

        try {
            const payload = await this.fetchJson(`${base}/${encodeURIComponent(gameId)}.${encodeURIComponent(locale)}.json`, timeoutMs);
            const data = this.validate(payload, gameId, locale);
            this.memoryCache.set(cacheKey, data);
            this.writeCache(cacheKey, data);
            return data;
        } catch (error) {
            console.warn('Zdalna baza Partyjniaka jest niedostępna. Używam cache lub lokalnych danych gry.', error);
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
