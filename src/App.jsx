import { useState } from 'react';
import TokenSetup from './components/TokenSetup.jsx';
import Dashboard from './components/Dashboard.jsx';

const TOKEN_KEY = 'sfmc_analytics_gh_pat';
const LOGIN_KEY = 'sfmc_analytics_gh_login';

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
    const [userLogin, setUserLogin] = useState(() => localStorage.getItem(LOGIN_KEY) || '');

    function handleTokenSave(gh, login) {
        localStorage.setItem(TOKEN_KEY, gh);
        if (login) localStorage.setItem(LOGIN_KEY, login);
        setToken(gh);
        setUserLogin(login || '');
    }

    function handleTokenClear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LOGIN_KEY);
        setToken('');
        setUserLogin('');
    }

    if (!token) {
        return <TokenSetup onSave={handleTokenSave} />;
    }

    return (
        <Dashboard
            token={token}
            userLogin={userLogin}
            onClearToken={handleTokenClear}
        />
    );
}
