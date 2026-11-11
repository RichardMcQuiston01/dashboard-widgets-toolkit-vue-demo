<script setup lang="ts">
import {
  providerKeyOf,
  type WidgetDefinition,
  type WidgetThemeStyles,
} from '@richardmcquiston01/dashboard-widgets-toolkit';
import {
  Dashboard,
  WidgetSettingsProvider,
  useWidgets,
  type DetailExportRequest,
  type DetailLoader,
} from '@richardmcquiston01/dashboard-widgets-toolkit/vue';

import {
  loadWidgetDetail,
  widgetProviders,
  type ShopContext,
} from '../data/widgets';

/**
 * The saved widgets on a real dashboard. They name their provider in `source`,
 * so they load through the providers the demo already registers.
 */
const props = defineProps<{
  definitions: readonly WidgetDefinition[];
  context: ShopContext;
  theme: WidgetThemeStyles | undefined;
}>();

const { widgets, refresh } = useWidgets(
  () => props.definitions,
  widgetProviders,
  props.context
);

const loadDetail: DetailLoader = (definition, { signal, query }) =>
  loadWidgetDetail(providerKeyOf(definition), props.context, signal, query);

function exportDetail(request: DetailExportRequest) {
  const definition: WidgetDefinition | undefined = props.definitions.find(
    (candidate) => candidate.key === request.widgetKey
  );
  return loadWidgetDetail(
    definition === undefined ? request.widgetKey : providerKeyOf(definition),
    props.context,
    new AbortController().signal,
    request.query
  );
}
</script>

<template>
  <p
    v-if="definitions.length === 0"
    class="text-sm text-slate-600 dark:text-slate-400"
  >
    No saved widgets yet. Make one above.
  </p>
  <WidgetSettingsProvider v-else :locale="context.locale" link-target="_blank">
    <Dashboard
      :widgets="widgets"
      freshness
      :on-refresh="refresh"
      :on-retry="refresh"
      :export-formats="['csv', 'svg', 'png']"
      :load-detail="loadDetail"
      :on-export-detail="exportDetail"
      :theme="theme"
    />
  </WidgetSettingsProvider>
</template>
