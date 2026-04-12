/**
 * npm registry / downloads API client (browser-compatible).
 *
 * Throttling strategy:
 *   - Download totals: use the batch endpoint (all packages in one request per period)
 *   - Per-version + registry: throttled via a semaphore (max 3 concurrent requests)
 */

// ─── semaphore ────────────────────────────────────────────────────────────────

const MAX_CONCURRENT = 3;
let _active = 0;
const _queue = [];

async function withRateLimit(fn) {
    if (_active >= MAX_CONCURRENT) {
        await new Promise((resolve) => _queue.push(resolve));
    }
    _active++;
    try {
        return await fn();
    } finally {
        _active--;
        if (_queue.length > 0) {
            _queue.shift()();
        }
    }
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function npmFetch(url) {
    const doFetch = () => fetch(url, { headers: { Accept: 'application/json' } });
    let res = await doFetch();

    if (res.status === 429) {
        const retryAfterMs = Number(res.headers.get('retry-after') || '5') * 1000;
        await new Promise((r) => setTimeout(r, retryAfterMs));
        res = await doFetch();
    }

    if (!res.ok) throw new Error(`npm API ${res.status}: ${url}`);
    return res.json();
}

// ─── batch download counts ────────────────────────────────────────────────────

/**
 * Fetches download counts for multiple packages in a single API call.
 * The npm downloads API accepts up to 128 comma-separated package names.
 *
 * @param {string[]} packages
 * @param {'last-day'|'last-week'|'last-month'|'last-year'} period
 * @returns {Promise<Record<string, number>>}  packageName → download count
 */
export async function fetchBatchDownloads(packages, period) {
    if (packages.length === 0) return {};

    const encoded = packages.map(encodeURIComponent).join(',');
    const data = await withRateLimit(() =>
        npmFetch(`https://api.npmjs.org/downloads/point/${period}/${encoded}`)
    );

    if (packages.length === 1) {
        // Single-package response shape: { downloads: N, package: "name", ... }
        return { [packages[0]]: data.downloads ?? 0 };
    }
    // Multi-package response shape: { "pkg1": { downloads: N }, "pkg2": { ... }, ... }
    return Object.fromEntries(packages.map((pkg) => [pkg, data[pkg]?.downloads ?? 0]));
}

// ─── per-package helpers (throttled) ─────────────────────────────────────────

async function fetchPerVersionDownloads(pkg) {
    const encoded = encodeURIComponent(pkg);
    const data = await withRateLimit(() =>
        npmFetch(`https://api.npmjs.org/versions/${encoded}/last-week`)
    );
    const raw = data.downloads ?? data;
    if (typeof raw !== 'object' || raw === null) return {};
    return Object.fromEntries(
        Object.entries(raw)
            .filter(([, v]) => typeof v === 'number')
            .sort(([, a], [, b]) => b - a)
    );
}

async function fetchRegistryMeta(pkg) {
    const encoded = encodeURIComponent(pkg).replace('%40', '@');
    const data = await withRateLimit(() => npmFetch(`https://registry.npmjs.org/${encoded}`));
    const latest = data['dist-tags']?.latest ?? '';
    const versions = Object.keys(data.versions ?? {}).reverse();
    return { latest, versions };
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Collects per-package npm stats (per-version breakdown + registry metadata).
 * Pass pre-fetched download totals from fetchBatchDownloads to avoid redundant
 * per-package download requests.
 *
 * @param {string} packageName
 * @param {{ lastWeek: number, lastMonth: number, lastYear: number } | null} preloadedDownloads
 * @returns {Promise<object>}
 */
export async function fetchNpmStats(packageName, preloadedDownloads = null) {
    const [perVersionResult, registryResult] = await Promise.allSettled([
        fetchPerVersionDownloads(packageName),
        fetchRegistryMeta(packageName),
    ]);

    const errors = [];
    function unwrap(result, fallback) {
        if (result.status === 'fulfilled') return result.value;
        errors.push(result.reason.message);
        return fallback;
    }

    const perVersion = unwrap(perVersionResult, {});
    const registry = unwrap(registryResult, { latest: '', versions: [] });

    return {
        downloads: preloadedDownloads,
        perVersion,
        latest: registry?.latest ?? '',
        versions: registry?.versions ?? [],
        errors: errors.length ? errors : null,
    };
}
