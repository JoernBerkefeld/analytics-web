/**
 * VS Code Marketplace gallery API + Open VSX client (browser-compatible).
 *
 * Statistics require an Azure DevOps PAT (Marketplace Read scope).
 * Without a token the API still returns the extension record but omits the
 * statistics array, so install counts will be missing.
 *
 * How to get a token:
 *   https://dev.azure.com → User settings → Personal access tokens
 *   → New Token → Scope: Marketplace (Read)
 */

/**
 * Fetches extension stats from the VS Code Marketplace.
 * Statistics are only returned when a valid Azure DevOps PAT is supplied.
 * Flags: 0x1 (IncludeVersions) | 0x200 (IncludeStatistics).
 *
 * @param {string} extensionId  e.g. "JoernBerkefeld.sfmc-language"
 * @param {string|null} [token]  Azure DevOps PAT with Marketplace Read scope
 * @returns {Promise<{installCount: number|null, latestVersion: string, weightedRating: number}>}
 */
export async function fetchMarketplaceStats(extensionId, token = null) {
    const body = {
        filters: [
            {
                criteria: [{ filterType: 7, value: extensionId }],
                pageNumber: 1,
                pageSize: 1,
            },
        ],
        flags: 0x1 | 0x200, // IncludeVersions | IncludeStatistics
    };

    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json;api-version=3.0-preview.1',
    };
    if (token) {
        // Azure DevOps PAT format: Basic base64(':PAT')
        headers['Authorization'] = `Basic ${btoa(`:${token}`)}`;
    }

    const res = await fetch(
        'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
        { method: 'POST', headers, body: JSON.stringify(body) }
    );

    if (!res.ok) {
        throw new Error(`Marketplace API ${res.status}`);
    }

    const data = await res.json();
    const ext = data.results?.[0]?.extensions?.[0];
    if (!ext) return null;

    const stats = {};
    for (const s of ext.statistics ?? []) {
        stats[s.statisticName] = s.value;
    }

    // installCount is null (not 0) when the statistics array was absent (no auth)
    const installCount =
        Object.keys(stats).length > 0 ? Math.round(stats.install ?? 0) : null;

    return {
        installCount,
        updateCount: Math.round(stats.updateCount ?? 0),
        weightedRating: stats.weightedRating ?? 0,
        ratingCount: Math.round(stats.ratingcount ?? 0),
        latestVersion: ext.versions?.[0]?.version ?? '',
        hasStats: installCount !== null,
    };
}

/**
 * Fetches extension info from Open VSX.
 *
 * @param {string} namespace  e.g. "JoernBerkefeld"
 * @param {string} name       e.g. "sfmc-language"
 * @returns {Promise<{downloadCount: number, version: string} | null>}
 */
export async function fetchOpenVsxStats(namespace, name) {
    const res = await fetch(
        `https://open-vsx.org/api/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
        { headers: { Accept: 'application/json' } }
    );

    if (!res.ok) {
        throw new Error(`Open VSX ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
        throw new Error(data.error);
    }

    return {
        downloadCount: data.downloadCount ?? 0,
        version: data.version ?? '',
    };
}
