import assert from 'node:assert/strict';
import test from 'node:test';
import { metricsUrl, ratingUrl, readRating, sumInstalls } from '../src/api/chromestore.js';
import { REPOS } from '../src/data/repos.js';

// made-up IDs: real ones never belong in this repository
const PUBLISHER = 'publisher-0000';
const ITEM = 'abcdefghijklmnopabcdefghijklmnop';

test('metricsUrl asks for the installs of one item from the first date on', () => {
    const url = new URL(metricsUrl(PUBLISHER, ITEM));
    assert.equal(url.origin, 'https://chromewebstore.googleapis.com');
    assert.equal(url.pathname, `/v2/publishers/${PUBLISHER}/items/${ITEM}:queryMetrics`);
    assert.deepEqual(url.searchParams.getAll('metrics'), ['installs']);
    assert.equal(url.searchParams.get('timeSpec.firstDate.year'), '2026');
    assert.equal(url.searchParams.get('pageSize'), '1000');
    assert.equal(url.searchParams.has('pageToken'), false);
});

test('metricsUrl passes the token of the next page', () => {
    const url = new URL(metricsUrl(PUBLISHER, ITEM, 'next/page=1'));
    assert.equal(url.searchParams.get('pageToken'), 'next/page=1');
});

test('ratingUrl names the rating summary of the item', () => {
    assert.equal(
        ratingUrl(PUBLISHER, ITEM),
        `https://chromewebstore.googleapis.com/v2/publishers/${PUBLISHER}/items/${ITEM}/ratingSummary`
    );
});

test('sumInstalls adds the daily counts and ignores other metrics', () => {
    const rows = [
        { metricValues: [{ metric: 'installs', value: '3' }] },
        {
            metricValues: [
                { metric: 'installs', value: '12' },
                { metric: 'uninstalls', value: '100' },
            ],
        },
        { metricValues: [] },
        {},
    ];
    assert.equal(sumInstalls(rows), 15);
    assert.equal(sumInstalls(), 0);
});

test('readRating turns the answer into numbers, also when there are no ratings', () => {
    assert.deepEqual(readRating({ rating: 4.5, ratingCount: '12' }), { rating: 4.5, ratingCount: 12 });
    assert.deepEqual(readRating({}), { rating: 0, ratingCount: 0 });
});

test('the Chrome extension is tracked with its store item', () => {
    const entry = REPOS.find((r) => r.key === 'chrome-sfmc-ux-tools');
    assert.equal(entry.repo, 'chrome-sfmc-ux-tools');
    assert.equal(entry.category, 'app');
    assert.match(entry.chromeStoreId, /^[a-p]{32}$/);
});
