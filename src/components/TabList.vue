<script setup lang="ts">
import { ref, type ComponentPublicInstance } from 'vue';

export interface TabDefinition {
  readonly id: string;
  readonly label: string;
}

const props = defineProps<{
  tabs: readonly TabDefinition[];
  activeId: string;
}>();
const emit = defineEmits<{ change: [tabId: string] }>();

const buttons = ref<Map<string, HTMLElement>>(new Map());

function setButton(
  id: string,
  element: Element | ComponentPublicInstance | null
): void {
  if (element instanceof HTMLElement) buttons.value.set(id, element);
  else buttons.value.delete(id);
}

/** WAI-ARIA tabs: arrow keys, Home and End move between the tabs. */
function onKeydown(event: KeyboardEvent, index: number): void {
  const last: number = props.tabs.length - 1;
  let next: number | null = null;
  if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
  if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = last;
  if (next === null) return;
  event.preventDefault();
  const target: TabDefinition | undefined = props.tabs[next];
  if (target === undefined) return;
  emit('change', target.id);
  buttons.value.get(target.id)?.focus();
}
</script>

<template>
  <div
    role="tablist"
    aria-label="Demo sections"
    class="-mx-4 flex gap-1 overflow-x-auto border-b border-white/20 px-4 sm:mx-0 sm:px-0"
  >
    <button
      v-for="(tab, index) in tabs"
      :id="`tab-${tab.id}`"
      :key="tab.id"
      :ref="(element) => setButton(tab.id, element)"
      type="button"
      role="tab"
      :aria-selected="tab.id === activeId"
      :aria-controls="`panel-${tab.id}`"
      :tabindex="tab.id === activeId ? 0 : -1"
      class="-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors"
      :class="
        tab.id === activeId
          ? 'border-accent-400 text-white'
          : 'border-transparent text-brand-200 hover:text-white'
      "
      @click="emit('change', tab.id)"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
