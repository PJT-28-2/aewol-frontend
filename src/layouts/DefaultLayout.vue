<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div
    class="flex min-h-svh flex-col"
    :class="route.path.startsWith('/payment/qr') ? 'bg-(--color-navy)' : 'bg-(--color-app-bg)'"
  >
    <PageHeader
      v-if="!route.meta.hideHeader"
      :title="route.meta.title || ''"
      :show-back="!!route.meta.showBack"
    />

    <main
      class="flex-1"
      :class="[
        route.meta.hideBottomNav ? 'pb-0' : 'pb-[calc(var(--bottom-nav-height)+var(--space-6)+env(safe-area-inset-bottom,0px))]',
        route.meta.hideHeader ? '' : 'pt-(--header-height)',
        route.path.startsWith('/payment/qr') ? 'bg-(--color-navy)' : 'bg-(--color-app-bg)',
      ]"
    >
      <router-view />
    </main>

    <BottomNavBar v-if="!route.meta.hideBottomNav" />
  </div>
</template>
