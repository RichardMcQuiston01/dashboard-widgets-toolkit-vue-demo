<script setup lang="ts">
import type { WidgetDefinition } from '@richardmcquiston01/dashboard-widgets-toolkit';
import {
  validateViewerSave,
  type BuilderPolicy,
  type PatchableField,
  type SourceDescription,
} from '@richardmcquiston01/dashboard-widgets-toolkit/builder';
import {
  WidgetOptionsForm,
  WidgetPreview,
  WidgetViewsForm,
  useWidgetDraft,
  type WidgetDraft,
} from '@richardmcquiston01/dashboard-widgets-toolkit/vue';
import type { WidgetThemeStyles } from '@richardmcquiston01/dashboard-widgets-toolkit';
import { computed, ref, useId } from 'vue';

import { builderSources } from '../data/builderSources';
import {
  buttonClass,
  errorClass,
  fieldClass,
  primaryButtonClass,
} from './builderClasses';

const props = defineProps<{
  source: SourceDescription;
  definition: WidgetDefinition;
  isNew: boolean;
  theme: WidgetThemeStyles | undefined;
  /** A viewer's policy: the form follows it, and Save asks the "server" first. */
  policy: BuilderPolicy | undefined;
  /** The viewer's stored widgets, for the quota the server checks. */
  owned: readonly WidgetDefinition[];
}>();
const emit = defineEmits<{
  save: [definition: WidgetDefinition, note?: string];
  cancel: [];
}>();

const WIDTHS: readonly number[] = [3, 4, 6, 8, 12];

/** The detail setting a source allows: its mode when it fixes one. */
function detailFor(source: SourceDescription): WidgetDefinition['detail'] {
  if (typeof source.detail === 'object' && source.detail.mode !== undefined) {
    return {
      mode: source.detail.mode,
      pageSize: 10,
      pageSizes: [10, 25, 50],
      columnVisibility: true,
    };
  }
  return true;
}

const hasDetail = computed<boolean>(
  () => props.source.detail !== undefined && props.source.detail !== false
);

// The editor is keyed by its widget in the parent, so the starting definition
// is read once; the policy follows the prop.
const draft: WidgetDraft = useWidgetDraft(
  () => props.source,
  props.definition,
  { policy: () => props.policy }
);

const serverSays = ref<string | undefined>(undefined);
const previewView = ref<string | undefined>(undefined);
const saveError = ref<string | undefined>(undefined);
const id: string = useId();

const can = (field: PatchableField): boolean => draft.editable.includes(field);
const views = computed(() => draft.definition.views ?? []);
const title = computed<string>(
  () => draft.patch.title ?? draft.definition.title
);
const description = computed<string>(
  () => draft.patch.description ?? draft.definition.description ?? ''
);
const width = computed<number | undefined>(() =>
  'width' in draft.patch ? draft.patch.width : draft.definition.width
);
const locked = computed<boolean>(
  () =>
    ('locked' in draft.patch ? draft.patch.locked : draft.definition.locked) ===
    true
);
const detailOn = computed<boolean>(() =>
  ('detail' in draft.patch ? draft.patch.detail : draft.definition.detail)
    ? true
    : false
);
const defaultView = computed<string>(
  () =>
    ('defaultView' in draft.patch
      ? draft.patch.defaultView
      : draft.definition.defaultView) ?? 'base'
);

function save(): void {
  const committed = draft.commit();
  if (!committed.ok) {
    saveError.value = committed.error;
    return;
  }
  saveError.value = undefined;
  if (props.policy === undefined) {
    emit('save', committed.value);
    return;
  }
  // The demo has no server, so ask the same check a server would run.
  const verdict = validateViewerSave({
    policy: props.policy,
    sources: builderSources,
    submitted: committed.value,
    previous: props.isNew ? undefined : props.definition,
    owned: props.owned,
  });
  if (!verdict.ok) {
    saveError.value = `The server refused it: ${verdict.error}`;
    return;
  }
  emit(
    'save',
    verdict.value,
    'The server’s check (validateViewerSave) accepted it.'
  );
}

/** What a tampered browser could send; the server's check answers. */
function tamper(kind: 'roles' | 'key'): void {
  if (props.policy === undefined) return;
  const sent: unknown =
    kind === 'roles'
      ? { ...draft.definition, roles: ['admin'], locked: true }
      : { ...draft.definition, key: 'u-someone-else-widget' };
  const verdict = validateViewerSave({
    policy: props.policy,
    sources: builderSources,
    submitted: sent,
    previous: props.isNew ? undefined : props.definition,
    owned: props.owned,
  });
  serverSays.value = verdict.ok
    ? 'The server accepted it (unexpected).'
    : `The server refused it: ${verdict.error}`;
}

function onWidthChange(event: Event): void {
  const value: string = (event.target as HTMLSelectElement).value;
  draft.setField('width', value === '' ? undefined : Number(value));
}
function onDefaultViewChange(event: Event): void {
  const value: string = (event.target as HTMLSelectElement).value;
  draft.setField('defaultView', value === 'base' ? undefined : value);
}
function onDescriptionInput(event: Event): void {
  const value: string = (event.target as HTMLInputElement).value;
  draft.setField('description', value === '' ? undefined : value);
}
function onPreviewViewChange(event: Event): void {
  const value: string = (event.target as HTMLSelectElement).value;
  previewView.value = value === '' ? undefined : value;
}
</script>

<template>
  <div
    class="mt-4 rounded-lg border border-brand-200 p-4 dark:border-brand-700"
  >
    <h3 class="text-lg font-semibold text-brand-700 dark:text-brand-200">
      {{ isNew ? 'New widget' : `Edit “${draft.definition.title}”` }} · source
      <code>{{ source.key }}</code>
    </h3>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
      {{ source.description ?? source.label }} Every change is checked against
      what this source offers, so the widget can never ask for more than the
      provider can give.
    </p>
    <div class="mt-4 grid gap-6 lg:grid-cols-2">
      <div class="flex flex-col gap-4">
        <div>
          <label :for="`${id}-title`" class="text-sm font-medium">Title</label>
          <input
            :id="`${id}-title`"
            type="text"
            :class="fieldClass"
            :value="title"
            :aria-invalid="draft.problems['title'] !== undefined"
            @input="
              draft.setField('title', ($event.target as HTMLInputElement).value)
            "
          />
          <p
            v-if="draft.problems['title'] !== undefined"
            role="alert"
            :class="errorClass"
          >
            {{ draft.problems['title'] }}
          </p>
        </div>
        <div v-if="can('description')">
          <label :for="`${id}-desc`" class="text-sm font-medium">
            Description
          </label>
          <input
            :id="`${id}-desc`"
            type="text"
            :class="fieldClass"
            :value="description"
            @input="onDescriptionInput"
          />
          <p
            v-if="draft.problems['description'] !== undefined"
            role="alert"
            :class="errorClass"
          >
            {{ draft.problems['description'] }}
          </p>
        </div>
        <div v-if="can('width')">
          <label :for="`${id}-width`" class="text-sm font-medium">Width</label>
          <select
            :id="`${id}-width`"
            :class="fieldClass"
            :value="width === undefined ? '' : String(width)"
            @change="onWidthChange"
          >
            <option value="">Default</option>
            <option
              v-for="option in WIDTHS"
              :key="option"
              :value="String(option)"
            >
              {{ option }} of 12 columns
            </option>
          </select>
          <p
            v-if="draft.problems['width'] !== undefined"
            role="alert"
            :class="errorClass"
          >
            {{ draft.problems['width'] }}
          </p>
        </div>
        <label
          v-if="hasDetail && can('detail')"
          class="flex items-center gap-2 text-sm"
        >
          <input
            type="checkbox"
            :checked="detailOn"
            @change="
              draft.setField(
                'detail',
                ($event.target as HTMLInputElement).checked
                  ? detailFor(source)
                  : undefined
              )
            "
          />
          Offer a detail view (the eye button)
        </label>
        <label v-if="can('locked')" class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            :checked="locked"
            @change="
              draft.setField(
                'locked',
                ($event.target as HTMLInputElement).checked ? true : undefined
              )
            "
          />
          Lock it: viewers can’t move, hide or change it
        </label>
        <div v-if="views.length > 0 && can('defaultView')">
          <label :for="`${id}-view`" class="text-sm font-medium"
            >Shown first</label
          >
          <select
            :id="`${id}-view`"
            :class="fieldClass"
            :value="defaultView"
            @change="onDefaultViewChange"
          >
            <option value="base">As the source returns it</option>
            <option v-for="view in views" :key="view.key" :value="view.key">
              {{ view.label }}
            </option>
          </select>
          <p
            v-if="draft.problems['defaultView'] !== undefined"
            role="alert"
            :class="errorClass"
          >
            {{ draft.problems['defaultView'] }}
          </p>
        </div>
        <p
          v-if="draft.problems[''] !== undefined"
          role="alert"
          :class="errorClass"
        >
          {{ draft.problems[''] }}
        </p>
        <WidgetOptionsForm :draft="draft" />
        <WidgetViewsForm :draft="draft" />
      </div>
      <div>
        <h4 class="text-sm font-semibold">Preview</h4>
        <p class="mb-2 text-sm text-slate-600 dark:text-slate-400">
          Drawn from the source’s sample data, with no provider call, as you
          type. Options your provider applies (like how many rows) can’t show
          here; sorting, columns and views can.
        </p>
        <div v-if="views.length > 0" class="mb-2">
          <label :for="`${id}-pview`" class="text-sm font-medium"
            >Preview view</label
          >
          <select
            :id="`${id}-pview`"
            :class="fieldClass"
            :value="previewView ?? ''"
            @change="onPreviewViewChange"
          >
            <option value="">The one shown first</option>
            <option value="base">As the source returns it</option>
            <option v-for="view in views" :key="view.key" :value="view.key">
              {{ view.label }}
            </option>
          </select>
        </div>
        <WidgetPreview
          :source="source"
          :definition="draft.candidate"
          :view="previewView"
          :theme="theme"
        />
        <details class="mt-3 text-sm">
          <summary class="cursor-pointer font-medium">
            The JSON that gets saved
          </summary>
          <pre
            class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-brand-900"
            >{{ JSON.stringify(draft.definition, null, 2) }}</pre>
        </details>
      </div>
    </div>
    <p v-if="saveError !== undefined" role="alert" :class="errorClass">
      {{ saveError }}
    </p>
    <div class="mt-4 flex gap-2">
      <button type="button" :class="primaryButtonClass" @click="save">
        Save widget
      </button>
      <button type="button" :class="buttonClass" @click="emit('cancel')">
        Cancel
      </button>
    </div>
    <div
      v-if="policy !== undefined"
      class="mt-4 rounded-md border border-brand-200 p-3 text-sm dark:border-brand-700"
    >
      <p class="font-medium">Try to cheat</p>
      <p class="mt-1 text-slate-600 dark:text-slate-400">
        The form only offers what your policy allows, but a browser can send
        anything. Send these to the server’s check:
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button type="button" :class="buttonClass" @click="tamper('roles')">
          Add roles and a lock
        </button>
        <button type="button" :class="buttonClass" @click="tamper('key')">
          Use someone else’s key
        </button>
      </div>
      <p v-if="serverSays !== undefined" role="status" class="mt-2">
        {{ serverSays }}
      </p>
    </div>
  </div>
</template>
