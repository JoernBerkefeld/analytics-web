import { useState } from 'react';
import TokenSetup from './components/TokenSetup.jsx';
import Dashboard from './components/Dashboard.jsx';

const TOKEN_KEY = 'sfmc_analytics_gh_pat';
const LOGIN_KEY = 'sfmc_analytics_gh_login';
const VSCE_KEY = 'sfmc_analytics_vsce_pat';

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
    const [userLogin, setUserLogin] = useState(() => localStorage.getItem(LOGIN_KEY) || '');
    const [vsceToken, setVsceToken] = useState(() => localStorage.getItem(VSCE_KEY) || '');

    function handleTokenSave(gh, login, vsce) {
        localStorage.setItem(TOKEN_KEY, gh);
        if (login) localStorage.setItem(LOGIN_KEY, login);
        if (vsce) {
            localStorage.setItem(VSCE_KEY, vsce);
        } else {
            localStorage.removeItem(VSCE_KEY);
        }
        setToken(gh);
        setUserLogin(login || '');
        setVsceToken(vsce || '');
    }

    function handleTokenClear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LOGIN_KEY);
        localStorage.removeItem(VSCE_KEY);
        setToken('');
        setUserLogin('');
        setVsceToken('');
    }

    if (!token) {
        return <TokenSetup onSave={handleTokenSave} />;
    }

    return (
        <Dashboard
            token={token}
            vsceToken={vsceToken || null}
            userLogin={userLogin}
            onClearToken={handleTokenClear}
        />
    );
}
