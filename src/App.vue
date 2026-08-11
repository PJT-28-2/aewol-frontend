<script setup>
import { computed } from 'vue';
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
</script>

<template>
  <component
    :is="layout"
    v-if="layout"
  />
  <router-view v-else />
</template>
