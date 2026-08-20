<script setup>
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const route = useRoute();

const layouts = {
  DefaultLayout,
  AuthLayout,
};

const layout = computed(
  () => layouts[route.meta.layout] ?? null,
);

watchEffect(() => {
  const themeColor = route.path.startsWith('/payment/qr')
    ? '#22262a'
    : route.path === '/login'
      ? '#f0f8de'
      : '#f5f7f2';

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
