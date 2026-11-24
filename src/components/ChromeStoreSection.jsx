import { useEffect, useState } from 'react';
import {
    fetchChromeStoreStats,
    loadGoogleIdentity,
    requestAccessToken,
} from '../api/chromestore.js';

const CLIENT_KEY = 'sfmc_analytics_cws_client_id';
const PUBLISHER_KEY = 'sfmc_analytics_cws_publisher_id';

const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white placeholder-gray-600 text-xs font-mono mb-1';
const buttonClass =
    'bg-blue-700 hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-semibold px-3 py-1 rounded transition-colors';

function Row({ label, value, sub }) {
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

/**
 * Private numbers of a Chrome Web Store item. The OAuth client ID and the publisher ID are
 * asked for once and kept in this browser; the sign-in token and the numbers live in memory.
 */
export default function ChromeStoreSection({ itemId }) {
    const [clientId, setClientId] = useState(() => localStorage.getItem(CLIENT_KEY) || '');
    const [publisherId, setPublisherId] = useState(
        () => localStorage.getItem(PUBLISHER_KEY) || ''
    );
    const [draftClient, setDraftClient] = useState('');
    const [draftPublisher, setDraftPublisher] = useState('');
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [stats, setStats] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const hasIds = Boolean(clientId && publisherId);

    useEffect(() => {
        if (!hasIds) return undefined;
        let stale = false;
        loadGoogleIdentity().then(
            () => {
                if (!stale) setReady(true);
            },
            (error) => {
                if (!stale) setErrorMsg(error.message);
            }
        );
        return () => {
            stale = true;
        };
    }, [hasIds]);

    function handleSave(e) {
        e.preventDefault();
        const client = draftClient.trim();
        const publisher = draftPublisher.trim();
        if (!client || !publisher) return;
        localStorage.setItem(CLIENT_KEY, client);
        localStorage.setItem(PUBLISHER_KEY, publisher);
        setClientId(client);
        setPublisherId(publisher);
    }

    function handleForget() {
        localStorage.removeItem(CLIENT_KEY);
        localStorage.removeItem(PUBLISHER_KEY);
        setClientId('');
        setPublisherId('');
        setReady(false);
        setStats(null);
        setErrorMsg('');
    }

    async function handleSignIn() {
        setBusy(true);
        setErrorMsg('');
        try {
            const token = await requestAccessToken(clientId);
            setStats(await fetchChromeStoreStats(publisherId, itemId, token));
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="mt-3">
            <div className="h-px bg-teal-500 mb-2 opacity-40" />
            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-teal-400">
                Chrome Web Store
            </p>

            {!hasIds && (
                <form onSubmit={handleSave}>
                    <input
                        value={draftClient}
                        onChange={(e) => setDraftClient(e.target.value)}
                        placeholder="OAuth client ID"
                        aria-label="OAuth client ID"
                        autoComplete="off"
                        className={inputClass}
                    />
                    <input
                        value={draftPublisher}
                        onChange={(e) => setDraftPublisher(e.target.value)}
                        placeholder="Publisher ID"
                        aria-label="Publisher ID"
                        autoComplete="off"
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        disabled={!draftClient.trim() || !draftPublisher.trim()}
                        className={buttonClass}
                    >
                        Save
                    </button>
                    <p className="text-gray-600 text-xs mt-1">
                        Kept in this browser only. See the README for where to find both.
                    </p>
                </form>
            )}

            {hasIds && stats && (
                <>
                    <Row label="Installs" value={stats.installs.toLocaleString('en-US')} />
                    <Row
                        label="Rating"
                        value={stats.ratingCount > 0 ? `${stats.rating.toFixed(1)} ★` : '—'}
                        sub={`(${stats.ratingCount})`}
                    />
                </>
            )}

            {hasIds && (
                <div className="flex items-center gap-3 mt-1">
                    <button
                        type="button"
                        onClick={handleSignIn}
                        disabled={!ready || busy}
                        className={buttonClass}
                    >
                        {busy ? 'Loading…' : stats ? '↺ Reload' : 'Sign in with Google'}
                    </button>
                    <button
                        type="button"
                        onClick={handleForget}
                        className="text-gray-600 hover:text-gray-400 text-xs"
                    >
                        Forget IDs
                    </button>
                </div>
            )}

            {errorMsg && <p className="text-red-400 text-xs mt-1">{errorMsg}</p>}
        </div>
    );
}
