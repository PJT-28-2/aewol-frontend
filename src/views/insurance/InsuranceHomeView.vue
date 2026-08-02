<script setup>
import IconCalculator from '@/components/common/icons/IconCalculator.vue'
import IconClaimDraft from '@/components/common/icons/IconClaimDraft.vue'

const menus = [
  {
    to: '/insurance/simulator',
    icon: IconCalculator,
    bg: 'var(--color-pastel-cream)',
    title: '손익분기 시뮬레이터',
    description: '가입이 유리한지 미리 계산해보세요',
  },
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

    <ul class="flex flex-col gap-(--space-3)">
      <li
        v-for="menu in menus"
        :key="menu.to"
      >
        <router-link
          :to="menu.to"
          class="flex items-center gap-(--space-4) rounded-(--radius-xl) border border-(--color-border) bg-(--color-white) p-(--space-4) no-underline"
        >
          <span
            class="flex h-(--space-9) w-(--space-9) shrink-0 items-center justify-center rounded-[14px]"
            :style="{ backgroundColor: menu.bg }"
          >
            <component
              :is="menu.icon"
              size="24"
              color="var(--color-navy)"
            />
          </span>
          <div class="flex-1">
            <h3 class="text-(length:--font-base) font-semibold text-(color:--color-navy)">
              {{ menu.title }}
            </h3>
            <p class="mt-(--space-1) text-(length:--font-sm) text-(color:--color-slate-muted)">
              {{ menu.description }}
            </p>
          </div>
          <span class="text-(length:--font-xl) text-(color:--color-gray-400)">&rsaquo;</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>
