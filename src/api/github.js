/**
 * GitHub REST API v3 client (browser-compatible).
 * Traffic endpoints require a token with push access.
 */

const BASE = 'https://api.github.com';

async function ghFetch(path, token) {
    const headers = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, { headers });

    if (!res.ok) {
        const err = new Error(`GitHub API ${res.status}: ${path}`);
        err.status = res.status;
        throw err;
    }

    return res.json();
}

async function fetchRepoInfo(owner, repo, token) {
    const data = await ghFetch(`/repos/${owner}/${repo}`, token);
    return {
        description: data.description ?? '',
        stars: data.stargazers_count,
        forks: data.forks_count,
        watchers: data.watchers_count,
        openIssues: data.open_issues_count,
        pushedAt: data.pushed_at,
        visibility: data.visibility,
    };
}

async function fetchTrafficViews(owner, repo, token) {
    const data = await ghFetch(`/repos/${owner}/${repo}/traffic/views`, token);
    return {
        totalCount: data.count,
        totalUniques: data.uniques,
        daily: data.views.map((v) => ({
            date: v.timestamp.slice(0, 10),
            count: v.count,
            uniques: v.uniques,
        })),
    };
}

async function fetchTrafficClones(owner, repo, token) {
    const data = await ghFetch(`/repos/${owner}/${repo}/traffic/clones`, token);
    return {
        totalCount: data.count,
        totalUniques: data.uniques,
        daily: data.clones.map((c) => ({
            date: c.timestamp.slice(0, 10),
            count: c.count,
            uniques: c.uniques,
        })),
    };
}

async function fetchTopReferrers(owner, repo, token) {
    const data = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/referrers`, token);
    return data.map((r) => ({ referrer: r.referrer, count: r.count, uniques: r.uniques }));
}

/**
 * Validates a token by fetching the authenticated user.
 * Returns { login, name } on success or throws on failure.
 *
 * @param {string} token
 */
export async function validateToken(token) {
    const data = await ghFetch('/user', token);
    return { login: data.login, name: data.name };
}

/**
 * Collects all GitHub stats for a single repo.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function fetchRepoStats(owner, repo, token) {
    const info = await fetchRepoInfo(owner, repo, token);

    const [viewsResult, clonesResult, referrersResult] = await Promise.allSettled([
        fetchTrafficViews(owner, repo, token),
        fetchTrafficClones(owner, repo, token),
        fetchTopReferrers(owner, repo, token),
    ]);

    const views = viewsResult.status === 'fulfilled' ? viewsResult.value : null;
    const clones = clonesResult.status === 'fulfilled' ? clonesResult.value : null;
    const referrers = referrersResult.status === 'fulfilled' ? referrersResult.value : null;
    const trafficError =
        viewsResult.status === 'rejected' ? viewsResult.reason.message : null;

    return {
        ...info,
        traffic: { views, clones, referrers },
        trafficError,
    };
}
