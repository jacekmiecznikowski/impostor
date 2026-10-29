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

    // A Supabase publishable/anon key is PUBLIC by design; never ship service_role.
    getSupabaseConfig() {
        const data = window.PARTYJNIAK_CONTENT_SUPABASE;
        if (!data || typeof data !== 'object') return null;
        const url = String(data.url || '').replace(/\\/+$/, '');
        const key = String(data.publishableKey || '');
        if (!/^https:\\/\\/[a-z0-9-]+\\.supabase\\.co$/i.test(url) || !key || key.length > 1500)
            return null;
        return { url, key };
    }

    async fetchSupabaseDocument(gameId, locale, timeoutMs) {
        const config = this.getSupabaseConfig();
        if (!config) return null;
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
        try {
            const response = await fetch(config.url + '/rest/v1/rpc/party_get_published', {
                method:'POST', cache:'no-store', signal:controller?.signal,
                headers:{
                    'Content-Type':'application/json',
                    'Accept':'application/json',
                    apikey:config.key,
                    Authorization:'Bearer ' + config.key
                },
                body:JSON.stringify({p_game:gameId,p_locale:locale})
            });
            if (!response.ok) throw new Error('Content API HTTP '+response.status);
            return await response.json();
        } finally { if (timer) clearTimeout(timer); }
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
        if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Nieprawidłowy format treści.');
        if (source.schemaVersion !== CONTENT_SCHEMA_VERSION || source.game !== gameId || source.locale !== locale)
            throw new Error('Niezgodna gra, język lub wersja treści.');
        const types = {
            'impostor':'words','ticking-bomb':'words','co-mam-na-mysli':'words',
            'naokolo':'cards','synchronizacja':'scales','trzy-w-piec':'prompts'
        };
        if (gameId === 'dzika-karta') {
            const check = (list,min,max,length) => {
                if (!Array.isArray(list) || list.length < min || list.length > max) throw new Error('Nieprawidłowa liczba kart Dzikiej Karty.');
                return list.map(value => {
                    if (typeof value !== 'string' || !value.trim() || value.length > length) throw new Error('Nieprawidłowa karta Dzikiej Karty.');
                    return value.trim();
                });
            };
            return {
                schemaVersion: 1,game:gameId,locale,
                prompts:check(source.prompts,3,1000,180),
                answers:check(source.answers,10,3000,120)
            };
        }
        const key = types[gameId];
        if (!key || !Array.isArray(source.categories) || source.categories.length < 1 || source.categories.length > 100)
            throw new Error('Nieprawidłowe kategorie gry.');
        const ids = new Set(), entryIds = new Set();
        const categories = source.categories.map(category => {
            const id = String(category?.id||'');
            const name = String(category?.name||'').trim();
            const desc = String(category?.desc||'').trim();
            const icon = String(category?.icon||'fa-layer-group').trim();
            if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id)||ids.has(id)) throw new Error('Nieprawidłowe ID kategorii.');
            if (!name || name.length>60 || desc.length>160 || !/^fa-[a-z0-9-]+$/.test(icon))
                throw new Error('Nieprawidłowe metadane kategorii.');
            if (!Array.isArray(category[key]) || category[key].length<1 || category[key].length>500)
                throw new Error('Nieprawidłowa liczba pozycji w kategorii.');
            ids.add(id);
            const entries=category[key].map(entry => {
                if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Nieprawidłowa pozycja.');
                const text = (field,max=80) => {
                    const value=String(entry[field]||'').trim();
                    if (!value || value.length>max) throw new Error('Nieprawidłowe pole '+field);
                    return value;
                };
                if (gameId==='naokolo') {
                    const forbidden=entry.forbidden;
                    if (!Array.isArray(forbidden)||forbidden.length<3||forbidden.length>6) throw new Error('Naokoło wymaga 3–6 słów zakazanych.');
                    const words=forbidden.map(w=>String(w).trim());
                    if (words.some(w=>!w||w.length>50)||new Set(words.map(w=>w.toLocaleLowerCase('pl'))).size!==words.length) throw new Error('Nieprawidłowe zakazane słowa.');
                    return {word:text('word'),forbidden:words};
                }
                if (gameId==='synchronizacja' || gameId==='trzy-w-piec') {
                    const entryId=String(entry.id||'').trim();
                    if(!/^[a-z0-9][a-z0-9_-]{0,59}$/.test(entryId)||entryIds.has(entryId))throw new Error('Nieprawidłowe ID wpisu.');
                    entryIds.add(entryId);
                    if(gameId==='synchronizacja'){
                        const left=text('left'),right=text('right');
                        if(left===right)throw new Error('Bieguny skali muszą się różnić.');
                        return {id:entryId,left,right};
                    }
                    return {id:entryId,text:text('text',180)};
                }
                const hint=String(entry.hint||'').trim();
                if(hint.length>80)throw new Error('Za długa podpowiedź.');
                return {word:text('word'),...(gameId==='co-mam-na-mysli'?{}:{hint})};
            });
            return {id,name,desc,icon,[key]:entries};
        });
        const discussionTips=Array.isArray(source.discussionTips)
            ?source.discussionTips.filter(s=>typeof s==='string').map(s=>s.trim()).filter(Boolean).slice(0,100).map(s=>s.slice(0,160))
            :[];
        return {schemaVersion:1,game:gameId,locale,categories,discussionTips};
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
        const supabase = this.getSupabaseConfig();
        if (!base && !supabase) return null;
        const cacheKey = `${gameId}:${locale}`;
        if (!force && this.memoryCache.has(cacheKey)) return this.memoryCache.get(cacheKey);

        try {
            const payload = supabase
                ? await this.fetchSupabaseDocument(gameId,locale,timeoutMs)
                : await this.fetchJson(`${base}/${encodeURIComponent(gameId)}.${encodeURIComponent(locale)}.json`, timeoutMs);
            if (!payload) throw new Error('Brak opublikowanych treści.');
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
