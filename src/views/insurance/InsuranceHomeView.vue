<script setup>
import { useRouter } from 'vue-router'
import IconClaimDraft from '@/components/common/icons/IconClaimDraft.vue'
import AppButton from '@/components/common/AppButton.vue'
import simulatorImage from '@/assets/images/pet-insurance-simulator.png'

const router = useRouter()

const simulatorMenu = {
  to: '/insurance/simulator',
  title: '손익분기 시뮬레이터',
  description: '가입이 유리한지 미리 계산해보세요',
}

const menus = [
  {
    to: '/insurance/claim',
    icon: IconClaimDraft,
    bg: 'var(--color-pastel-blue)',
    title: '보험금 청구 서류 작성',
    description: '영수증으로 청구서 초안을 만들어보세요',
  },
]
</script>

<template>
  <div class="min-h-screen bg-(--color-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))]">
    <header class="mb-(--space-6)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        보험
      </h1>
      <p class="mt-(--space-2) text-(length:--font-md) text-(color:--color-slate-muted)">
        필요한 메뉴를 선택하세요
      </p>
    </header>

    <div class="mb-(--space-4) rounded-(--radius-xl) bg-(--color-white) p-(--space-5) text-center shadow-(--shadow-md)">
      <h3 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        {{ simulatorMenu.title }}
      </h3>
      <p class="mt-(--space-2) text-(length:--font-base) text-(color:--color-slate-muted)">
        {{ simulatorMenu.description }}
      </p>
      <img
        :src="simulatorImage"
        alt=""
        class="mx-auto my-(--space-5) w-[192px]"
      >
      <AppButton
        variant="navy"
        size="lg"
        pill
        block
        @click="router.push(simulatorMenu.to)"
      >
        결과 계산하러 가기
      </AppButton>
    </div>

    <ul class="flex flex-col gap-(--space-4)">
      <li
        v-for="menu in menus"
        :key="menu.to"
      >
        <router-link
          :to="menu.to"
          class="relative flex items-center justify-between overflow-hidden rounded-(--radius-xl) bg-(--color-white) p-(--space-5) shadow-(--shadow-md) no-underline"
        >
          <div class="flex-1 pr-(--space-3)">
            <h3 class="text-(length:--font-lg) font-bold text-(color:--color-navy)">
              {{ menu.title }}
            </h3>
            <p class="mt-(--space-2) text-(length:--font-sm) text-(color:--color-slate-muted)">
              {{ menu.description }}
            </p>
          </div>
          <span
            class="flex h-(--space-10) w-(--space-10) shrink-0 items-center justify-center rounded-(--radius-full)"
            :style="{ backgroundColor: menu.bg }"
          >
            <component
              :is="menu.icon"
              size="32"
              color="var(--color-navy)"
            />
          </span>
        </router-link>
      </li>
    </ul>
  </div>
</template>
