<script setup lang="ts">
import type { ThemeWarning } from '@richardmcquiston01/dashboard-widgets-toolkit';
import { useId } from 'vue';

import {
  THEME_PRESETS,
  presetSwatches,
  type ThemeChoice,
  type ThemePresetId,
} from '../data/themes';

const props = defineProps<{
  choice: ThemeChoice;
  /** Message from `createTheme` when the current choice is invalid. */
  error: string | null;
  /** Findings from `checkTheme` for the current choice. */
  warnings: readonly ThemeWarning[];
}>();

const emit = defineEmits<{ change: [next: ThemeChoice] }>();

const accentId: string = useId();

function pick(presetId: ThemePresetId): void {
  emit('change', { ...props.choice, presetId });
}

function setAccent(event: Event): void {
  emit('change', {
    ...props.choice,
    accent: (event.target as HTMLInputElement).value,
  });
}

function setCompact(event: Event): void {
  emit('change', {
    ...props.choice,
    compact: (event.target as HTMLInputElement).checked,
  });
}
</script>

<template>
  <fieldset class="mb-5">
    <legend
      class="mb-2 text-sm font-semibold text-brand-700 dark:text-brand-200"
    >
      Color theme
    </legend>
    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <label
        v-for="preset in THEME_PRESETS"
        :key="preset.id"
        class="flex cursor-pointer items-start gap-2 rounded-md border border-brand-200 bg-white p-2.5 text-sm has-[:checked]:border-brand-600 has-[:checked]:ring-2 has-[:checked]:ring-brand-600/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 dark:border-brand-700 dark:bg-brand-900 dark:has-[:checked]:border-brand-300 dark:has-[:checked]:ring-brand-300/40"
      >
        <input
          type="radio"
          name="color-theme"
          :value="preset.id"
          :checked="choice.presetId === preset.id"
          class="mt-1"
          @change="pick(preset.id)"
        />
        <span class="min-w-0">
          <span class="flex items-center gap-2 font-medium">
            {{ preset.label }}
            <span class="flex gap-0.5" aria-hidden="true">
              <span
                v-for="(color, index) in presetSwatches(
                  preset.id,
                  choice.accent
                )"
                :key="`${color}-${index}`"
                class="h-3 w-3 rounded-full border border-black/20"
                :style="{ backgroundColor: color }"
              />
            </span>
          </span>
          <span class="block text-slate-600 dark:text-slate-400">
            {{ preset.description }}
          </span>
        </span>
      </label>
    </div>
    <div
      v-if="choice.presetId === 'custom'"
      class="mt-3 flex items-center gap-2 text-sm"
    >
      <label :for="accentId">Accent color</label>
      <input
        :id="accentId"
        type="color"
        :value="choice.accent"
        class="h-8 w-12 cursor-pointer rounded border border-brand-200 bg-white dark:border-brand-700"
        @input="setAccent"
      />
      <code class="text-slate-600 dark:text-slate-400">{{
        choice.accent
      }}</code>
    </div>
    <label class="mt-3 flex items-center gap-2 text-sm">
      <input type="checkbox" :checked="choice.compact" @change="setCompact" />
      Compact density
      <span class="text-slate-600 dark:text-slate-400">
        (the toolkit’s compact preset: tighter spacing, smaller corners)
      </span>
    </label>
    <div v-if="error === null" class="mt-3 text-sm" aria-live="polite">
      <p class="font-medium">
        Theme check
        <span class="font-normal text-slate-600 dark:text-slate-400">
          (<code>checkTheme</code>: contrast and color vision)
        </span>
      </p>
      <p
        v-if="warnings.length === 0"
        class="text-emerald-700 dark:text-emerald-300"
      >
        No problems found.
      </p>
      <ul v-else class="mt-1 list-disc space-y-0.5 pl-5">
        <li
          v-for="(warning, index) in warnings"
          :key="`${warning.mode}-${warning.check}-${index}`"
          :class="
            warning.severity === 'warning'
              ? 'text-amber-800 dark:text-amber-300'
              : 'text-slate-600 dark:text-slate-400'
          "
        >
          <span class="font-medium">
            {{ warning.severity === 'warning' ? 'Warning' : 'Note' }} ({{
              warning.mode
            }}):
          </span>
          {{ warning.message }}
        </li>
      </ul>
    </div>
    <p
      v-else
      role="alert"
      class="mt-2 text-sm text-rose-700 dark:text-rose-300"
    >
      {{ error }}
    </p>
  </fieldset>
</template>
