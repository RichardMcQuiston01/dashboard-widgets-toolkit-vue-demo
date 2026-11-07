<script setup lang="ts">
import { onMounted, ref } from 'vue';

/**
 * Vue variant of the floating donate card. Pair it with donate-widget.css
 * (imported by style.css).
 */
withDefaults(
  defineProps<{
    donateUrl?: string;
    qrSrc?: string;
    /** Set false to make the card non-dismissible (not recommended). */
    dismissible?: boolean;
  }>(),
  {
    donateUrl: 'https://ko-fi.com/P1V529Z7ZP',
    qrSrc: `${import.meta.env.BASE_URL}donate.png`,
    dismissible: true,
  }
);

// Namespaced: every GitHub Pages project of one account shares an origin, so a
// plain key would be shared with (and dismissed by) the other demos.
const STORAGE_KEY = 'dashboard-widgets-toolkit-vue-demo:donate-card-dismissed';

// Start hidden and reveal after mount: reading localStorage while rendering
// breaks server rendering, and flashing the card then hiding it is worse than
// showing it a frame late.
const isVisible = ref<boolean>(false);

onMounted(() => {
  try {
    isVisible.value = window.localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    isVisible.value = true;
  }
});

function dismiss(): void {
  isVisible.value = false;
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* Non-fatal. */
  }
}
</script>

<template>
  <aside
    v-if="isVisible"
    id="donateCard"
    class="donate-card"
    aria-labelledby="donateCardTitle"
  >
    <button
      v-if="dismissible"
      class="donate-card__dismiss"
      type="button"
      aria-label="Dismiss support message"
      @click="dismiss"
    >
      &times;
    </button>

    <h2 id="donateCardTitle" class="donate-card__title">
      <span class="donate-card__heart" aria-hidden="true">&#9829;</span>
      Support this project
    </h2>

    <p class="donate-card__body">
      If this app, code, or repository has helped you or someone you know,
      please consider donating. I appreciate any help to offset the costs of
      development and/or AI Credits.
    </p>

    <div class="donate-card__qr">
      <img
        :src="qrSrc"
        alt="QR code linking to the Ko-fi donation page"
        width="180"
        height="180"
      />
    </div>

    <a
      class="donate-card__link"
      :href="donateUrl"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Support on Ko-fi, opens in a new tab"
    >
      Support on Ko-fi <span aria-hidden="true">&rarr;</span>
    </a>
  </aside>
</template>
