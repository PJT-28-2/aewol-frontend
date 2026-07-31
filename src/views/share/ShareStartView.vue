<script setup>
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import IconFamily from '@/components/common/icons/IconFamily.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'

const router = useRouter()
</script>

<template>
  <main
    class="mx-auto min-h-dvh w-full max-w-[var(--mobile-content-width)] box-border bg-(--color-white) px-[var(--space-5)] py-[calc(var(--header-height)+var(--space-8))] text-(--color-navy)"
  >
    <h1 class="m-0 text-[length:var(--font-2xl)] font-bold">
      애월 시작하기
    </h1>
    <p
      class="mb-[var(--space-8)] mt-[var(--space-1)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
    >
      애월을 시작해보세요!
    </p>

    <AppButton
      class="mb-[var(--space-6)] !h-[calc(var(--space-10)*3)] !rounded-[var(--radius-xl)] !border !border-(--color-border) !px-[var(--space-4)] !py-[var(--space-7)] transition-shadow hover:shadow-(--shadow-md)"
      block
      variant="ghost"
      @click="router.push('/pets/register')"
    >
      <span class="flex flex-col items-center">
        <span
          class="mb-[var(--space-4)] grid size-[var(--share-choice-icon-size)] place-items-center rounded-[var(--radius-xl)] bg-(--color-info-surface)"
        >
          <IconPaw :size="32" />
        </span>
        <strong class="text-[length:var(--font-base)]">새로운 반려동물 등록</strong>
        <small
          class="mt-[var(--space-1)] text-[length:var(--font-sm)] font-normal text-(--color-slate-muted)"
        >
          첫 반려동물을 등록하고 애월을 시작해보세요
        </small>
      </span>
    </AppButton>

    <AppButton
      class="!h-[calc(var(--space-10)*3)] !rounded-[var(--radius-xl)] !border !border-(--color-border) !px-[var(--space-4)] !py-[var(--space-7)] transition-shadow hover:shadow-(--shadow-md)"
      block
      variant="ghost"
      @click="router.push('/share/join')"
    >
      <span class="flex flex-col items-center">
        <span
          class="mb-[var(--space-4)] grid size-[var(--share-choice-icon-size)] place-items-center rounded-[var(--radius-xl)] bg-(--color-gold-surface) text-(--color-gold-dark)"
        >
          <IconFamily :size="32" />
        </span>
        <strong class="text-[length:var(--font-base)]">초대 링크로 참여</strong>
        <small
          class="mt-[var(--space-1)] text-[length:var(--font-sm)] font-normal text-(--color-slate-muted)"
        >
          가족이나 친구로부터 받은 초대 링크를 입력해보세요
        </small>
      </span>
    </AppButton>
  </main>
</template>
