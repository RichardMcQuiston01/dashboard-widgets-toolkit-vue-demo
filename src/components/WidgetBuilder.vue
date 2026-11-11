<script setup lang="ts">
import type { WidgetThemeStyles } from '@richardmcquiston01/dashboard-widgets-toolkit';
import { ref } from 'vue';

import type { ShopContext } from '../data/widgets';
import { buttonClass } from './builderClasses';
import BuilderWorkspace from './BuilderWorkspace.vue';

type Mode = 'admin' | 'viewer';

/** The Widget Builder tab: an administrator's builder and a viewer's, over the demo's sources. */
defineProps<{
  context: ShopContext;
  theme: WidgetThemeStyles | undefined;
}>();

const mode = ref<Mode>('admin');
const MODES: readonly Mode[] = ['admin', 'viewer'];
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      role="group"
      aria-label="Who is building"
      class="flex flex-wrap items-center gap-2"
    >
      <span class="text-sm font-medium">Building as</span>
      <button
        v-for="option in MODES"
        :key="option"
        type="button"
        :aria-pressed="mode === option"
        :class="`${buttonClass} aria-pressed:border-brand-600 aria-pressed:bg-brand-600 aria-pressed:text-white`"
        @click="mode = option"
      >
        {{ option === 'admin' ? 'Administrator' : 'Viewer' }}
      </button>
    </div>
    <BuilderWorkspace
      :key="mode"
      :mode="mode"
      :context="context"
      :theme="theme"
    />
  </div>
</template>
