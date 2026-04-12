import { useState } from 'react';
import { validateToken } from '../api/github.js';

export default function TokenSetup({ onSave }) {
    const [ghToken, setGhToken] = useState('');
    const [vsceToken, setVsceToken] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | checking | error
    const [errorMsg, setErrorMsg] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const gh = ghToken.trim();
        if (!gh) return;

        setStatus('checking');
        setErrorMsg('');

        try {
            const user = await validateToken(gh);
            onSave(gh, user.login, vsceToken.trim() || null);
        } catch {
            setStatus('error');
            setErrorMsg('GitHub token validation failed. Make sure it has repo scope and is not expired.');
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">📊</div>
                    <h1 className="text-2xl font-bold text-white">SFMC Analytics</h1>
                    <p className="text-gray-400 mt-2 text-sm">
                        Enter your GitHub Personal Access Token to continue.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl"
                >
                    {/* GitHub PAT — required */}
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        GitHub PAT <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="password"
                        value={ghToken}
                        onChange={(e) => setGhToken(e.target.value)}
                        placeholder="ghp_••••••••••••••••••••••••"
                        autoComplete="off"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                        Needs <code className="text-gray-400">repo</code> scope for 14-day traffic data.{' '}
                        <a
                            href="https://github.com/settings/tokens/new?scopes=repo&description=SFMC+Analytics+Dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                        >
                            Create one →
                        </a>
                    </p>

                    {/* Advanced — VS Marketplace PAT */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced((v) => !v)}
                        className="mt-5 text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                    >
                        <span>{showAdvanced ? '▾' : '▸'}</span>
                        VS Marketplace install counts (optional)
                    </button>

                    {showAdvanced && (
                        <div className="mt-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700">
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                Azure DevOps PAT — Marketplace Read scope
                            </label>
                            <input
                                type="password"
                                value={vsceToken}
                                onChange={(e) => setVsceToken(e.target.value)}
                                placeholder="optional — enables VS Marketplace install counts"
                                autoComplete="off"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                            />
                            <p className="mt-2 text-xs text-gray-600">
                                Without this, install counts fall back to Open VSX download stats.{' '}
                                <a
                                    href="https://dev.azure.com/_usersSettings/tokens"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300"
                                >
                                    Create at dev.azure.com →
                                </a>
                            </p>
                        </div>
                    )}

                    {errorMsg && (
                        <p className="mt-3 text-sm text-red-400">{errorMsg}</p>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'checking' || !ghToken.trim()}
                        className="mt-5 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        {status === 'checking' ? 'Verifying…' : 'Connect'}
                    </button>

                    <p className="mt-4 text-xs text-gray-600 text-center">
                        Tokens are stored only in this browser&apos;s localStorage and never sent
                        anywhere except the respective APIs.
                    </p>
                </form>
            </div>
        </div>
    );
}
