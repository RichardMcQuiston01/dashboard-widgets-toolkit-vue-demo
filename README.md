# Dashboard Widgets Toolkit Vue Demo

- Author: Richard McQuiston
- Website: https://richardmcquiston.com/

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/P1V529Z7ZP)

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Buy Me a Coffee](#buy-me-a-coffee)
- [License](#license)
- [Copyright](#copyright)

## Overview

Single Page Application (SPA) demo of the Vue renderers in the
[dashboard-widgets-toolkit](https://github.com/RichardMcQuiston01/dashboard-widgets-toolkit)
NPM package (`@richardmcquiston01/dashboard-widgets-toolkit/vue`). It mirrors the
interactive dashboard and Widget Builder tabs of the
[React demo](https://github.com/RichardMcQuiston01/dashboard-widgets-toolkit-demo).

**Live demo:** https://richardmcquiston01.github.io/dashboard-widgets-toolkit-vue-demo/

[Back to Top](#table-of-contents)

## Getting Started

### Prerequisites

- Node.js 20+ and npm.

### Installation

```bash
npm install
```

### Usage

```bash
npm run dev          # local dev server
npm run build        # type-check and build to dist/
npm run preview      # serve the production build
npm run format:check # Prettier
```

### Examples

A Vite + Vue 3 + TypeScript + Tailwind CSS app built from render functions and
`<script setup>` components. The dashboard shows:

- All widget types, loaded with `useWidgets` so each card fills in as its data arrives.
- Pages with a page bar, customize mode, drag and drop, and swipe between pages.
- Filters, the detail view (shareable in the URL) and CSV/SVG/PNG export.
- Declared options, alternate views and clones through the Options dialog.
- Themes (including `checkTheme` warnings), locales, light and dark mode.
- A layout saved to `localStorage` through a storage adapter.
- A **Widget Builder** tab (`#builder`): make widgets from a form over three
  described data sources (`useWidgetDraft`, `WidgetOptionsForm`,
  `WidgetViewsForm`, `WidgetPreview`), watch a live preview, and see the saved
  widgets load on a dashboard through the demo's providers. Switch to **Viewer**
  to see the same screen under a policy, where the server's check
  (`validateViewerSave`) refuses anything more, and try to cheat it.

Widgets and simulated providers live in [`src/data/widgets.ts`](./src/data/widgets.ts).

[Back to Top](#table-of-contents)

## Deployment

Deployed to GitHub Pages by [`.github/workflows/pages.yml`](./.github/workflows/pages.yml)
on every push to `main` (Settings → Pages → Source: GitHub Actions). Feature
branches merge into `dev` through pull requests; `dev` merges into `main`
after testing.

[Back to Top](#table-of-contents)

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/P1V529Z7ZP)

[Back to Top](#table-of-contents)

## License

Apache 2

[Back to Top](#table-of-contents)

## Copyright

(c)2026 Richard McQuiston. All rights reserved.

[Back to Top](#table-of-contents)
