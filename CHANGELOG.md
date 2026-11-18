# Changelog

## 0.3.0

- An **API adapter** page (a fourth page): four cards fed by one pretend orders
  API through `defineAdapter` (`src/data/fixtureApi.ts`,
  `src/data/orderAdapters.ts`), sharing one request through the source's
  `scope`, with `bindProviders` checking the providers when the page loads.
  Simulate outage makes the fixture answer 503.
- Toolkit 0.39. Returning visitors whose layout was saved before this page
  existed see the four new cards on the first page until they use Reset layout.

## 0.2.0

- A Widget Builder tab (administrator and viewer modes), matching the React demo's, on toolkit 0.38.
- Toolkit 0.37.1: bare `draggable` and `freshness`, and `DetailExportRequest` from `./vue`.
- The introduction dialog is formatted in sections.

## 0.1.0

- First release: the Vue 3 interactive dashboard demo for
  `@richardmcquiston01/dashboard-widgets-toolkit`, hosted on GitHub Pages.
