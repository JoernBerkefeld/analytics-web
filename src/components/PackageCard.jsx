function fmt(n) {
    if (n == null || n === '') return '—';
    return Number(n).toLocaleString('en-US');
}

function Badge({ children, color = 'gray' }) {
    const colors = {
        blue: 'bg-blue-900/40 text-blue-300 border-blue-800',
        green: 'bg-green-900/40 text-green-300 border-green-800',
        purple: 'bg-purple-900/40 text-purple-300 border-purple-800',
        orange: 'bg-orange-900/40 text-orange-300 border-orange-800',
        gray: 'bg-gray-800 text-gray-400 border-gray-700',
    };
    return (
        <span
            className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${colors[color]}`}
        >
            {children}
        </span>
    );
}

function StatRow({ label, value, sub }) {
    return (
        <div className="flex justify-between items-baseline py-0.5">
            <span className="text-gray-500 text-xs">{label}</span>
            <span className="text-gray-200 text-sm font-mono">
                {value}
                {sub && <span className="text-gray-500 text-xs ml-1">{sub}</span>}
            </span>
        </div>
    );
}

function Section({ title, color, children }) {
    const bar = {
        blue: 'bg-blue-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
        teal: 'bg-teal-500',
    };
    return (
        <div className="mt-3">
            <div className={`h-px ${bar[color] ?? 'bg-gray-700'} mb-2 opacity-40`} />
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 text-${color}-400`}>
                {title}
            </p>
            {children}
        </div>
    );
}

export default function PackageCard({ entry }) {
    const { label, owner, repo, npmPackage, vsceId, openVsx, result } = entry;
    const { status, github, npm, marketplace, openVsxData } = result ?? {};

    const isLoading = status === 'loading' || status === 'pending';
    const isError = status === 'error';

    const ghUrl = owner && repo ? `https://github.com/${owner}/${repo}` : null;
    const npmUrl = npmPackage ? `https://www.npmjs.com/package/${npmPackage}` : null;
    const vsceUrl = vsceId
        ? `https://marketplace.visualstudio.com/items?itemName=${vsceId}`
        : null;
    const ovsxUrl = openVsx
        ? `https://open-vsx.org/extension/${openVsx.namespace}/${openVsx.name}`
        : null;

    return (
        <div
            className={`bg-gray-900 rounded-xl border p-4 transition-opacity ${
                isLoading ? 'opacity-60' : 'opacity-100'
            } ${isError ? 'border-red-900' : 'border-gray-800'}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{label}</h3>
                    {github?.description && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                            {github.description}
                        </p>
                    )}
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                    {ghUrl && (
                        <a href={ghUrl} target="_blank" rel="noopener noreferrer">
                            <Badge color="gray">GH</Badge>
                        </a>
                    )}
                    {npmUrl && (
                        <a href={npmUrl} target="_blank" rel="noopener noreferrer">
                            <Badge color="orange">npm</Badge>
                        </a>
                    )}
                    {vsceUrl && (
                        <a href={vsceUrl} target="_blank" rel="noopener noreferrer">
                            <Badge color="blue">VSX</Badge>
                        </a>
                    )}
                    {ovsxUrl && (
                        <a href={ovsxUrl} target="_blank" rel="noopener noreferrer">
                            <Badge color="teal">OVSX</Badge>
                        </a>
                    )}
                    {ovsxUrl && (
                        <a href={ovsxUrl} target="_blank" rel="noopener noreferrer">
                            <Badge color="teal">OVSX</Badge>
                        </a>
                    )}
                </div>
            </div>

            {isLoading && (
                <p className="text-gray-600 text-xs mt-3 animate-pulse">Loading…</p>
            )}

            {isError && (
                <p className="text-red-500 text-xs mt-3">Failed to load data</p>
            )}

            {status === 'done' && (
                <>
                    {/* GitHub */}
                    {github && (
                        <Section title="GitHub" color="blue">
                            <div className="grid grid-cols-2 gap-x-4">
                                <StatRow label="⭐ Stars" value={fmt(github.stars)} />
                                <StatRow label="🍴 Forks" value={fmt(github.forks)} />
                                <StatRow label="👁 Watchers" value={fmt(github.watchers)} />
                                <StatRow label="🐛 Issues" value={fmt(github.openIssues)} />
                            </div>
                            {github.traffic?.views && (
                                <div className="mt-1">
                                    <StatRow
                                        label="Views (14d)"
                                        value={fmt(github.traffic.views.totalCount)}
                                        sub={`/ ${fmt(github.traffic.views.totalUniques)} uniq`}
                                    />
                                    {github.traffic.clones && (
                                        <StatRow
                                            label="Clones (14d)"
                                            value={fmt(github.traffic.clones.totalCount)}
                                            sub={`/ ${fmt(github.traffic.clones.totalUniques)} uniq`}
                                        />
                                    )}
                                </div>
                            )}
                            {github.trafficError && (
                                <p className="text-gray-600 text-xs mt-1">
                                    Traffic: {github.trafficError}
                                </p>
                            )}
                        </Section>
                    )}

                    {/* npm */}
                    {npm && (
                        <Section title="npm" color="red">
                            {npm.latest && (
                                <StatRow label="Latest" value={`v${npm.latest}`} />
                            )}
                            {npm.downloads ? (
                                <>
                                    <StatRow
                                        label="DL / week"
                                        value={fmt(npm.downloads.lastWeek)}
                                    />
                                    <StatRow
                                        label="DL / month"
                                        value={fmt(npm.downloads.lastMonth)}
                                    />
                                    <StatRow
                                        label="DL / year"
                                        value={fmt(npm.downloads.lastYear)}
                                    />
                                </>
                            ) : (
                                <p className="text-gray-600 text-xs">No download data</p>
                            )}
                        </Section>
                    )}

                    {/* VS Code Marketplace */}
                    {vsceId && (
                        <Section title="VS Marketplace" color="purple">
                            {marketplace ? (
                                <>
                                    <StatRow
                                        label="Installs"
                                        value={fmt(marketplace.installCount)}
                                    />
                                    {marketplace.latestVersion && (
                                        <StatRow
                                            label="Version"
                                            value={`v${marketplace.latestVersion}`}
                                        />
                                    )}
                                    {marketplace.ratingCount > 0 && (
                                        <StatRow
                                            label="Rating"
                                            value={`${marketplace.weightedRating.toFixed(1)} ★`}
                                            sub={`(${marketplace.ratingCount})`}
                                        />
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-600 text-xs">Unavailable</p>
                            )}
                        </Section>
                    )}

                    {/* Open VSX */}
                    {openVsx && (
                        <Section title="Open VSX" color="teal">
                            {openVsxData ? (
                                <>
                                    <StatRow
                                        label="Downloads"
                                        value={fmt(openVsxData.downloadCount)}
                                    />
                                    {openVsxData.version && (
                                        <StatRow
                                            label="Version"
                                            value={`v${openVsxData.version}`}
                                        />
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-600 text-xs">Unavailable</p>
                            )}
                        </Section>
                    )}
                </>
            )}
        </div>
    );
}
