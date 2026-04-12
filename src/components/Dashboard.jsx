import { useState, useCallback } from 'react';
import { REPOS } from '../data/repos.js';
import { fetchRepoStats } from '../api/github.js';
import { fetchNpmStats } from '../api/npm.js';
import { fetchMarketplaceStats, fetchOpenVsxStats } from '../api/marketplace.js';
import PackageCard from './PackageCard.jsx';
import SummaryTable from './SummaryTable.jsx';

function buildInitialState() {
    return Object.fromEntries(
        REPOS.map((r) => [r.key, { status: 'pending', github: null, npm: null, marketplace: null, openVsxData: null }])
    );
}

export default function Dashboard({ token, userLogin, onClearToken }) {
    const [results, setResults] = useState(buildInitialState);
    const [fetchedAt, setFetchedAt] = useState(null);
    const [running, setRunning] = useState(false);

    function update(key, patch) {
        setResults((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    }

    const fetchAll = useCallback(async () => {
        if (running) return;
        setRunning(true);
        setResults(buildInitialState());
        setFetchedAt(null);

        const tasks = REPOS.map(async (repo) => {
            update(repo.key, { status: 'loading' });

            let github = null;
            let npm = null;
            let marketplace = null;
            let openVsxData = null;

            // GitHub
            if (repo.owner && repo.repo) {
                try {
                    github = await fetchRepoStats(repo.owner, repo.repo, token);
                } catch {
                    // silently fail — card will show partial data
                }
            }

            // npm
            if (repo.npmPackage) {
                try {
                    npm = await fetchNpmStats(repo.npmPackage);
                } catch {
                    // silently fail
                }
            }

            // VS Code Marketplace
            if (repo.vsceId) {
                try {
                    marketplace = await fetchMarketplaceStats(repo.vsceId);
                } catch {
                    // silently fail — CORS or API issue
                }
            }

            // Open VSX
            if (repo.openVsx) {
                try {
                    openVsxData = await fetchOpenVsxStats(repo.openVsx.namespace, repo.openVsx.name);
                } catch {
                    // silently fail
                }
            }

            update(repo.key, { status: 'done', github, npm, marketplace, openVsxData });
        });

        await Promise.allSettled(tasks);
        setFetchedAt(new Date());
        setRunning(false);
    }, [token, running]);

    // Fetch on first render
    const [hasFetched, setHasFetched] = useState(false);
    if (!hasFetched) {
        setHasFetched(true);
        // trigger async without blocking render
        setTimeout(() => fetchAll(), 0);
    }

    const entries = REPOS.map((r) => ({ ...r, result: results[r.key] }));
    const doneCount = entries.filter((e) => e.result?.status === 'done').length;

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl">📊</span>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold text-white leading-none">
                                SFMC Analytics
                            </h1>
                            {fetchedAt && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {fetchedAt.toLocaleTimeString()}
                                    {userLogin && ` · ${userLogin}`}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {running && (
                            <span className="text-xs text-gray-500 animate-pulse">
                                {doneCount}/{REPOS.length}
                            </span>
                        )}
                        <button
                            onClick={fetchAll}
                            disabled={running}
                            className="bg-blue-700 hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {running ? 'Loading…' : '↺ Refresh'}
                        </button>
                        <button
                            onClick={onClearToken}
                            className="text-gray-600 hover:text-gray-400 text-xs px-2 py-1.5 rounded-lg transition-colors"
                            title="Clear token"
                        >
                            ⚙
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Summary table */}
                <SummaryTable entries={entries} />

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {entries.map((entry) => (
                        <PackageCard key={entry.key} entry={entry} />
                    ))}
                </div>
            </div>
        </div>
    );
}
