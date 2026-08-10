<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import IconFamilyCare from '@/components/common/icons/IconFamilyCare.vue'
import IconPetFace from '@/components/common/icons/IconPetFace.vue'

const route = useRoute()
const router = useRouter()
// 로그인 직후 첫 진입 때는 뒤로 갈 화면이 없어 뒤로가기를 숨기고,
// 함께돌보기의 "+" 버튼처럼 앱 안에서 들어온 경우에만 뒤로가기를 보여준다.
const showBackButton = computed(() => route.query.from === 'share')
</script>

<template>
  <PageHeader
    v-if="showBackButton"
    show-back
  />

  <main
    class="mx-auto min-h-dvh w-full max-w-(--content-max-width) box-border bg-(--color-app-bg) px-[var(--space-5)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
    :class="showBackButton ? 'pt-(--header-height)' : 'pt-[var(--space-8)]'"
  >
    <div
      v-if="!showBackButton"
      class="flex justify-end"
    >
      <button
        class="text-(length:--font-sm) text-(--color-slate-muted)"
        type="button"
        @click="router.push('/home')"
      >
        다음에 하기
      </button>
    </div>

    <h1 class="m-0 mt-[var(--space-4)] text-(length:--font-2xl) font-bold text-(--color-navy)">
      애월 시작하기
    </h1>
    <p
      class="mb-[var(--space-8)] mt-[var(--space-1)] text-(length:--font-md) text-(--color-slate-muted)"
    >
      새 반려동물을 등록하거나 초대링크로 참여해보세요
    </p>

    <AppButton
      class="mb-[var(--space-6)] !h-[calc(var(--space-10)*3)] !rounded-[var(--radius-xl)] !border !border-(--color-border) !px-[var(--space-4)] !py-[var(--space-7)]"
      block
      variant="ghost"
      @click="router.push('/pets/register')"
    >
      <span class="flex flex-col items-center">
        <FeatureIconTile
          class="mb-[var(--space-3)]"
          :icon="IconPetFace"
          tone="green"
        />
        <strong class="text-(length:--font-base) font-semibold text-(--color-navy)">새로운 반려동물 등록</strong>
        <small
          class="mt-[var(--space-1)] text-(length:--font-sm) font-normal text-(--color-slate-muted)"
        >
          첫 반려동물을 등록하고 애월을 시작해보세요
        </small>
      </span>
    </AppButton>

    <AppButton
      class="!h-[calc(var(--space-10)*3)] !rounded-[var(--radius-xl)] !border !border-(--color-border) !px-[var(--space-4)] !py-[var(--space-7)]"
      block
      variant="ghost"
      @click="router.push('/share/join')"
    >
      <span class="flex flex-col items-center">
        <FeatureIconTile
          class="mb-[var(--space-3)]"
          :icon="IconFamilyCare"
          tone="blue"
        />
        <strong class="text-(length:--font-base) font-semibold text-(--color-navy)">초대 링크로 참여</strong>
        <small
          class="mt-[var(--space-1)] text-(length:--font-sm) font-normal text-(--color-slate-muted)"
        >
          가족이나 친구로부터 받은 초대 링크를 입력해보세요
        </small>
      </span>
    </AppButton>
  </main>
</template>
