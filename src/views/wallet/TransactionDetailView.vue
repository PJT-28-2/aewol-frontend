<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const txId = computed(() => route.params.txId)

// TODO: 거래 상세 데이터 fetch 및 화면 구현
</script>

<template>
  <div class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-screen">
    <header class="flex items-center gap-(--space-4) mb-(--space-5)">
      <router-link
        to="/wallet/history"
        class="text-(length:--font-md) text-(color:--color-navy) no-underline font-medium"
      >
        &lsaquo; 거래 내역
      </router-link>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy)">
        거래 상세
      </h1>
    </header>

    <p class="text-(color:--color-gray-500)">
      거래 ID: {{ txId }}
    </p>
  </div>
</template>
