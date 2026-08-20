<script setup>
import AewolLogo from '@/components/common/AewolLogo.vue'
</script>

<template>
  <div class="flex min-h-svh flex-col bg-(--color-app-bg)">
    <header class="flex flex-col items-center bg-(--color-leaf-soft) px-(--space-5) pt-[calc(var(--space-10)+env(safe-area-inset-top,0px))] pb-(--space-7)">
      <AewolLogo size="30" />
      <p class="mt-(--space-2) text-(length:--font-sm) font-medium text-(color:--color-slate-dark)">
        반려동물과 금융을 잇는 지갑
      </p>
    </header>

    <main class="mx-auto flex w-full max-w-(--layout-max-width) flex-1 flex-col px-(--space-5) py-(--space-7)">
      <router-view />
    </main>
  </div>
</template>
