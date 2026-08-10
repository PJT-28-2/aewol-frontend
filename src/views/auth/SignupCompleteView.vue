<script setup>
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue'
</script>

<template>
  <CompletionPageLayout
    title="회원가입 완료"
    description="애월 회원이 되신 것을 환영해요"
  >
    <template #action>
      <router-link
        class="flex h-(--control-height-lg) w-full items-center justify-center bg-(--color-leaf) text-(length:--font-base) font-bold text-(color:--color-navy)"
        to="/login"
      >
        로그인하러 가기
      </router-link>
    </template>
  </CompletionPageLayout>
</template>
