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

At the top there is a sortable summary table across all packages.

## Local development

```bash
npm install --no-workspaces
npm run dev
```

The site is built with Vite + React + Tailwind CSS v4. Deployments happen automatically on push to `main` via GitHub Actions.
