/**
 * VS Code Marketplace gallery API + Open VSX client (browser-compatible).
 */

/**
 * Fetches extension stats from the VS Code Marketplace.
 * Flags: 0x1 (IncludeVersions) | 0x200 (IncludeStatistics).
 *
 * @param {string} extensionId  e.g. "JoernBerkefeld.sfmc-language"
 * @returns {Promise<{installCount: number, latestVersion: string, weightedRating: number} | null>}
 */
export async function fetchMarketplaceStats(extensionId) {
    const body = {
        filters: [
            {
                criteria: [
                    { filterType: 7, value: extensionId },
                ],
                pageNumber: 1,
                pageSize: 1,
            },
        ],
        flags: 0x1 | 0x200, // IncludeVersions | IncludeStatistics
    };

    const res = await fetch(
        'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json;api-version=3.0-preview.1',
            },
            body: JSON.stringify(body),
        }
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

    return {
        installCount: Math.round(stats.install ?? 0),
        updateCount: Math.round(stats.updateCount ?? 0),
        weightedRating: stats.weightedRating ?? 0,
        ratingCount: Math.round(stats.ratingcount ?? 0),
        latestVersion: ext.versions?.[0]?.version ?? '',
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
