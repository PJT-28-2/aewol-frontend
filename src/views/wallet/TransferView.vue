<script setup>
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
// TODO: 이체 대상 선택 및 금액 입력 구현
</script>

<template>
  <div class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-screen">
    <header class="flex items-center gap-(--space-4) mb-(--space-5)">
      <router-link
        to="/wallet"
        aria-label="뒤로 가기"
        class="text-(color:--color-navy)"
      >
        <IconArrowLeft size="24" />
      </router-link>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy)">
        이체
      </h1>
    </header>

    <p class="text-(color:--color-gray-500)">
      이체 화면 준비 중입니다.
    </p>
  </div>
</template>
