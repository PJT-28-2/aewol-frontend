<script setup>
import { computed, onMounted, ref } from 'vue'
import AewolLogo from '@/components/common/AewolLogo.vue'
import AppButton from '@/components/common/AppButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconNotificationBell from '@/components/common/icons/IconNotificationBell.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useMemberStore } from '@/stores/member'
import { usePetStore } from '@/stores/pet'
import dogHero from '@/assets/images/pet-poodle-home-mascot-v2.png'
import catHero from '@/assets/images/pet-siamese-home-mascot-v2.png'

const memberStore = useMemberStore()
const petStore = usePetStore()
const dashboardStore = useDashboardStore()
const isLoading = ref(true)
const loadError = ref(false)
const today = new Date()
const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

const primaryPet = computed(() =>
  petStore.pets.find((pet) => pet.id === petStore.representativePetId)
    ?? petStore.pets[0]
    ?? null,
)
const petName = computed(() => primaryPet.value?.name || '포리')
const memberName = computed(() => memberStore.profile?.name || '회원')
// AI로 만든 전신 캐릭터가 있으면 그것을 쓴다. 이 이미지는 홈 화면 히어로 용도로
// 생성된 것이다(prompts/pet-character-fullbody.txt). 아직 만들지 않았거나 생성에
// 실패한 반려동물은 종별 기본 마스코트로 대체한다.
const defaultHero = computed(() => (primaryPet.value?.species === 'CAT' ? catHero : dogHero))
const heroImage = computed(() => primaryPet.value?.characterImg || defaultHero.value)
const formattedBalance = computed(() =>
  Number(dashboardStore.summary?.walletBalance ?? 0).toLocaleString('ko-KR'),
)
const monthlyExpense = computed(() => Number(dashboardStore.summary?.monthlySpend?.totalAmount ?? 0))
const changeRate = computed(() => Number(dashboardStore.summary?.monthlySpend?.changeRate ?? 0))
const changeLabel = computed(() => {
  if (changeRate.value === 0) return '전월과 동일'
  return `전월보다 ${Math.abs(changeRate.value)}% ${changeRate.value > 0 ? '↑' : '↓'}`
})

async function fetchHome() {
  isLoading.value = true
  loadError.value = false

  try {
    const [, , summaryResult] = await Promise.allSettled([
      memberStore.profile ? Promise.resolve() : memberStore.fetchProfile(),
      petStore.pets.length ? Promise.resolve() : petStore.fetchPets(),
      dashboardStore.fetchSummary({ month: currentPeriod }),
    ])
    loadError.value = summaryResult.status === 'rejected'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchHome)
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) px-(--space-5) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-8))]">
    <LoadingSpinner
      v-if="isLoading"
      class="py-(--space-10)"
    />

    <section
      v-else-if="loadError"
      class="flex flex-col items-center gap-(--space-4) py-(--space-10) text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        홈 정보를 불러오지 못했어요.
      </p>
      <AppButton
        variant="secondary"
        size="sm"
        @click="fetchHome"
      >
        다시 시도
      </AppButton>
    </section>

    <template v-else>
      <header>
        <div class="flex h-[42px] items-center justify-between">
          <AewolLogo size="18" />
          <router-link
            to="/notifications"
            class="flex size-[42px] items-center justify-center text-(color:--color-navy)"
            aria-label="알림함"
          >
            <IconNotificationBell size="22" />
          </router-link>
        </div>
        <h1 class="mt-(--space-3) text-(length:--font-lg) font-bold text-(color:--color-navy)">
          안녕하세요, {{ memberName }}님
        </h1>
      </header>

      <section
        class="relative mt-(--space-4) flex h-[286px] items-end justify-center overflow-hidden rounded-[30px] bg-(--color-leaf-soft)"
        :aria-label="`${petName} 대표 이미지`"
      >
        <div class="absolute top-(--space-4) left-(--space-4)">
          <p class="text-(length:--font-xs) font-semibold text-(color:--color-leaf-dark)">
            MY PET
          </p>
          <p class="mt-[2px] text-(length:--font-xl) font-bold text-(color:--color-navy)">
            {{ petName }}
          </p>
        </div>
        <div class="absolute bottom-[15px] h-[62px] w-[258px] rounded-[50%] bg-[color-mix(in_srgb,var(--color-leaf)_66%,white)]" />
        <img
          :src="heroImage"
          :alt="`${petName} 캐릭터`"
          class="relative z-1 h-[254px] w-full object-contain object-bottom"
        >
      </section>

      <section class="relative z-2 -mt-(--space-1) rounded-[28px] bg-(--color-white) p-(--space-6) shadow-(--shadow-card)">
        <div class="flex items-start justify-between gap-(--space-4)">
          <div>
            <p class="text-(length:--font-sm) font-medium text-(color:--color-slate-muted)">
              {{ memberName }}님의 애월지갑
            </p>
            <router-link
              to="/wallet"
              class="mt-(--space-2) block text-[30px] font-bold tracking-[-0.03em] text-(color:--color-navy) no-underline"
            >
              {{ formattedBalance }}원
            </router-link>
          </div>
        </div>

        <div class="mt-(--space-5) grid grid-cols-3 divide-x divide-(--color-card-border)">
          <router-link
            to="/wallet/charge"
            class="py-(--space-2) text-center text-(length:--font-sm) font-medium text-(color:--color-slate-dark) no-underline"
          >
            충전
          </router-link>
          <router-link
            to="/payment/qr"
            class="py-(--space-2) text-center text-(length:--font-sm) font-bold text-(color:--color-navy) no-underline"
          >
            QR 결제
          </router-link>
          <router-link
            to="/wallet/history"
            class="py-(--space-2) text-center text-(length:--font-sm) font-medium text-(color:--color-slate-dark) no-underline"
          >
            조회
          </router-link>
        </div>
      </section>

      <router-link
        to="/dashboard"
        class="mt-(--space-5) flex items-center justify-between rounded-[22px] bg-(--color-white) p-(--space-5) text-inherit no-underline"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-(--space-2)">
            <p class="text-(length:--font-xs) font-medium text-(color:--color-slate-muted)">
              이번 달 총지출
            </p>
            <span class="shrink-0 rounded-full bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)">{{ changeLabel }}</span>
          </div>
          <p class="mt-(--space-2) text-(length:--font-xl) font-bold text-(color:--color-navy)">
            {{ monthlyExpense.toLocaleString('ko-KR') }}원을 사용했어요
          </p>
        </div>
      </router-link>
    </template>
  </div>
</template>
