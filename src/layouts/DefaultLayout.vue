<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <PageHeader
      v-if="!route.meta.hideHeader"
      :title="route.meta.title || ''"
      :show-back="!!route.meta.showBack"
    />

    <main
      class="flex-1 pb-(--bottom-nav-height)"
      :class="route.meta.hideHeader ? '' : 'pt-(--header-height)'"
    >
      <router-view />
    </main>

    <BottomNavBar />
  </div>
</template>
