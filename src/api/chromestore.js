/**
 * Chrome Web Store API v2 client (browser).
 *
 * The numbers of a store item are private to its publisher, so every call needs an OAuth
 * access token of the publisher's Google account. The token is requested in the page with
 * Google Identity Services and is kept in memory only.
 */

const API = 'https://chromewebstore.googleapis.com/v2';
const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore.readonly';
/** The API's own upper limit for rows per page. */
const PAGE_SIZE = 1000;
/** The store's metrics are asked for from this day on; no tracked item is older. */
const FIRST_DATE = { year: 2026, month: 1, day: 1 };

function itemPath(publisherId, itemId) {
    return `publishers/${encodeURIComponent(publisherId)}/items/${encodeURIComponent(itemId)}`;
}

/**
 * @param {string} publisherId
 * @param {string} itemId
 * @param {string} [pageToken]
 * @returns {string} address of one page of daily install counts
 */
export function metricsUrl(publisherId, itemId, pageToken) {
    const query = new URLSearchParams({
        'timeSpec.firstDate.year': String(FIRST_DATE.year),
        'timeSpec.firstDate.month': String(FIRST_DATE.month),
        'timeSpec.firstDate.day': String(FIRST_DATE.day),
        metrics: 'installs',
        pageSize: String(PAGE_SIZE),
    });
    if (pageToken) query.set('pageToken', pageToken);
    return `${API}/${itemPath(publisherId, itemId)}:queryMetrics?${query}`;
}

/**
 * @param {string} publisherId
 * @param {string} itemId
 * @returns {string} address of the rating summary
 */
export function ratingUrl(publisherId, itemId) {
    return `${API}/${itemPath(publisherId, itemId)}/ratingSummary`;
}

/**
 * Adds up the daily install counts of metric rows.
 *
 * @param {Array<{metricValues?: Array<{metric: string, value: string}>}>} [rows]
 * @returns {number}
 */
export function sumInstalls(rows = []) {
    let total = 0;
    for (const row of rows) {
        for (const entry of row.metricValues ?? []) {
            if (entry.metric === 'installs') total += Number(entry.value) || 0;
        }
    }
    return total;
}

/**
 * @param {{rating?: number, ratingCount?: string}} [summary] answer of ratingSummary
 * @returns {{rating: number, ratingCount: number}}
 */
export function readRating(summary = {}) {
    return { rating: Number(summary.rating) || 0, ratingCount: Number(summary.ratingCount) || 0 };
}

async function getJson(url, accessToken) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
        throw new Error(`Chrome Web Store API ${res.status}`);
    }
    return res.json();
}

/**
 * @param {string} publisherId
 * @param {string} itemId
 * @param {string} accessToken
 * @returns {Promise<{installs: number, rating: number, ratingCount: number}>}
 */
export async function fetchChromeStoreStats(publisherId, itemId, accessToken) {
    let installs = 0;
    let pageToken;
    do {
        const page = await getJson(metricsUrl(publisherId, itemId, pageToken), accessToken);
        installs += sumInstalls(page.metricRows);
        pageToken = page.nextPageToken;
    } while (pageToken);

    const summary = await getJson(ratingUrl(publisherId, itemId), accessToken);
    return { installs, ...readRating(summary) };
}

let gisLoading;

/**
 * Loads Google Identity Services once. Call it before the user can click "Sign in", so that
 * the click itself only opens Google's window (browsers block windows opened later).
 *
 * @returns {Promise<void>}
 */
export function loadGoogleIdentity() {
    if (!gisLoading) {
        gisLoading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GIS_SCRIPT;
            script.async = true;
            script.addEventListener('load', () => resolve());
            script.addEventListener('error', () => {
                gisLoading = undefined;
                script.remove();
                reject(new Error('Google sign-in could not be loaded'));
            });
            document.head.append(script);
        });
    }
    return gisLoading;
}

/**
 * Opens Google's sign-in window and resolves with a read-only access token.
 * Needs loadGoogleIdentity() to have finished and must be called from a click.
 *
 * @param {string} clientId OAuth client ID of type "Web application"
 * @returns {Promise<string>}
 */
export function requestAccessToken(clientId) {
    return new Promise((resolve, reject) => {
        const oauth2 = globalThis.google?.accounts?.oauth2;
        if (!oauth2) {
            reject(new Error('Google sign-in is not loaded yet'));
            return;
        }
        const client = oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPE,
            callback: (answer) => {
                if (answer.error || !answer.access_token) {
                    reject(new Error(answer.error_description || answer.error || 'No access token'));
                } else {
                    resolve(answer.access_token);
                }
            },
            error_callback: (error) => {
                reject(new Error(error?.message || error?.type || 'Sign-in was not completed'));
            },
        });
        client.requestAccessToken();
    });
}
