/** What the page says about itself; it opens in a dialog once per page load. */
export const INTRO_TITLE = 'Interactive dashboard (Vue)';

export const INTRO_LEAD =
  'The Vue renderers of the Dashboard Widgets Toolkit: the same widgets, layout and stylesheet as the React demo, drawn by Vue 3 components.';

export interface IntroSection {
  readonly heading: string;
  readonly items: readonly string[];
}

export const INTRO_SECTIONS: readonly IntroSection[] = [
  {
    heading: 'Arrange',
    items: [
      'Press Customize to move, hide or minimize widgets, and to add or rename pages.',
      'Drag a card by its handle (mouse, touch or keyboard), or use its Arrange menu. Sync status and Store policy are locked.',
      'Options… in the Arrange menu changes a card’s title, width and what it asks its provider for.',
      'Swipe left or right on a touch screen to change page.',
    ],
  },
  {
    heading: 'Explore',
    items: [
      'The eye button opens a sortable, filterable detail view.',
      'Tables, bar lists and charts have download buttons (CSV, plus SVG and PNG for charts).',
    ],
  },
  {
    heading: 'Settings (the gear)',
    items: [
      'Color theme, light or dark mode and locale.',
      'Demo options: Pages, Edit controls, Fill widgets, Error demo and Simulate outage.',
      'Layouts are saved in this browser and follow you across tabs.',
    ],
  },
];

/** Milliseconds after the page loads before the introduction opens. */
export const INTRO_DELAY_MS = 700;
