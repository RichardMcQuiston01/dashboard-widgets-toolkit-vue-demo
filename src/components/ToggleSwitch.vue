<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  label: string;
  modelValue: boolean;
  /** A line under the label that says what the switch does. */
  hint?: string;
  /** The label stays for screen readers but is not drawn (a toolbar switch). */
  hideLabel?: boolean;
  /** Tooltip of the whole control. */
  title?: string;
}>();

defineEmits<{ 'update:modelValue': [value: boolean] }>();

const labelId: string = useId();
const hintId: string = useId();
</script>

<template>
  <div class="flex items-center gap-3" :title="title">
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-labelledby="labelId"
      :aria-describedby="hint === undefined ? undefined : hintId"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-brand-300 bg-brand-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 aria-checked:border-brand-600 aria-checked:bg-brand-600 dark:border-brand-600 dark:bg-brand-800 dark:aria-checked:bg-brand-500"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <span
        aria-hidden="true"
        class="inline-block size-4 rounded-full bg-white shadow transition-transform"
        :class="modelValue ? 'translate-x-6' : 'translate-x-1'"
      />
    </button>
    <span :class="hideLabel ? 'sr-only' : 'text-sm'">
      <span :id="labelId" class="font-medium">{{ label }}</span>
      <span
        v-if="hint !== undefined"
        :id="hintId"
        class="block text-xs text-slate-600 dark:text-slate-400"
      >
        {{ hint }}
      </span>
    </span>
  </div>
</template>
