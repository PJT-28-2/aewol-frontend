<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="default-layout">
    <PageHeader :title="route.meta.title || ''" :show-back="!!route.meta.showBack" />

    <main class="default-layout__content">
      <router-view />
    </main>

    <BottomNavBar />
  </div>
</template>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.default-layout__content {
  flex: 1;
  padding-top: var(--header-height);
  padding-bottom: var(--bottom-nav-height);
}
</style>
