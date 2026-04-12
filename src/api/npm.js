/**
 * npm registry / downloads API client (browser-compatible).
 */

async function npmFetch(url) {
    let res = await fetch(url, { headers: { Accept: 'application/json' } });

    if (res.status === 429) {
        const retryAfterMs = Number(res.headers.get('retry-after') || '2') * 1000;
        await new Promise((r) => setTimeout(r, retryAfterMs));
        res = await fetch(url, { headers: { Accept: 'application/json' } });
    }

    if (!res.ok) {
        throw new Error(`npm API ${res.status}: ${url}`);
    }
    return res.json();
}

async function fetchDownloadCount(pkg, period) {
    const encoded = encodeURIComponent(pkg);
    const data = await npmFetch(`https://api.npmjs.org/downloads/point/${period}/${encoded}`);
    return data.downloads ?? 0;
}

async function fetchPerVersionDownloads(pkg) {
    const encoded = encodeURIComponent(pkg);
    const data = await npmFetch(`https://api.npmjs.org/versions/${encoded}/last-week`);
    const raw = data.downloads ?? data;
    if (typeof raw !== 'object' || raw === null) {
        return {};
    }
    return Object.fromEntries(
        Object.entries(raw)
            .filter(([, v]) => typeof v === 'number')
            .sort(([, a], [, b]) => b - a)
    );
}

async function fetchRegistryMeta(pkg) {
    const encoded = encodeURIComponent(pkg).replace('%40', '@');
    const data = await npmFetch(`https://registry.npmjs.org/${encoded}`);
    const latest = data['dist-tags']?.latest ?? '';
    const versions = Object.keys(data.versions ?? {}).reverse();
    return { latest, versions };
}

/**
 * Collects all npm stats for a single package.
 *
 * @param {string} packageName
 * @returns {Promise<object>}
 */
export async function fetchNpmStats(packageName) {
    const results = await Promise.allSettled([
        fetchDownloadCount(packageName, 'last-week'),
        fetchDownloadCount(packageName, 'last-month'),
        fetchDownloadCount(packageName, 'last-year'),
        fetchPerVersionDownloads(packageName),
        fetchRegistryMeta(packageName),
    ]);

    const errors = [];
    function unwrap(result, fallback = null) {
        if (result.status === 'fulfilled') return result.value;
        errors.push(result.reason.message);
        return fallback;
    }

    const [lastWeek, lastMonth, lastYear, perVersion, registry] = results.map((r, i) =>
        unwrap(r, i < 3 ? null : i === 3 ? {} : { latest: '', versions: [] })
    );

    const downloadsAvailable = lastWeek !== null || lastMonth !== null || lastYear !== null;

    return {
        downloads: downloadsAvailable
            ? { lastWeek: lastWeek ?? 0, lastMonth: lastMonth ?? 0, lastYear: lastYear ?? 0 }
            : null,
        perVersion,
        latest: registry?.latest ?? '',
        versions: registry?.versions ?? [],
        errors: errors.length ? errors : null,
    };
}
