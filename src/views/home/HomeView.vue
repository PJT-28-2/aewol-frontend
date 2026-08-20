<script setup>
import { computed, onMounted, ref } from 'vue'
import AewolLogo from '@/components/common/AewolLogo.vue'
import AppButton from '@/components/common/AppButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconNotificationBell from '@/components/common/icons/IconNotificationBell.vue'
import ExpenseDonutChart from '@/components/dashboard/ExpenseDonutChart.vue'
import { groupPurchaseApi } from '@/api/groupPurchase'
import { supportProgramsApi } from '@/api/supportPrograms'
import { useDashboardStore } from '@/stores/dashboard'
import { useMemberStore } from '@/stores/member'
import { usePetStore } from '@/stores/pet'
import { useNotificationStore } from '@/stores/notification'
import {
  changeRateText,
  discountPercent,
  followUpCopy,
  formatWon,
  projectMonthEnd,
  remainingDays,
  spendingFollowUps,
  toInsightCategories,
  withChartColors,
  withPercentages,
} from '@/utils/homeMonthlyInsight'
import dogHero from '@/assets/images/pet-dog-default-home-v3.png'
import catHero from '@/assets/images/pet-cat-default-home-v3.png'

const memberStore = useMemberStore()
const petStore = usePetStore()
const dashboardStore = useDashboardStore()
const notificationStore = useNotificationStore()
const isLoading = ref(true)
const loadError = ref(false)
const chartItems = ref([])
const followUps = ref([])
const recommendedPurchases = ref([])
const eligiblePrograms = ref([])
const gpSlideIndex = ref(0)
const isInsightsLoading = ref(true)
const today = new Date()
const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

const primaryPet = computed(() =>
  petStore.pets.find((pet) => pet.id === petStore.representativePetId)
    ?? petStore.pets[0]
    ?? null,
)
const petName = computed(() => primaryPet.value?.name || '반려동물')
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
const rateLabel = computed(() => changeRateText(changeRate.value))
const topCategory = computed(() => chartItems.value[0] ?? null)
const hasInsight = computed(() => monthlyExpense.value > 0 && chartItems.value.length > 0)
const projectionAmount = computed(() => projectMonthEnd(monthlyExpense.value, today))
const daysLeft = remainingDays(today)
const insightCta = { to: '/wallet/history', label: '내역 보기' }
const currentPurchase = computed(() => recommendedPurchases.value[gpSlideIndex.value] ?? null)
const currentDiscount = computed(() => {
  const gp = currentPurchase.value
  if (!gp) return null
  if (gp.badgeText) return gp.badgeText
  const percent = discountPercent(gp.unitPrice, gp.groupPrice)
  return percent != null ? `${percent}% 할인` : null
})
const supportCopy = computed(() => {
  const followUp = followUps.value.find((item) => item.type === 'SUPPORT')
  if (!followUp || !eligiblePrograms.value.length) return null
  return followUpCopy(followUp, {
    petName: petName.value,
    programCount: eligiblePrograms.value.length,
    programTitle: eligiblePrograms.value[0]?.title,
  })
})

function copyFor(followUp) {
  if (followUp.type === 'SUPPORT') return supportCopy.value
  return followUpCopy(followUp)
}

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

  fetchMonthlyInsight()
}

let insightRequestId = 0

async function fetchMonthlyInsight() {
  const requestId = ++insightRequestId
  isInsightsLoading.value = true
  followUps.value = []
  recommendedPurchases.value = []
  eligiblePrograms.value = []
  gpSlideIndex.value = 0

  try {
    if (monthlyExpense.value <= 0) {
      chartItems.value = []
      return
    }

    await dashboardStore.fetchCategory({
      groupBy: 'CATEGORY',
      yearMonth: currentPeriod,
    })
    if (requestId !== insightRequestId) return

    const items = withChartColors(
      withPercentages(toInsightCategories(dashboardStore.category?.items ?? [])),
    )
    chartItems.value = items.slice(0, 4)
    followUps.value = spendingFollowUps(items)

    const gpFollowUp = followUps.value.find((item) => item.type === 'GROUP_PURCHASE')
    if (gpFollowUp) {
      try {
        const { data } = await groupPurchaseApi.getList({
          page: 0,
          size: 5,
          category: gpFollowUp.gpCategory,
          status: 'OPEN',
        })
        if (requestId !== insightRequestId) return
        recommendedPurchases.value = data.result?.items ?? []
      } catch (error) {
        console.error('[home] 공동구매 추천을 불러오지 못했습니다.', error)
      }
    }

    if (followUps.value.some((item) => item.type === 'SUPPORT')) {
      try {
        const { data } = await supportProgramsApi.getMatchedPrograms(primaryPet.value?.id)
        if (requestId !== insightRequestId) return
        eligiblePrograms.value = (data.result?.programs ?? []).filter(
          (program) => program.eligible && !program.applied,
        )
      } catch (error) {
        console.error('[home] 정책 지원을 불러오지 못했습니다.', error)
      }
    }
  } catch (error) {
    if (requestId !== insightRequestId) return
    console.error('[home] 이번 달 인사이트를 불러오지 못했습니다.', error)
    chartItems.value = []
    followUps.value = []
  } finally {
    if (requestId === insightRequestId) isInsightsLoading.value = false
  }
}

onMounted(() => {
  fetchHome()
  notificationStore.fetchUnreadCount()
})
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
            class="relative flex size-[42px] items-center justify-center text-(color:--color-navy)"
            aria-label="알림함"
          >
            <IconNotificationBell size="22" />
            <span
              v-if="notificationStore.unreadCount"
              class="absolute top-0 right-0 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-(--color-danger-strong) px-[4px] text-[10px] font-bold leading-none text-(color:--color-white)"
              aria-label="읽지 않은 알림 수"
            >{{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}</span>
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
        <div class="absolute bottom-[15px] h-[62px] w-[258px] rounded-[50%] bg-[color-mix(in_srgb,var(--color-leaf)_66%,var(--color-white))]" />
        <img
          :src="heroImage"
          :alt="`${petName} 캐릭터`"
          class="relative z-1 h-[274px] w-full object-contain object-bottom"
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

      <section
        v-if="isInsightsLoading || hasInsight"
        class="mt-(--space-5)"
        aria-labelledby="home-insight-title"
      >
        <h2
          id="home-insight-title"
          class="m-0 text-(length:--font-xs) font-medium text-(color:--color-slate-muted)"
        >
          이번 달 인사이트
        </h2>

        <div
          v-if="isInsightsLoading"
          class="mt-(--space-3) h-[360px] animate-pulse rounded-[24px] bg-(--color-white)"
          aria-hidden="true"
        />

        <article
          v-else
          class="mt-(--space-3) rounded-[24px] bg-(--color-white) p-(--space-5) shadow-(--shadow-card)"
        >
          <p class="m-0 text-(length:--font-sm) font-bold text-(color:--color-navy)">
            이번 달 총지출
          </p>
          <p class="mt-(--space-1) text-(length:--font-xl) font-bold tracking-[-0.03em] text-(color:--color-navy)">
            {{ formatWon(monthlyExpense) }}원을 사용했어요
          </p>

          <div class="mt-(--space-5) flex items-center gap-(--space-5)">
            <div class="relative grid size-[132px] shrink-0 place-items-center">
              <ExpenseDonutChart
                :items="chartItems"
                size="132px"
              />
              <div
                v-if="topCategory"
                class="pointer-events-none absolute flex flex-col items-center text-center"
              >
                <p class="m-0 text-[22px] font-bold leading-none text-(color:--color-navy)">
                  {{ topCategory.percentage }}%
                </p>
                <p class="mt-[4px] m-0 text-(length:--font-xs) text-(color:--color-slate-muted)">
                  {{ topCategory.label }}
                </p>
              </div>
            </div>

            <ul class="m-0 min-w-0 flex-1 list-none space-y-(--space-3) p-0">
              <li
                v-for="item in chartItems"
                :key="item.key"
                class="flex items-center justify-between gap-(--space-2)"
              >
                <span class="flex min-w-0 items-center gap-(--space-2)">
                  <span
                    class="size-[8px] shrink-0 rounded-full"
                    :style="{ backgroundColor: `var(${item.colorToken})` }"
                  />
                  <span class="truncate text-(length:--font-sm) text-(color:--color-navy)">{{ item.label }}</span>
                </span>
                <span class="shrink-0 text-(length:--font-sm) font-bold text-(color:--color-navy)">{{ item.percentage }}%</span>
              </li>
            </ul>
          </div>

          <p
            v-if="topCategory"
            class="mt-(--space-5) mb-0 text-(length:--font-sm) leading-[1.65] break-keep text-(color:--color-slate-dark)"
          >
            {{ topCategory.label }}가
            <span class="font-bold text-(color:--color-leaf-dark)">{{ topCategory.percentage }}%</span>({{ formatWon(topCategory.amount) }}원)로 가장 크고,
            <template v-if="rateLabel">
              전월 대비
              <span class="font-bold text-(color:--color-leaf-dark)">{{ rateLabel }}</span>예요.
            </template>
            <template v-else>전월과 같아요.</template>
            내역에서 항목별로 확인해 보세요.
          </p>

          <p
            v-if="projectionAmount != null"
            class="mt-(--space-4) mb-0 rounded-[14px] bg-(--color-leaf-soft) px-(--space-4) py-(--space-3) text-(length:--font-sm) leading-[1.5] break-keep text-(color:--color-navy)"
          >
            <span class="font-bold">전망</span>
            · 이 속도면 이달 말 약 {{ formatWon(projectionAmount) }}원 (남은 {{ daysLeft }}일)
          </p>

          <router-link
            :to="insightCta.to"
            class="mt-(--space-4) block text-right text-(length:--font-sm) font-bold text-(color:--color-leaf-dark) no-underline"
          >
            {{ insightCta.label }} &gt;
          </router-link>
        </article>

        <template
          v-for="followUp in followUps"
          :key="followUp.type"
        >
          <section
            v-if="followUp.type === 'GROUP_PURCHASE' && currentPurchase"
            class="mt-(--space-6)"
            :aria-label="copyFor(followUp)?.title"
          >
            <h3 class="m-0 text-(length:--font-xs) font-medium text-(color:--color-slate-muted)">
              {{ copyFor(followUp).title }}
            </h3>
            <router-link
              :to="`/group-purchase/${currentPurchase.id}`"
              class="mt-(--space-3) block rounded-[22px] border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-inherit no-underline"
            >
              <div class="flex items-start justify-between gap-(--space-3)">
                <div class="min-w-0">
                  <p class="m-0 text-(length:--font-md) font-bold text-(color:--color-navy)">
                    {{ currentPurchase.productName }}
                  </p>
                  <p class="mt-(--space-1) mb-0 text-(length:--font-xs) text-(color:--color-slate-muted)">
                    {{ currentPurchase.currentQuantity }}/{{ currentPurchase.targetQuantity }}개 참여 · {{ currentPurchase.dDay }}
                  </p>
                  <p class="mt-(--space-2) mb-0 flex items-baseline gap-(--space-2)">
                    <span class="text-(length:--font-lg) font-bold text-(color:--color-navy)">{{ formatWon(currentPurchase.groupPrice) }}원</span>
                    <span
                      v-if="currentPurchase.unitPrice"
                      class="text-(length:--font-sm) text-(color:--color-slate-muted) line-through"
                    >{{ formatWon(currentPurchase.unitPrice) }}원</span>
                  </p>
                </div>
                <span
                  v-if="currentDiscount"
                  class="shrink-0 rounded-full bg-(--color-pastel-cream) px-(--space-3) py-(--space-1) text-(length:--font-xs) font-bold text-(color:--color-gold-dark)"
                >
                  {{ currentDiscount }}
                </span>
              </div>
            </router-link>
            <div
              v-if="recommendedPurchases.length > 1"
              class="mt-(--space-3) flex justify-center gap-(--space-2)"
            >
              <button
                v-for="(_, index) in recommendedPurchases"
                :key="index"
                type="button"
                class="h-[8px] rounded-full border-0 p-0"
                :class="index === gpSlideIndex ? 'w-[18px] bg-(--color-leaf)' : 'w-[8px] bg-(--color-slate-light)'"
                :aria-label="`${index + 1}번째 추천`"
                :aria-pressed="index === gpSlideIndex"
                @click="gpSlideIndex = index"
              />
            </div>
          </section>

          <article
            v-else-if="followUp.type !== 'GROUP_PURCHASE' && copyFor(followUp)"
            class="mt-(--space-6) rounded-[22px] border border-(--color-card-border) bg-(--color-white) p-(--space-4)"
          >
            <h3 class="m-0 text-(length:--font-xs) font-medium text-(color:--color-slate-muted)">
              {{ copyFor(followUp).title }}
            </h3>
            <p class="mt-(--space-3) mb-0 text-(length:--font-sm) leading-[1.65] break-keep text-(color:--color-slate-dark)">
              {{ copyFor(followUp).body }}
            </p>
            <router-link
              :to="copyFor(followUp).ctaPath"
              class="mt-(--space-3) block text-right text-(length:--font-sm) font-bold text-(color:--color-leaf-dark) no-underline"
            >
              {{ copyFor(followUp).ctaLabel }} &gt;
            </router-link>
          </article>
        </template>
      </section>
    </template>
  </div>
</template>
