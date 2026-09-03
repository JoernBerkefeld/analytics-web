import { useState } from 'react';
import { REPOS } from '../data/repos.js';

function fmt(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString('en-US');
}

// ─── npm packages summary table ──────────────────────────────────────────────

const NPM_COLS = [
    { key: 'label', label: 'Package', align: 'left' },
    { key: 'stars', label: '⭐', align: 'right' },
    { key: 'views14d', label: 'Views 14d', align: 'right' },
    { key: 'clones14d', label: 'Clones 14d', align: 'right' },
    { key: 'dlWeek', label: 'DL/wk', align: 'right' },
    { key: 'dlMonth', label: 'DL/mo', align: 'right' },
];

function extractNpmRow(entry) {
    const gh = entry.result?.github;
    const npm = entry.result?.npm;
    return {
        key: entry.key,
        label: entry.label,
        stars: gh?.stars ?? null,
        views14d: gh?.traffic?.views?.totalCount ?? null,
        clones14d: gh?.traffic?.clones?.totalCount ?? null,
        dlWeek: npm?.downloads?.lastWeek ?? null,
        dlMonth: npm?.downloads?.lastMonth ?? null,
    };
}

// ─── VS Code extensions summary table ────────────────────────────────────────

const VSCE_COLS = [
    { key: 'label', label: 'Extension', align: 'left' },
    { key: 'stars', label: '⭐', align: 'right' },
    { key: 'marketplaceInstalls', label: 'Marketplace', align: 'right' },
    { key: 'openVsxDl', label: 'Open VSX', align: 'right' },
    { key: 'latestVersion', label: 'Version', align: 'right' },
];

function extractVsceRow(entry) {
    const gh = entry.result?.github;
    const mkt = entry.result?.marketplace;
    const ovsx = entry.result?.openVsxData;
    return {
        key: entry.key,
        label: entry.label,
        stars: gh?.stars ?? null,
        marketplaceInstalls: mkt?.installCount ?? null,
        openVsxDl: ovsx?.downloadCount ?? null,
        latestVersion: mkt?.latestVersion || ovsx?.version || null,
        _sortInstalls: mkt?.installCount ?? ovsx?.downloadCount ?? null,
    };
}

// ─── Apps & sites summary table (GitHub-only entries, category: 'app') ───────

const APP_COLS = [
    { key: 'label', label: 'Project', align: 'left' },
    { key: 'stars', label: '⭐', align: 'right' },
    { key: 'views14d', label: 'Views 14d', align: 'right' },
    { key: 'clones14d', label: 'Clones 14d', align: 'right' },
    { key: 'openIssues', label: 'Issues', align: 'right' },
];

function extractAppRow(entry) {
    const gh = entry.result?.github;
    return {
        key: entry.key,
        label: entry.label,
        stars: gh?.stars ?? null,
        views14d: gh?.traffic?.views?.totalCount ?? null,
        clones14d: gh?.traffic?.clones?.totalCount ?? null,
        openIssues: gh?.openIssues ?? null,
    };
}

// ─── generic sortable table ───────────────────────────────────────────────────

function SortableTable({ title, cols, rows, defaultSort, defaultDir = 'desc', badge }) {
    const [sortKey, setSortKey] = useState(defaultSort);
    const [sortDir, setSortDir] = useState(defaultDir);

    function handleSort(key) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    const sorted = [...rows].sort((a, b) => {
        // use _sortInstalls override when sorting by marketplaceInstalls
        const aKey = sortKey === 'marketplaceInstalls' ? '_sortInstalls' : sortKey;
        const bKey = sortKey === 'marketplaceInstalls' ? '_sortInstalls' : sortKey;
        const av = a[aKey];
        const bv = b[bKey];
        if (sortKey === 'label' || sortKey === 'latestVersion') {
            const as = String(av ?? '');
            const bs = String(bv ?? '');
            return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
        }
        const an = av ?? -1;
        const bn = bv ?? -1;
        return sortDir === 'asc' ? an - bn : bn - an;
    });

    if (sorted.length === 0) return null;

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
            <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {title}
                </h2>
                {badge && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                        {badge}
                    </span>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-800">
                            {cols.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={`px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-white whitespace-nowrap ${
                                        col.align === 'right' ? 'text-right' : 'text-left'
                                    } ${sortKey === col.key ? 'text-blue-400' : ''}`}
                                >
                                    {col.label}
                                    {sortKey === col.key && (
                                        <span className="ml-1">
                                            {sortDir === 'desc' ? '↓' : '↑'}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, i) => (
                            <tr
                                key={row.label}
                                className={`border-b border-gray-800/50 hover:bg-gray-800/40 ${
                                    i % 2 === 0 ? '' : 'bg-gray-900/60'
                                }`}
                            >
                                {cols.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-3 py-2 font-mono text-gray-300 whitespace-nowrap ${
                                            col.align === 'right' ? 'text-right' : 'text-left font-sans font-medium text-gray-200'
                                        }`}
                                    >
                                        {col.key === 'label' ? (
                                            <a
                                                href={`#card-${row.key}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    document
                                                        .getElementById(`card-${row.key}`)
                                                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }}
                                                className="hover:text-blue-400 cursor-pointer"
                                            >
                                                {row[col.key]}
                                            </a>
                                        ) : col.key === 'latestVersion' && row[col.key] ? (
                                            `v${row[col.key]}`
                                        ) : (
                                            fmt(row[col.key])
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── public export ────────────────────────────────────────────────────────────

export default function SummaryTable({ entries }) {
    const done = entries.filter((e) => e.result?.status === 'done');

    const npmEntries = done.filter((e) => e.npmPackage && !e.vsceId && e.category !== 'app');
    const vsceEntries = done.filter((e) => e.vsceId);
    const appEntries = done.filter((e) => e.category === 'app');

    const npmRows = npmEntries.map(extractNpmRow);
    const vsceRows = vsceEntries.map(extractVsceRow);
    const appRows = appEntries.map(extractAppRow);

    return (
        <>
            <SortableTable
                title="npm Packages"
                cols={NPM_COLS}
                rows={npmRows}
                defaultSort="dlWeek"
            />
            <SortableTable
                title="VS Code Extensions"
                cols={VSCE_COLS}
                rows={vsceRows}
                defaultSort="marketplaceInstalls"
            />
            <SortableTable
                title="Apps & Sites"
                cols={APP_COLS}
                rows={appRows}
                defaultSort="views14d"
            />
        </>
    );
}
