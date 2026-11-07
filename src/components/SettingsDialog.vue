<script setup lang="ts">
import { onMounted, ref, useId, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    /** Label of the close button. */
    closeLabel?: string;
  }>(),
  { closeLabel: 'Close' }
);
const emit = defineEmits<{ close: [] }>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const titleId: string = useId();

// The native dialog traps focus, closes on Escape and returns focus to the
// button that opened it.
function sync(): void {
  const dialog: HTMLDialogElement | null = dialogRef.value;
  if (dialog === null) return;
  if (props.open && !dialog.open) dialog.showModal();
  if (!props.open && dialog.open) dialog.close();
}
onMounted(sync);
watch(() => props.open, sync);

function onBackdropClick(event: MouseEvent): void {
  // A click on the backdrop (the dialog element itself) closes it.
  if (event.target === dialogRef.value) emit('close');
}
</script>

<template>
  <dialog
    ref="dialogRef"
    :aria-labelledby="titleId"
    class="m-auto max-h-[85vh] w-[min(56rem,92vw)] overflow-y-auto rounded-lg border border-brand-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/50 dark:border-brand-700 dark:bg-brand-900 dark:text-slate-100"
    @close="emit('close')"
    @click="onBackdropClick"
  >
    <div
      class="flex items-center justify-between border-b border-brand-100 px-4 py-3 dark:border-brand-800"
    >
      <h2
        :id="titleId"
        class="text-lg font-semibold text-brand-700 dark:text-brand-200"
      >
        {{ title }}
      </h2>
      <button
        type="button"
        :aria-label="closeLabel"
        :title="closeLabel"
        class="rounded-md p-1.5 text-brand-700 hover:bg-brand-50 dark:text-brand-100 dark:hover:bg-brand-800"
        @click="emit('close')"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M3.5 3.5l9 9M12.5 3.5l-9 9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
    <div class="p-4"><slot /></div>
  </dialog>
</template>
