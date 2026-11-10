/**
 * What each tab says about itself. The text opens in a dialog shortly after the
 * tab first shows (once per page load); the info button beside the tab's
 * controls opens it again.
 */
export const TAB_IDS = ['dashboard', 'builder'] as const;
export type TabId = (typeof TAB_IDS)[number];

export interface IntroSection {
  readonly heading: string;
  readonly items: readonly string[];
}

export interface TabIntro {
  readonly title: string;
  readonly lead: string;
  readonly sections: readonly IntroSection[];
}

export const TAB_INTROS: Readonly<Record<TabId, TabIntro>> = {
  dashboard: {
    title: 'Interactive dashboard (Vue)',
    lead: 'The Vue renderers of the Dashboard Widgets Toolkit: the same widgets, layout and stylesheet as the React demo, drawn by Vue 3 components.',
    sections: [
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
    ],
  },
  builder: {
    title: 'Widget Builder',
    lead: 'An admin screen for making widgets without code. Each data source is described once in code (what it returns and what it can be asked for); the form can only combine those choices.',
    sections: [
      {
        heading: 'Make a widget',
        items: [
          'Pick a source, name the widget, then choose which of the source’s options viewers get, and their defaults.',
          'Add alternate views, set the width and lock, and watch the preview as you type.',
          'A change the source can’t serve is refused with its reason.',
        ],
      },
      {
        heading: 'Saved widgets',
        items: [
          'They are kept in this browser as JSON and appear on the dashboard at the bottom of the page.',
          'They load through the same providers as the Interactive dashboard.',
        ],
      },
      {
        heading: 'Building as a viewer',
        items: [
          'Switch “Building as” to Viewer to see the same screen under a policy: two of the three sources, at most three widgets, and only some fields.',
          'The server’s check refuses anything more, and you can try to cheat it.',
        ],
      },
    ],
  },
};

/** Milliseconds after a tab shows before its introduction opens. */
export const INTRO_DELAY_MS = 700;
