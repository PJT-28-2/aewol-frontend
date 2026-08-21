<script setup>
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconStats from '@/components/common/icons/IconStats.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'

const router = useRouter()

const simulatorMenu = {
  to: '/insurance/simulator',
  title: '손익분기 시뮬레이터',
  description: '가입이 유리한지 미리 계산해보세요',
}

const claimMenu = {
  to: '/insurance/claim',
  icon: IconDocument,
  title: '청구 서류 작성',
  description: '영수증으로 청구서 초안을 만들어보세요',
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) px-(--space-4) pt-(--space-3) pb-(--space-7)">
    <header class="mb-(--space-4)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        보험
      </h1>
    </header>

    <!-- 대표 기능: 손익분기 시뮬레이터 -->
    <article class="relative mb-(--space-5) overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
      <div class="relative min-h-[154px] overflow-hidden rounded-(--radius-xl) bg-(--color-leaf-soft) px-(--space-4) pt-(--space-4) pr-[132px]">
        <span class="inline-flex rounded-(--radius-full) bg-(--color-leaf-surface) px-(--space-3) py-[5px] text-[11px] font-semibold text-(--color-leaf-dark)">
          가입 판단
        </span>
        <h2 class="mt-(--space-3) text-(length:--font-xl) leading-[1.35] font-bold text-(color:--color-navy)">
          우리 아이 보험,<br>가입이 유리할까요?
        </h2>
        <p class="mt-(--space-2) text-(length:--font-sm) text-(color:--color-slate-dark)">
          예상 비용을 미리 비교해보세요
        </p>
        <FeatureIconTile
          class="absolute right-(--space-4) top-[25px]"
          :icon="IconStats"
          tone="blue"
        />
      </div>
      <AppButton
        variant="primary"
        size="lg"
        block
        class="mt-(--space-3) !rounded-(--radius-lg)"
        @click="router.push(simulatorMenu.to)"
      >
        보험이 유리한지 계산하기
      </AppButton>
    </article>

    <!-- 보험금 청구 -->
    <section>
      <h2 class="mb-(--space-3) px-(--space-1) text-(length:--font-lg) font-bold text-(color:--color-gray-900)">
        보험금 청구
      </h2>
      <router-link
        :to="claimMenu.to"
        class="flex items-center gap-(--space-4) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-inherit no-underline active:bg-(--color-gray-100)"
      >
        <FeatureIconTile
          :icon="claimMenu.icon"
          tone="pink"
        />
        <div class="min-w-0 flex-1">
          <h3 class="text-(length:--font-base) font-semibold text-(color:--color-navy)">
            {{ claimMenu.title }}
          </h3>
          <p class="mt-(--space-1) text-(length:--font-sm) leading-[1.45] text-(color:--color-slate-muted)">
            {{ claimMenu.description }}
          </p>
        </div>
        <IconChevronRight
          size="18"
          color="var(--color-gray-400)"
          class="shrink-0"
        />
      </router-link>
      <div
        class="mt-(--space-3) flex items-center justify-center gap-(--space-2) text-[11px] text-(color:--color-slate-muted)"
      >
        <span>영수증 등록</span>
        <span class="text-(color:--color-gray-300)">•</span>
        <span>정보 확인</span>
        <span class="text-(color:--color-gray-300)">•</span>
        <span>청구서 초안 완성</span>
      </div>
    </section>
  </div>
</template>
