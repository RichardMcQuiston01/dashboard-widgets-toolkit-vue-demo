<script setup lang="ts">
import type {
  WidgetDefinition,
  WidgetThemeStyles,
} from '@richardmcquiston01/dashboard-widgets-toolkit';
import {
  newWidget,
  uniqueWidgetKey,
  viewerSources,
  viewerWidgetKey,
  type BuilderPolicy,
  type SourceDescription,
} from '@richardmcquiston01/dashboard-widgets-toolkit/builder';
import { computed, ref, useId } from 'vue';

import {
  builderSources,
  clearBuilderWidgets,
  clearViewerWidgets,
  findBuilderSource,
  readBuilderWidgets,
  readViewerWidgets,
  viewerPolicy,
  writeBuilderWidgets,
  writeViewerWidgets,
  type StoredBuilderWidgets,
} from '../data/builderSources';
import { widgetDefinitions, type ShopContext } from '../data/widgets';
import {
  buttonClass,
  errorClass,
  fieldClass,
  primaryButtonClass,
} from './builderClasses';
import SavedWidgets from './SavedWidgets.vue';
import WidgetEditor from './WidgetEditor.vue';

type Mode = 'admin' | 'viewer';

interface Editing {
  readonly kind: 'new' | 'edit';
  readonly definition: WidgetDefinition;
}

/** One mode's widgets: create, edit and delete over the demo's sources. */
const props = defineProps<{
  mode: Mode;
  context: ShopContext;
  theme: WidgetThemeStyles | undefined;
}>();

// The parent keys this component by mode, so the mode is fixed for its life.
const isViewer: boolean = props.mode === 'viewer';
const policy: BuilderPolicy | undefined = isViewer ? viewerPolicy : undefined;
const available: readonly SourceDescription[] = isViewer
  ? viewerSources(viewerPolicy, builderSources)
  : builderSources;

const stored = ref<StoredBuilderWidgets>(
  isViewer ? readViewerWidgets() : readBuilderWidgets()
);
const notice = ref<string | undefined>(undefined);
const definitions = ref<readonly WidgetDefinition[]>(stored.value.definitions);
const editing = ref<Editing | undefined>(undefined);
const sourceKey = ref<string>(available[0]?.key ?? '');
const newTitle = ref<string>('');
const createError = ref<string | undefined>(undefined);
const storageError = ref<string | undefined>(stored.value.error);
const id: string = useId();

const takenKeys = computed<readonly string[]>(() => [
  ...widgetDefinitions.map((definition) => definition.key),
  ...definitions.value.map((definition) => definition.key),
]);

function persist(next: readonly WidgetDefinition[]): void {
  definitions.value = next;
  storageError.value = isViewer
    ? writeViewerWidgets(next)
    : writeBuilderWidgets(next);
}

function create(): void {
  const source: SourceDescription | undefined = findBuilderSource(
    sourceKey.value
  );
  if (source === undefined) {
    createError.value = `Source ${JSON.stringify(sourceKey.value)} is not registered.`;
    return;
  }
  const title: string =
    newTitle.value.trim() === '' ? source.label : newTitle.value;
  const created = newWidget(source, {
    key: isViewer
      ? viewerWidgetKey(viewerPolicy, title, takenKeys.value)
      : uniqueWidgetKey(`builder-${title.toLowerCase()}`, takenKeys.value),
    title,
  });
  if (!created.ok) {
    createError.value = created.error;
    return;
  }
  createError.value = undefined;
  newTitle.value = '';
  editing.value = { kind: 'new', definition: created.value };
}

function save(definition: WidgetDefinition, note?: string): void {
  notice.value = note;
  const exists: boolean = definitions.value.some(
    (candidate) => candidate.key === definition.key
  );
  persist(
    exists
      ? definitions.value.map((candidate) =>
          candidate.key === definition.key ? definition : candidate
        )
      : [...definitions.value, definition]
  );
  editing.value = undefined;
}

function remove(key: string): void {
  persist(definitions.value.filter((definition) => definition.key !== key));
  if (editing.value?.definition.key === key) editing.value = undefined;
}

function restoreExamples(): void {
  const problem: string | undefined = isViewer
    ? clearViewerWidgets()
    : clearBuilderWidgets();
  const fresh: StoredBuilderWidgets = isViewer
    ? readViewerWidgets()
    : readBuilderWidgets();
  notice.value = undefined;
  stored.value = fresh;
  definitions.value = fresh.definitions;
  editing.value = undefined;
  storageError.value = problem ?? fresh.error;
}

const editingSource = computed<SourceDescription | undefined>(() =>
  editing.value === undefined
    ? undefined
    : findBuilderSource(editing.value.definition.source ?? '')
);
const placeholder = computed<string>(
  () => findBuilderSource(sourceKey.value)?.label ?? ''
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-end gap-3">
      <div>
        <label :for="`${id}-source`" class="text-sm font-medium"
          >Data source</label
        >
        <select :id="`${id}-source`" v-model="sourceKey" :class="fieldClass">
          <option
            v-for="source in available"
            :key="source.key"
            :value="source.key"
          >
            {{ source.label }} ({{ source.kind }})
          </option>
        </select>
      </div>
      <div>
        <label :for="`${id}-title`" class="text-sm font-medium">Title</label>
        <input
          :id="`${id}-title`"
          v-model="newTitle"
          type="text"
          :class="fieldClass"
          :placeholder="placeholder"
        />
      </div>
      <button type="button" :class="primaryButtonClass" @click="create">
        New widget
      </button>
      <button type="button" :class="buttonClass" @click="restoreExamples">
        {{ isViewer ? 'Delete all mine' : 'Restore the examples' }}
      </button>
    </div>
    <p v-if="isViewer" class="text-sm text-slate-600 dark:text-slate-400">
      Signed in as a viewer. Your policy: {{ viewerPolicy.sources.length }} of
      {{ builderSources.length }} sources, up to
      {{ viewerPolicy.maxWidgets }} widgets ({{ definitions.length }} used), at
      most {{ viewerPolicy.maxOptions }} options and
      {{ viewerPolicy.maxViews }} view each, and only the title, description,
      width and first view to change. Keys start with
      <code>{{ viewerPolicy.keyPrefix }}</code
      >.
    </p>
    <p
      v-if="notice !== undefined"
      role="status"
      class="text-sm text-emerald-700 dark:text-emerald-300"
    >
      Saved. {{ notice }}
    </p>
    <p v-if="createError !== undefined" role="alert" :class="errorClass">
      {{ createError }}
    </p>
    <p v-if="storageError !== undefined" role="alert" :class="errorClass">
      {{ storageError }}
    </p>
    <div v-if="stored.skipped.length > 0" role="status" class="text-sm">
      <p class="font-medium">
        {{ stored.skipped.length }} saved widget(s) were left out:
      </p>
      <ul class="list-disc pl-5">
        <li v-for="skipped in stored.skipped" :key="skipped.key">
          {{ skipped.error }}
        </li>
      </ul>
    </div>

    <section :aria-labelledby="`${id}-list`">
      <h3
        :id="`${id}-list`"
        class="text-lg font-semibold text-brand-700 dark:text-brand-200"
      >
        Your widgets
      </h3>
      <p
        v-if="definitions.length === 0"
        class="mt-1 text-sm text-slate-600 dark:text-slate-400"
      >
        None yet. Pick a source and press New widget.
      </p>
      <ul
        v-else
        class="mt-2 divide-y divide-brand-100 rounded-md border border-brand-200 dark:divide-brand-800 dark:border-brand-700"
      >
        <li
          v-for="definition in definitions"
          :key="definition.key"
          class="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
        >
          <span>
            <strong>{{ definition.title }}</strong>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              {{ ' ' }}{{ definition.kind }} from
              <code>{{ definition.source }}</code>
            </span>
          </span>
          <span class="flex gap-2">
            <button
              type="button"
              :class="buttonClass"
              @click="editing = { kind: 'edit', definition }"
            >
              Edit
            </button>
            <button
              type="button"
              :class="buttonClass"
              @click="remove(definition.key)"
            >
              Delete
            </button>
          </span>
        </li>
      </ul>
    </section>

    <WidgetEditor
      v-if="editing !== undefined && editingSource !== undefined"
      :key="editing.definition.key"
      :source="editingSource"
      :definition="editing.definition"
      :is-new="editing.kind === 'new'"
      :theme="theme"
      :policy="policy"
      :owned="definitions"
      @save="save"
      @cancel="editing = undefined"
    />
    <p
      v-else-if="editing !== undefined && editingSource === undefined"
      role="alert"
      :class="errorClass"
    >
      Widget {{ JSON.stringify(editing.definition.key) }} names source
      {{ JSON.stringify(editing.definition.source) }}, which is not registered.
    </p>

    <section :aria-labelledby="`${id}-live`">
      <h3
        :id="`${id}-live`"
        class="mb-2 text-lg font-semibold text-brand-700 dark:text-brand-200"
      >
        On a dashboard
      </h3>
      <p class="mb-3 text-sm text-slate-600 dark:text-slate-400">
        The saved widgets, loaded through the demo’s own providers (each
        widget’s <code>source</code> names its provider). Save a change above
        and the card follows.
      </p>
      <SavedWidgets
        :definitions="definitions"
        :context="context"
        :theme="theme"
      />
    </section>
  </div>
</template>
