<script setup lang="ts">
import {
  EMPTY_LAYOUT,
  farPageWidgetKeys,
  optionValuesFromLayout,
  pageList,
  parseDetailLink,
  viewValuesFromLayout,
  withClones,
  withDetailLink,
  type DetailLink,
  type WidgetDefinition,
} from '@richardmcquiston01/dashboard-widgets-toolkit';
import {
  Dashboard,
  WidgetSettingsProvider,
  useDashboardFilters,
  useStoredLayout,
  useWidgets,
  type CellFormatter,
  type CellFormatterProblem,
  type DetailExportRequest,
  type DetailLoader,
} from '@richardmcquiston01/dashboard-widgets-toolkit/vue';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue';

import DonateCard from './components/DonateCard.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import ThemePicker from './components/ThemePicker.vue';
import ToggleSwitch from './components/ToggleSwitch.vue';
import { statusBadge } from './components/status-badge';
import { LAYOUT_SCOPE, PAGED_LAYOUT, layoutPersistence } from './data/layouts';
import {
  buildTheme,
  readStoredThemeChoice,
  storeThemeChoice,
  type BuiltTheme,
  type ThemeChoice,
} from './data/themes';
import {
  ERROR_DEMO_KEY,
  dashboardFilters,
  loadWidgetDetail,
  setSimulatedOutage,
  widgetDefinitions,
  widgetProviders,
  type ShopContext,
} from './data/widgets';
import {
  INTRO_DELAY_MS,
  INTRO_LEAD,
  INTRO_SECTIONS,
  INTRO_TITLE,
} from './intro';

type Theme = 'light' | 'dark';

interface LocaleOption {
  readonly label: string;
  readonly locale: string;
  readonly currency: string;
}

const LOCALES: readonly LocaleOption[] = [
  { label: 'English (US) · USD', locale: 'en-US', currency: 'USD' },
  { label: 'English (UK) · GBP', locale: 'en-GB', currency: 'GBP' },
  { label: 'German · EUR', locale: 'de-DE', currency: 'EUR' },
  { label: 'Japanese · JPY', locale: 'ja-JP', currency: 'JPY' },
];

/** Formatters for `custom` table columns, by the name a column gives. */
const CELL_FORMATTERS: Readonly<Record<string, CellFormatter>> = {
  statusBadge,
};

/** A missing or failing formatter shows the cell's text; this says why. */
function reportFormatterProblem(problem: CellFormatterProblem): void {
  console.warn(problem.message);
}

function reportExportProblem(message: string): void {
  console.warn(message);
}

const STATUS_TEXT = {
  loading: 'Loading your layout…',
  ready: 'Layout saved in this browser.',
  saving: 'Saving your layout…',
  error: 'Layout not saved.',
  conflict: 'Layout changed elsewhere.',
} as const;

const iconButtonClass =
  'flex size-9 items-center justify-center rounded-md border border-brand-200 bg-white text-brand-700 shadow-sm hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-brand-700 dark:bg-brand-900 dark:text-brand-100 dark:hover:bg-brand-800';
const noticeButtonClass =
  'rounded-md border border-brand-200 bg-white px-2 py-0.5 text-sm font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:bg-brand-900 dark:text-brand-100 dark:hover:bg-brand-800';
const footerLinkClass =
  'underline decoration-brand-300 underline-offset-2 hover:text-white';

// ---- Viewer choices -------------------------------------------------------

const theme = ref<Theme>(
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
);
const localeIndex = ref<number>(0);
const themeChoice = ref<ThemeChoice>(readStoredThemeChoice());
const editMode = ref<'toggle' | 'always'>('toggle');
const isAdmin = ref<boolean>(false);
const isFilled = ref<boolean>(true);
const showErrorDemo = ref<boolean>(false);
const outage = ref<boolean>(false);
const settingsOpen = ref<boolean>(false);
const introOpen = ref<boolean>(false);

const localeOption = computed<LocaleOption>(
  () => LOCALES[localeIndex.value] ?? (LOCALES[0] as LocaleOption)
);
const builtTheme = computed<BuiltTheme>(() => buildTheme(themeChoice.value));

watchEffect(() => {
  document.documentElement.dataset['theme'] = theme.value;
});

function changeThemeChoice(next: ThemeChoice): void {
  themeChoice.value = next;
  storeThemeChoice(next);
}

function toggleOutage(next: boolean): void {
  setSimulatedOutage(next);
  outage.value = next;
}

// ---- The stored layout ----------------------------------------------------

const {
  layout,
  setLayout,
  backup,
  setBackup,
  activePage,
  setActivePage,
  status,
  error: storageError,
  remoteLayout,
  resolveRemote,
  conflict,
  resolveConflict,
} = useStoredLayout({
  persistence: layoutPersistence,
  scope: LAYOUT_SCOPE,
  definitions: widgetDefinitions,
  defaultLayout: PAGED_LAYOUT,
});

const hasPages = computed<boolean>(() => (layout.value.pages?.length ?? 0) > 1);

function togglePages(): void {
  setLayout(hasPages.value ? EMPTY_LAYOUT : PAGED_LAYOUT);
}

// ---- The widgets ------------------------------------------------------------

const activeDefinitions = computed<readonly WidgetDefinition[]>(() =>
  widgetDefinitions
    .filter(({ key }) => showErrorDemo.value || key !== ERROR_DEMO_KEY)
    // Each definition sets `fill`; dropping it shows the default layout.
    .map(({ fill, ...rest }) => (isFilled.value ? { ...rest, fill } : rest))
);

// Providers read the context when they run, so changing a field here and then
// calling `refresh()` makes every widget load again with the new values.
const shopContext: { -readonly [K in keyof ShopContext]: ShopContext[K] } =
  reactive({
    shopName: 'Demo Shop',
    currency: LOCALES[0]?.currency ?? 'USD',
    locale: LOCALES[0]?.locale ?? 'en-US',
    refreshCount: 0,
  });

// Clones are widgets too: add them to the definitions so they load (through
// their original's provider) and get their own option values.
const allDefinitions = computed<readonly WidgetDefinition[]>(() =>
  withClones(activeDefinitions.value, layout.value, {
    overrideLocks: isAdmin.value,
  })
);
// The option values each viewer chose live in the layout; this hands them to
// the providers (and sends the defaults back after a Reset).
const optionValues = computed(() =>
  optionValuesFromLayout(allDefinitions.value, layout.value, {
    overrideLocks: isAdmin.value,
  })
);
// Views the provider supplies (Revenue's Trend) are loaded when chosen.
const viewValues = computed(() =>
  viewValuesFromLayout(allDefinitions.value, layout.value, {
    overrideLocks: isAdmin.value,
  })
);
// Dashboard-level filters belong to the app (here: a ref). Only the widgets
// that name a filter reload when it changes.
const filterState = useDashboardFilters(dashboardFilters);

// loadWhen 'visible': a widget loads the first time its card is on screen, so
// the other pages cost nothing until they are shown, and `release` can drop the
// data of pages the viewer left far behind (see below).
const { widgets, refresh, release, gridRef } = useWidgets(
  allDefinitions,
  widgetProviders,
  shopContext,
  () => ({
    loadWhen: 'visible' as const,
    optionValues: optionValues.value,
    viewValues: viewValues.value,
    filters: dashboardFilters,
    filterValues: filterState.values.value,
  })
);

watch(localeOption, (next) => {
  shopContext.currency = next.currency;
  shopContext.locale = next.locale;
  refresh();
});

/** Hands the element around the cards to `useWidgets` (loadWhen 'visible'). */
function setGridElement(element: unknown): void {
  gridRef.value = element instanceof HTMLElement ? element : null;
}

function refreshData(): void {
  shopContext.refreshCount += 1;
  refresh();
}

// With three pages, a page two away from the one in view is released: its
// payloads are dropped and it loads again when the viewer returns to it.
const pageInView = computed<string | undefined>(
  () => activePage.value ?? pageList(layout.value)[0]?.key
);
watch([allDefinitions, layout, pageInView], () => {
  if (pageInView.value === undefined) return;
  release(
    farPageWidgetKeys(allDefinitions.value, layout.value, pageInView.value, 1)
  );
});

// ---- The open detail view lives in the URL ----------------------------------
// (?widget=recent-orders&sort=c2:desc). The query string is the state: it is
// parsed against all the widgets, clones included, so a link to a clone works
// once the layout has loaded. Opening and closing add history entries (Back
// closes the dialog); searching, sorting and paging replace the entry.

const search = ref<string>(window.location.search);
const detail = computed<DetailLink | null>(() => {
  const parsed = parseDetailLink(search.value, allDefinitions.value);
  if (!parsed.ok) {
    console.warn(parsed.error);
    return null;
  }
  return parsed.value ?? null;
});

function handleDetailChange(
  next: DetailLink | null,
  reason: 'open' | 'query' | 'close'
): void {
  const query: string = withDetailLink(window.location.search, next);
  const url = `${window.location.pathname}${query === '' ? '' : `?${query}`}${window.location.hash}`;
  if (reason === 'query') window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  search.value = window.location.search;
}

function onPopState(): void {
  search.value = window.location.search;
}
onMounted(() => window.addEventListener('popstate', onPopState));
onBeforeUnmount(() => window.removeEventListener('popstate', onPopState));

// The data behind each card's "View" button, loaded only when it is opened.
const loadDetail: DetailLoader = (definition, { signal, query }) =>
  loadWidgetDetail(
    definition.sourceKey ?? definition.key,
    localeOption.value,
    signal,
    query
  );

// Server-mode detail views hold one page, so their Download CSV button asks for
// every row that matches the search and filters instead.
function exportDetail(request: DetailExportRequest) {
  return loadWidgetDetail(
    request.widgetKey,
    localeOption.value,
    new AbortController().signal,
    request.query
  );
}

// ---- The introduction opens once per page load ----------------------------

let introTimer: number | undefined;
onMounted(() => {
  introTimer = window.setTimeout(() => {
    introOpen.value = true;
  }, INTRO_DELAY_MS);
});
onBeforeUnmount(() => window.clearTimeout(introTimer));
</script>

<template>
  <div>
    <header class="bg-brand-800 text-white">
      <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h1 class="text-2xl font-bold sm:text-3xl">
          Dashboard Widgets Toolkit
          <span class="font-normal text-brand-200">· Vue demo</span>
        </h1>
        <div
          class="mt-1 flex flex-col gap-x-6 gap-y-1 text-sm sm:flex-row sm:items-baseline sm:justify-between"
        >
          <p class="text-brand-100">
            The Vue renderers: typed widgets, validated JSON payloads and
            accessible Vue 3 components.
          </p>
          <p class="flex shrink-0 gap-4">
            <a
              class="font-medium text-accent-400 underline"
              href="https://github.com/RichardMcQuiston01/dashboard-widgets-toolkit"
              target="_blank"
              rel="noopener noreferrer"
            >
              Package on GitHub
            </a>
            <a
              class="font-medium text-accent-400 underline"
              href="https://dashboard-widgets-toolkit-demo.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              React demo
            </a>
            <a
              class="font-medium text-accent-400 underline"
              href="https://github.com/RichardMcQuiston01/dashboard-widgets-toolkit-vue-demo"
              target="_blank"
              rel="noopener noreferrer"
            >
              Demo source
            </a>
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6">
      <section aria-labelledby="dashboard-heading">
        <h2 id="dashboard-heading" class="sr-only">{{ INTRO_TITLE }}</h2>

        <div class="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            :class="iconButtonClass"
            aria-haspopup="dialog"
            aria-label="Settings"
            title="Settings"
            @click="settingsOpen = true"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.7a1.2 1.2 0 0 0 .24 1.32l.04.04a1.45 1.45 0 1 1-2.05 2.05l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1v.12a1.45 1.45 0 1 1-2.9 0v-.06a1.2 1.2 0 0 0-.79-1.1 1.2 1.2 0 0 0-1.32.24l-.04.04a1.45 1.45 0 1 1-2.05-2.05l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.73h-.12a1.45 1.45 0 1 1 0-2.9h.06a1.2 1.2 0 0 0 1.1-.79 1.2 1.2 0 0 0-.24-1.32l-.04-.04A1.45 1.45 0 1 1 8.1 5.4l.04.04a1.2 1.2 0 0 0 1.32.24h.06a1.2 1.2 0 0 0 .73-1.1v-.12a1.45 1.45 0 1 1 2.9 0v.06a1.2 1.2 0 0 0 .73 1.1 1.2 1.2 0 0 0 1.32-.24l.04-.04a1.45 1.45 0 1 1 2.05 2.05l-.04.04a1.2 1.2 0 0 0-.24 1.32v.06a1.2 1.2 0 0 0 1.1.73h.12a1.45 1.45 0 1 1 0 2.9h-.06a1.2 1.2 0 0 0-1.1.73Z"
              />
            </svg>
          </button>
          <button
            type="button"
            :class="iconButtonClass"
            aria-label="Refresh data"
            title="Refresh data"
            @click="refreshData"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
            </svg>
          </button>
          <button
            type="button"
            :class="iconButtonClass"
            aria-haspopup="dialog"
            aria-label="About this page"
            title="About this page"
            @click="introOpen = true"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5.5M12 7.6v.01" />
            </svg>
          </button>
          <ToggleSwitch
            v-model="isAdmin"
            label="Administrator"
            title="Administrator: may change locked widgets"
          />
        </div>

        <div class="mb-4 space-y-2 text-sm" role="status" aria-live="polite">
          <p class="text-slate-600 dark:text-slate-400">
            {{ STATUS_TEXT[status] }}
            <span
              v-if="storageError !== null"
              class="ml-1 text-rose-700 dark:text-rose-300"
            >
              {{ storageError }} The dashboard keeps working with the layout in
              memory.
            </span>
          </p>
          <p
            v-if="remoteLayout !== null"
            class="flex flex-wrap items-center gap-2"
          >
            Layout changed in another tab. Use that version?
            <button
              type="button"
              :class="noticeButtonClass"
              aria-label="Use the other tab's layout"
              @click="resolveRemote('use')"
            >
              ✓
            </button>
            <button
              type="button"
              :class="noticeButtonClass"
              aria-label="Keep this tab's layout"
              @click="resolveRemote('ignore')"
            >
              X
            </button>
          </p>
          <p v-if="conflict !== null" class="flex flex-wrap items-center gap-2">
            Someone else saved a different layout. Keep yours?
            <button
              type="button"
              :class="noticeButtonClass"
              @click="resolveConflict('mine')"
            >
              Keep mine
            </button>
            <button
              type="button"
              :class="noticeButtonClass"
              @click="resolveConflict('theirs')"
            >
              Use theirs
            </button>
          </p>
        </div>

        <SettingsDialog
          :open="settingsOpen"
          title="Settings"
          close-label="Close settings"
          @close="settingsOpen = false"
        >
          <fieldset class="mb-5">
            <legend
              class="mb-2 text-sm font-semibold text-brand-700 dark:text-brand-200"
            >
              Demo options
            </legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <ToggleSwitch
                label="Pages"
                hint="Three pages with a page bar, or one page."
                :model-value="hasPages"
                @update:model-value="togglePages"
              />
              <ToggleSwitch
                v-model="isFilled"
                label="Fill widgets"
                hint="Cards stretch to fill free space in their row."
              />
              <ToggleSwitch
                v-model="showErrorDemo"
                label="Error demo"
                hint="Adds a widget whose provider fails."
              />
              <ToggleSwitch
                label="Simulate outage"
                hint="Refreshing Revenue, Refund rate or Revenue by month fails."
                :model-value="outage"
                @update:model-value="toggleOutage"
              />
            </div>
            <label class="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span class="font-medium">Edit controls</span>
              <select
                v-model="editMode"
                class="rounded-md border border-brand-200 bg-white px-2 py-1.5 dark:border-brand-700 dark:bg-brand-900"
              >
                <option value="toggle">Behind Customize</option>
                <option value="always">Always shown</option>
              </select>
            </label>
          </fieldset>
          <fieldset class="mb-5">
            <legend
              class="mb-2 text-sm font-semibold text-brand-700 dark:text-brand-200"
            >
              Mode
            </legend>
            <div class="flex gap-4 text-sm">
              <label
                v-for="mode in ['light', 'dark'] as const"
                :key="mode"
                class="flex items-center gap-2"
              >
                <input
                  v-model="theme"
                  type="radio"
                  name="color-mode"
                  :value="mode"
                />
                {{ mode === 'light' ? 'Light' : 'Dark' }}
              </label>
            </div>
          </fieldset>
          <ThemePicker
            :choice="themeChoice"
            :error="builtTheme.ok ? null : builtTheme.error"
            :warnings="builtTheme.ok ? builtTheme.warnings : []"
            @change="changeThemeChoice"
          />
          <label class="mb-5 flex items-center gap-2 text-sm">
            Locale
            <select
              v-model.number="localeIndex"
              class="rounded-md border border-brand-200 bg-white px-2 py-1.5 dark:border-brand-700 dark:bg-brand-900"
            >
              <option
                v-for="(option, index) in LOCALES"
                :key="option.locale"
                :value="index"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </SettingsDialog>

        <SettingsDialog
          :open="introOpen"
          :title="INTRO_TITLE"
          close-label="Close introduction"
          @close="introOpen = false"
        >
          <div
            class="max-w-3xl space-y-4 text-sm text-slate-700 dark:text-slate-300"
          >
            <p class="text-base">{{ INTRO_LEAD }}</p>
            <section v-for="section in INTRO_SECTIONS" :key="section.heading">
              <h3
                class="mb-1 text-sm font-semibold text-brand-700 dark:text-brand-200"
              >
                {{ section.heading }}
              </h3>
              <ul class="list-disc space-y-1 pl-5 marker:text-brand-400">
                <li v-for="item in section.items" :key="item">{{ item }}</li>
              </ul>
            </section>
          </div>
        </SettingsDialog>

        <div :ref="setGridElement">
          <WidgetSettingsProvider
            :locale="localeOption.locale"
            link-target="_blank"
            :formatters="CELL_FORMATTERS"
            :on-formatter-error="reportFormatterProblem"
          >
            <Dashboard
              :widgets="widgets"
              :layout="layout"
              :on-layout-change="setLayout"
              :default-layout="PAGED_LAYOUT"
              :active-page="activePage"
              :on-active-page-change="setActivePage"
              :backup="backup"
              :on-backup="setBackup"
              :edit-mode="editMode"
              draggable
              :filters="dashboardFilters"
              :filter-values="filterState.values.value"
              :on-filter-change="filterState.setValues"
              :theme="
                builtTheme.ok && builtTheme.styles !== null
                  ? builtTheme.styles
                  : undefined
              "
              :override-locks="isAdmin"
              :on-retry="refresh"
              freshness
              :on-refresh="refresh"
              :export-formats="['csv', 'svg', 'png']"
              :on-export-error="reportExportProblem"
              :load-detail="loadDetail"
              :on-export-detail="exportDetail"
              :detail="detail"
              :on-detail-change="handleDetailChange"
            />
          </WidgetSettingsProvider>
        </div>
      </section>
    </main>

    <footer class="bg-brand-900 text-sm text-brand-200">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <p>
          &copy; 2026 Richard McQuiston. All rights reserved. Licensed under
          Apache 2.0.
        </p>
        <p class="flex flex-wrap gap-x-5 gap-y-1">
          <a
            :class="footerLinkClass"
            href="https://richardmcquiston.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            richardmcquiston.com
          </a>
          <a
            :class="footerLinkClass"
            href="https://github.com/RichardMcQuiston01/dashboard-widgets-toolkit"
            target="_blank"
            rel="noopener noreferrer"
          >
            Toolkit on GitHub
          </a>
          <a
            :class="footerLinkClass"
            href="https://github.com/RichardMcQuiston01/dashboard-widgets-toolkit-vue-demo"
            target="_blank"
            rel="noopener noreferrer"
          >
            Demo source
          </a>
        </p>
      </div>
    </footer>

    <DonateCard />
  </div>
</template>
