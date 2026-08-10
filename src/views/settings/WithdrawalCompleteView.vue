<script setup>
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue'
</script>

<template>
  <CompletionPageLayout
    title="회원 탈퇴 완료"
    description="그동안 애월과 함께해주셔서 감사해요"
    variant="cancel"
  >
    <template #action>
      <router-link
        class="flex h-(--control-height-lg) w-full items-center justify-center bg-(--color-leaf) text-(length:--font-base) font-bold text-(color:--color-navy)"
        to="/login"
      >
        로그인 화면으로
      </router-link>
    </template>
  </CompletionPageLayout>
</template>
