<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div
    class="flex min-h-svh flex-col"
    :class="route.path.startsWith('/payment/qr') ? 'bg-(--color-brand-dark)' : 'bg-(--color-app-bg)'"
  >
    <PageHeader
      v-if="!route.meta.hideHeader"
      :title="route.meta.title || ''"
      :show-back="!!route.meta.showBack"
    />
    <!-- hideHeader 화면은 고정 헤더가 없어서, 스크롤하면 본문이 상태바 뒤로 올라간다. -->
    <div
      v-if="route.meta.hideHeader"
      class="pointer-events-none fixed inset-x-0 top-0 z-100 h-[env(safe-area-inset-top,0px)]"
      :class="route.path.startsWith('/payment/qr') ? 'bg-(--color-brand-dark)' : 'bg-(--color-app-bg)'"
      aria-hidden="true"
    />

    <main
      class="flex-1 overflow-x-clip [&>*]:min-h-[calc(100svh-var(--page-top-offset)-var(--page-bottom-offset))]"
      :class="[
        route.meta.hideBottomNav ? 'pb-0' : 'pb-[calc(var(--bottom-nav-height)+var(--space-6)+env(safe-area-inset-bottom,0px))]',
        route.meta.hideHeader
          ? 'pt-[env(safe-area-inset-top,0px)]'
          : 'pt-[calc(var(--header-height)+env(safe-area-inset-top,0px))]',
        route.path.startsWith('/payment/qr') ? 'bg-(--color-brand-dark)' : 'bg-(--color-app-bg)',
      ]"
      :style="{
        '--page-top-offset': route.meta.hideHeader
          ? 'env(safe-area-inset-top, 0px)'
          : 'calc(var(--header-height) + env(safe-area-inset-top, 0px))',
        '--page-bottom-offset': route.meta.hideBottomNav
          ? '0px'
          : 'calc(var(--bottom-nav-height) + var(--space-6) + env(safe-area-inset-bottom, 0px))',
      }"
    >
      <router-view />
    </main>

    <BottomNavBar v-if="!route.meta.hideBottomNav" />
  </div>
</template>
