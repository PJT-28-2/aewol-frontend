<script setup>
// TODO: 충전 금액 입력 및 결제수단 연동 구현
</script>

<template>
  <div class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-screen">
    <header class="flex items-center gap-(--space-4) mb-(--space-5)">
      <router-link
        to="/wallet"
        class="text-(length:--font-md) text-(color:--color-navy) no-underline font-medium"
      >
        &lsaquo; 지갑
      </router-link>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy)">
        충전
      </h1>
    </header>

    <p class="text-(color:--color-gray-500)">
      충전 화면 준비 중입니다.
    </p>
  </div>
</template>
