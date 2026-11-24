# SFMC Analytics Dashboard

Personal analytics dashboard for all SFMC-related packages and extensions.

Live at: **https://joernberkefeld.github.io/analytics-web/**

## Setup

1. Open the URL above in any browser (desktop or mobile).
2. On first visit, you'll be prompted for a **GitHub Personal Access Token**.
3. Create one at [github.com/settings/tokens](https://github.com/settings/tokens/new?scopes=repo&description=SFMC+Analytics+Dashboard) with **`repo` scope** (needed for 14-day traffic data).
4. Paste it in and click **Connect**. The token is stored in your browser's `localStorage` — it never leaves your device.
5. On every subsequent visit the dashboard loads immediately.

To switch tokens or sign out, tap the ⚙ icon in the top-right corner.

## What it shows

For each package/repo:

- **GitHub**: stars, forks, watchers, open issues, 14-day page views and clones
- **npm**: downloads (week / month / year), latest published version
- **VS Code Marketplace**: install count, latest version, rating
- **Open VSX**: download count, latest version
- **Chrome Web Store** (SFMC UX Tools only): total installs and rating, after a Google sign-in

At the top there is a sortable summary table across all packages.

## Chrome Web Store numbers

The store's numbers are private to the publisher, so the card reads them with your own Google sign-in. Nothing about them is in this repository or in the published site.

- The card asks once for an **OAuth client ID** and your **publisher ID** and keeps both in this browser's `localStorage`. **Forget IDs** removes them.
- **Sign in with Google** opens Google's window and asks for read-only access to the Chrome Web Store. The sign-in is kept in memory only, so it is asked again after a reload of the page.

One-time setup in the [Google Cloud console](https://console.cloud.google.com), with the Google account that owns the store item:

1. Pick or create a project and enable the **Chrome Web Store API** (APIs & Services → Library).
2. Set up the OAuth consent screen: user type External, publishing status Testing, your own account as test user.
3. Create credentials → OAuth client ID → **Web application**. Add `https://joernberkefeld.github.io` and `http://localhost:5173` as authorized JavaScript origins, no redirect URIs. Copy the client ID; the client secret is not needed.
4. Copy the publisher ID from the Chrome Web Store developer dashboard (Account).

## Local development

```bash
npm install --no-workspaces
npm run dev
```

The site is built with Vite + React + Tailwind CSS v4. Deployments happen automatically on push to `main` via GitHub Actions.
