import assert from 'node:assert/strict';
import test from 'node:test';
import { REPOS } from '../src/data/repos.js';

const expectedPlugins = [
    {
        key: 'sf-plugin-mcnext',
        label: 'sf-plugin-mcnext',
        owner: 'JoernBerkefeld',
        repo: 'sf-plugin-mcnext',
        npmPackage: 'sf-plugin-mcnext',
        vsceId: null,
        openVsx: null,
    },
    {
        key: 'sf-plugin-cms',
        label: 'sf-plugin-cms',
        owner: 'JoernBerkefeld',
        repo: 'sf-plugin-cms',
        npmPackage: 'sf-plugin-cms',
        vsceId: null,
        openVsx: null,
    },
];

test('tracks Salesforce CLI plugins through GitHub and npm', () => {
    for (const expectedPlugin of expectedPlugins) {
        const plugin = REPOS.find((repo) => repo.key === expectedPlugin.key);
        assert.deepEqual(plugin, expectedPlugin);
    }
});
