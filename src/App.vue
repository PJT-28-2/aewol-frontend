<script setup>
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '@/stores/theme';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const route = useRoute();
const themeStore = useThemeStore();

const layouts = {
  DefaultLayout,
  AuthLayout,
};

const layout = computed(
  () => layouts[route.meta.layout] ?? null,
);

watchEffect(() => {
  if (!themeStore.theme) return;
  const styles = getComputedStyle(document.documentElement);
  const themeColor = route.path.startsWith('/payment/qr')
    ? styles.getPropertyValue('--color-brand-dark').trim()
    : route.path === '/login'
      ? styles.getPropertyValue('--color-leaf-soft').trim()
      : styles.getPropertyValue('--color-app-bg').trim();

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
});
</script>

<template>
  <component
    :is="layout"
    v-if="layout"
  />
  <router-view v-else />
</template>
