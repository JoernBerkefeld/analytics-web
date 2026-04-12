import { useState } from 'react';

function fmt(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString('en-US');
}

const COLS = [
    { key: 'label', label: 'Package', align: 'left' },
    { key: 'stars', label: '⭐', align: 'right' },
    { key: 'views14d', label: 'Views 14d', align: 'right' },
    { key: 'clones14d', label: 'Clones 14d', align: 'right' },
    { key: 'dlWeek', label: 'DL/wk', align: 'right' },
    { key: 'dlMonth', label: 'DL/mo', align: 'right' },
    { key: 'installs', label: '⬇ Installs', align: 'right' },
];

function extractRow(entry) {
    const { label, result } = entry;
    const gh = result?.github;
    const npm = result?.npm;
    const mkt = result?.marketplace;
    const ovsx = result?.openVsxData;

    return {
        label,
        stars: gh?.stars ?? null,
        views14d: gh?.traffic?.views?.totalCount ?? null,
        clones14d: gh?.traffic?.clones?.totalCount ?? null,
        dlWeek: npm?.downloads?.lastWeek ?? null,
        dlMonth: npm?.downloads?.lastMonth ?? null,
        installs:
            mkt?.installCount != null
                ? mkt.installCount
                : ovsx?.downloadCount != null
                  ? ovsx.downloadCount
                  : null,
    };
}

export default function SummaryTable({ entries }) {
    const [sortKey, setSortKey] = useState('stars');
    const [sortDir, setSortDir] = useState('desc');

    function handleSort(key) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    const rows = entries
        .filter((e) => e.result?.status === 'done')
        .map(extractRow)
        .sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (sortKey === 'label') {
                return sortDir === 'asc'
                    ? a.label.localeCompare(b.label)
                    : b.label.localeCompare(a.label);
            }
            const an = av ?? -1;
            const bn = bv ?? -1;
            return sortDir === 'asc' ? an - bn : bn - an;
        });

    if (rows.length === 0) return null;

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-800">
                            {COLS.map((col) => (
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
                        {rows.map((row, i) => (
                            <tr
                                key={row.label}
                                className={`border-b border-gray-800/50 hover:bg-gray-800/40 ${
                                    i % 2 === 0 ? '' : 'bg-gray-900/60'
                                }`}
                            >
                                <td className="px-3 py-2 font-medium text-gray-200 whitespace-nowrap">
                                    {row.label}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-300 font-mono">
                                    {fmt(row.stars)}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-300 font-mono">
                                    {fmt(row.views14d)}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-300 font-mono">
                                    {fmt(row.clones14d)}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-300 font-mono">
                                    {fmt(row.dlWeek)}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-300 font-mono">
                                    {fmt(row.dlMonth)}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-300 font-mono">
                                    {fmt(row.installs)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
