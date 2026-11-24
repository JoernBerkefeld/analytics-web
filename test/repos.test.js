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
    {
        key: 'sf-plugin-data',
        label: 'sf-plugin-data',
        owner: 'JoernBerkefeld',
        repo: 'sf-plugin-data',
        npmPackage: 'sf-plugin-data',
        vsceId: null,
        openVsx: null,
    },
];

const expectedOthers = [
    {
        key: 'salesforce-data360-rules',
        label: 'salesforce-data360-rules',
        owner: 'JoernBerkefeld',
        repo: 'salesforce-data360-rules',
        npmPackage: 'salesforce-data360-rules',
        vsceId: null,
        openVsx: null,
    },
    {
        key: 'waba-devtools',
        label: 'waba-devtools',
        owner: 'JoernBerkefeld',
        repo: 'waba-devtools',
        npmPackage: 'waba-devtools',
        vsceId: null,
        openVsx: null,
    },
    {
        key: 'vscode-waba-devtools',
        label: 'vscode-waba-devtools',
        owner: 'JoernBerkefeld',
        repo: 'vscode-waba-devtools',
        npmPackage: null,
        vsceId: 'joernberkefeld.waba-devtools',
        openVsx: { namespace: 'joernberkefeld', name: 'waba-devtools' },
    },
    {
        key: 'waba-template-manager',
        label: 'waba-template-manager',
        owner: 'JoernBerkefeld',
        repo: 'waba-template-manager',
        npmPackage: null,
        vsceId: null,
        openVsx: null,
        category: 'app',
    },
    {
        key: 'vscode-sf-cli-plus',
        label: 'vscode-sf-cli-plus',
        owner: 'JoernBerkefeld',
        repo: 'vscode-sf-cli-plus',
        npmPackage: null,
        vsceId: 'joernberkefeld.sf-cli-plus',
        openVsx: { namespace: 'joernberkefeld', name: 'sf-cli-plus' },
    },
];

test('tracks the Data 360 rules package, the WABA tools and the SF CLI Plus extension', () => {
    for (const expected of expectedOthers) {
        const entry = REPOS.find((repo) => repo.key === expected.key);
        assert.deepEqual(entry, expected);
    }
});

test('has unique keys', () => {
    const keys = REPOS.map((repo) => repo.key);
    assert.equal(new Set(keys).size, keys.length);
});

test('tracks Salesforce CLI plugins through GitHub and npm', () => {
    for (const expectedPlugin of expectedPlugins) {
        const plugin = REPOS.find((repo) => repo.key === expectedPlugin.key);
        assert.deepEqual(plugin, expectedPlugin);
    }
});
