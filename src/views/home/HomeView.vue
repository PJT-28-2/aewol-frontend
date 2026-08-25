<script setup>
import { computed, onMounted, ref } from 'vue'
import AewolLogo from '@/components/common/AewolLogo.vue'
import AppButton from '@/components/common/AppButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import IconNotificationBell from '@/components/common/icons/IconNotificationBell.vue'
import IconPublicSupport from '@/components/common/icons/IconPublicSupport.vue'
import IconWallet from '@/components/common/icons/IconWallet.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import IconSavings from '@/components/common/icons/IconSavings.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useMemberStore } from '@/stores/member'
import { usePetStore } from '@/stores/pet'
import { useNotificationStore } from '@/stores/notification'
import { getHomeInsights } from '@/api/insight'
import RecommendedProductCarousel from '@/components/home/RecommendedProductCarousel.vue'
import CategoryDonutChart from '@/components/home/CategoryDonutChart.vue'
import { CATEGORY_CHART_PALETTE } from '@/utils/categoryChartPalette'
import dogHero from '@/assets/images/pet-dog-default-home-v3.webp'
import catHero from '@/assets/images/pet-cat-default-home-v3.webp'
import dogHeroBackground from '@/assets/images/pet-dog-home-background-v1.webp'
import catHeroBackground from '@/assets/images/pet-cat-home-background-v1.webp'
import dogNameTag from '@/assets/images/pet-dog-name-tag-v1.webp'
import catNameTag from '@/assets/images/pet-cat-name-tag-v1.webp'

const memberStore = useMemberStore()
const petStore = usePetStore()
const dashboardStore = useDashboardStore()
const notificationStore = useNotificationStore()
const isLoading = ref(true)
const loadError = ref(false)
const insights = ref([])
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
const heroBackground = computed(() => (
  primaryPet.value?.species === 'CAT' ? catHeroBackground : dogHeroBackground
))
const nameTagImage = computed(() => (
  primaryPet.value?.species === 'CAT' ? catNameTag : dogNameTag
))
const formattedBalance = computed(() =>
  Number(dashboardStore.summary?.walletBalance ?? 0).toLocaleString('ko-KR'),
)
const monthlyExpense = computed(() => Number(dashboardStore.summary?.monthlySpend?.totalAmount ?? 0))
const formattedMonthlyExpense = computed(() => monthlyExpense.value.toLocaleString('ko-KR'))
const monthlySpendingAriaLabel = computed(
  () => `${formattedMonthlyExpense.value}원을 사용했어요`,
)
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

  // 카드는 홈의 부가 정보다. 위쪽(잔액·지출)을 먼저 그린 뒤 따로 불러와서
  // 실패하거나 느려도 홈 전체가 기다리지 않게 한다.
  fetchInsights()
}

// 카드 종류는 서버가 정한다. 모르는 종류가 와도 아이콘 없이 뜨지 않도록 기본값을 둔다.
const INSIGHT_ICONS = {
  SUPPORT: IconPublicSupport,
  SPENDING: IconWallet,
  CARE: IconPaw,
  DONATION: IconSavings,
}

const INSIGHT_ICON_TONES = {
  SUPPORT: 'bg-(--color-icon-yellow-soft) text-(color:--color-icon-yellow)',
  SPENDING: 'bg-(--color-icon-blue-soft) text-(color:--color-icon-blue)',
  CARE: 'bg-(--color-icon-pink-soft) text-(color:--color-icon-pink)',
  DONATION: 'bg-(--color-icon-purple-soft) text-(color:--color-icon-purple)',
}

function insightIcon(type) {
  const icon = INSIGHT_ICONS[type]
  if (!icon && import.meta.env.DEV) {
    // 조용히 기본 아이콘으로 대체되면 서버가 새 카드를 추가한 걸 놓치기 쉽다.
    console.warn(`[home] 아이콘이 정의되지 않은 인사이트 카드 종류: ${type}`)
  }
  return icon ?? IconPaw
}

function insightIconTone(type) {
  return INSIGHT_ICON_TONES[type]
    ?? 'bg-(--color-icon-gray-soft) text-(color:--color-icon-gray)'
}

// 다시 시도 버튼 등으로 fetchHome이 겹쳐 호출되면 늦게 보낸 요청이 먼저 끝날 수 있다.
// 마지막 요청의 결과만 반영한다.
let insightRequestId = 0

async function fetchInsights() {
  const requestId = ++insightRequestId
  isInsightsLoading.value = true
  try {
    const { data } = await getHomeInsights(primaryPet.value?.id)
    if (requestId !== insightRequestId) return
    insights.value = dedupeByType(data.result ?? [])
  } catch (error) {
    if (requestId !== insightRequestId) return
    // 카드는 부가 정보라 사용자에게 오류를 띄우지 않는다. 다만 조용히 사라지면
    // 운영 중 장애를 알 방법이 없으므로 로그는 남긴다.
    console.error('[home] 인사이트 카드를 불러오지 못했습니다.', error)
    insights.value = []
  } finally {
    if (requestId === insightRequestId) isInsightsLoading.value = false
  }
}

// 카드마다 'AI 요약'을 반복해 붙이면 라벨이 내용을 밀어낸다. 묶음에 한 번만 단다.
// fallback인 카드는 서버가 데이터로 조립한 문구라 AI가 쓴 것이 아니다. 한 장이라도
// 모델이 쓴 것이 있을 때만 배지를 붙인다.
const hasAiWrittenCard = computed(() => insights.value.some((card) => !card.fallback))

// SPENDING 인사이트 카드가 오면 그 카드가 총지출 금액까지 함께 보여주므로,
// 같은 숫자를 말하는 위쪽 '이번 달 총지출' 타일은 감춘다. 인사이트가 아직 로딩
// 중이거나 지출 카드가 없을 때(신규 유저 등)는 이 타일이 유일한 총지출 표시라 남겨둔다.
const hasSpendingInsightCard = computed(() => insights.value.some((card) => card.type === 'SPENDING'))

// 본문 문장(card.body) 안의 'N%' 부분만 다른 색으로 강조하기 위해 조각낸다.
// v-html 대신 텍스트 조각 배열로 다뤄야 서버 문구를 마크업으로 오인해 그대로
// 삽입하는 XSS 경로가 생기지 않는다.
const PERCENT_PATTERN = /([+-]?\d+(?:\.\d+)?%)/g
function splitByPercent(text) {
  if (!text) return []
  return text
    .split(PERCENT_PATTERN)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, highlight: /^[+-]?\d+(?:\.\d+)?%$/.test(part) }))
}

// 범례 점 색을 도넛 조각 색과 같은 순서로 매긴다(CategoryDonutChart와 팔레트를 공유).
function categoryChartColor(index) {
  return CATEGORY_CHART_PALETTE[index % CATEGORY_CHART_PALETTE.length]
}

// type은 서버에서 회원·카드종류별 유니크 키다. 그래도 중복이 오면 Vue key가 겹쳐
// 렌더링이 어긋나므로 먼저 온 것만 남긴다.
function dedupeByType(cards) {
  const seen = new Set()
  return cards.filter((card) => {
    if (!card?.type || seen.has(card.type)) return false
    seen.add(card.type)
    return true
  })
}

onMounted(() => {
  fetchHome()
  notificationStore.fetchUnreadCount()
})
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) px-(--space-5) pt-(--space-3) pb-(--space-8)">
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
              class="absolute top-0 right-0 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-(--color-danger-strong) px-[4px] text-[10px] font-bold leading-none text-(color:--color-contrast)"
              aria-label="읽지 않은 알림 수"
            >{{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}</span>
          </router-link>
        </div>
        <h1 class="mt-(--space-3) text-(length:--font-lg) font-bold text-(color:--color-navy)">
          안녕하세요, {{ memberName }}님
        </h1>
      </header>

      <!--
        등록된 반려동물이 없으면 기본 마스코트를 보여주는 대신 등록을 안내한다.
        기본 이미지를 그대로 쓰면 내 반려동물이 등록된 것처럼 오해할 수 있다.
      -->
      <section
        v-if="!primaryPet"
        class="mt-(--space-4) rounded-[30px] bg-(--color-white) shadow-(--shadow-card)"
      >
        <EmptyState
          :icon="IconPaw"
          message="아직 등록된 반려동물이 없어요."
          action-text="반려동물 등록하기"
          action-route="/pets/register"
        />
      </section>

      <section
        v-else
        class="relative mt-(--space-4) flex h-[324px] items-end justify-center overflow-hidden rounded-t-[30px]"
        :class="primaryPet?.species === 'CAT' ? 'bg-[#f2eae3]' : 'bg-[#f4f8d2]'"
        :aria-label="`${petName} 대표 이미지`"
      >
        <img
          :src="heroBackground"
          alt=""
          class="absolute inset-x-0 top-0 h-[calc(100%-40px)] w-full object-fill"
          aria-hidden="true"
        >
        <div
          class="absolute top-0 left-(--space-4) z-3 h-[76px]"
          :class="primaryPet?.species === 'CAT' ? 'w-[120px]' : 'w-[128px]'"
        >
          <img
            :src="nameTagImage"
            alt=""
            class="h-full w-full object-contain object-top drop-shadow-[0_3px_5px_rgba(34,38,42,0.12)]"
            aria-hidden="true"
          >
          <span
            class="absolute -translate-y-1/2 truncate text-center font-semibold tracking-[-0.005em] [font-family:var(--font-family)] [text-shadow:0_0_0.4px_currentColor]"
            :class="[
              primaryPet?.species === 'CAT'
                ? (petName.length > 5 ? 'text-[11px]' : 'text-[14px]')
                : (petName.length > 5 ? 'text-[12px]' : 'text-[16px]'),
              primaryPet?.species === 'CAT'
                ? 'text-[#3f596b]'
                : 'text-[#405d2d]',
            ]"
            :style="{
              top: primaryPet?.species === 'CAT' ? '34px' : '41px',
              left: primaryPet?.species === 'CAT' ? '0' : '18px',
              right: primaryPet?.species === 'CAT' ? '0' : '18px',
            }"
            :aria-label="`${petName} 네임택`"
          >
            {{ petName }}
          </span>
        </div>
        <img
          :src="heroImage"
          :alt="`${petName} 캐릭터`"
          class="relative z-2 mb-[40px] h-[274px] w-full object-contain object-bottom"
        >
      </section>

      <!-- 히어로가 있을 땐 카드가 살짝 겹치게(-mt) 올라오지만, 빈 상태 안내일 땐 겹치지 않고 간격을 둔다. -->
      <section
        class="relative z-2 rounded-[28px] bg-(--color-white) p-(--space-6) shadow-(--shadow-card)"
        :class="primaryPet ? '-mt-[30px]' : 'mt-(--space-5)'"
      >
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

      <!--
        SPENDING 인사이트 카드가 총지출 금액을 이미 보여주므로, 같은 숫자를 두 번
        말하지 않도록 그 카드가 없을 때만 이 타일을 보여준다.
      -->
      <router-link
        v-if="!hasSpendingInsightCard"
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
          <p
            class="mt-(--space-3) flex flex-wrap items-baseline gap-x-(--space-2) gap-y-(--space-1)"
            :aria-label="monthlySpendingAriaLabel"
            data-testid="monthly-spending-amount-summary"
          >
            <span
              aria-hidden="true"
              class="text-[28px] font-extrabold leading-none tracking-[-0.035em] text-(color:--color-navy)"
            >{{ formattedMonthlyExpense }}원</span>
            <span
              aria-hidden="true"
              class="text-(length:--font-sm) font-semibold leading-snug text-(color:--color-slate-dark)"
            >사용했어요</span>
          </p>
        </div>
      </router-link>

      <!--
        홈 화면 색 리듬: 브랜드 액센트(연두)는 맨 위 히어로 한 번만 쓰고, 그 아래는
        전부 흰 카드 + 그림자로 구분한다(토스 등 금융앱의 공통 패턴 - 히어로에만 포인트
        컬러, 이후는 단일 신호로만 컬러 추가). 예전엔 이 인사이트 묶음도 히어로와 같은
        연두 배경을 다시 썼는데, 화면을 내리다 보면 "또 그 초록"으로 반복돼 보였다.
        그래서 배경 박스를 없애고 지갑 카드와 같은 흰 카드 스타일로 통일한다.
        묶음이라는 느낌은 배경 대신 카드 사이 간격과 제목으로만 준다.
      -->
      <!--
        카드 안 라벨('이번 달 총지출' 등)을 sm으로 키우면서, 이 바깥 제목이 같은 볼드
        navy로 h2(md)만 살짝 더 큰 정도라 카드 제목과 위계가 헷갈렸다. 그래서 이 제목은
        본문 카드와 경쟁하지 않도록 작고 옅은 '구간 표시'로 낮추고, 카드 자체 제목이
        가장 먼저 눈에 들어오게 한다.
      -->
      <div
        v-if="isInsightsLoading || insights.length > 0"
        class="mt-(--space-5) flex items-center justify-between gap-(--space-2)"
      >
        <h2
          id="home-insight-title"
          class="m-0 text-(length:--font-xs) font-bold tracking-[0.04em] text-(color:--color-slate-muted)"
        >
          이번 달 인사이트
        </h2>
        <!-- 'AI 요약' 배지도 카드마다 반복하지 않고 여기 한 번만 단다. -->
        <span
          v-if="hasAiWrittenCard"
          class="shrink-0 rounded-full bg-(--color-leaf-soft) px-(--space-2) py-[2px] text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)"
        >AI 요약</span>
      </div>

      <section
        v-if="isInsightsLoading || insights.length > 0"
        class="mt-(--space-3) space-y-(--space-3)"
        aria-labelledby="home-insight-title"
      >
        <!-- 카드 자리를 미리 잡아 두면 도착할 때 아래 내용이 밀리지 않는다. -->
        <template v-if="isInsightsLoading">
          <div
            v-for="placeholder in 2"
            :key="placeholder"
            class="h-[104px] animate-pulse rounded-[22px] bg-(--color-white)"
            aria-hidden="true"
          />
        </template>

        <template v-else>
          <div
            v-for="card in insights"
            :key="card.type"
          >
            <component
              :is="card.ctaPath ? 'router-link' : 'div'"
              v-bind="card.ctaPath ? { to: card.ctaPath } : {}"
              class="block rounded-[22px] bg-(--color-white) p-(--space-4) text-inherit no-underline shadow-(--shadow-card)"
            >
              <!--
                SPENDING 카드는 위 '이번 달 총지출' 타일이 하던 역할(금액 표시)을 이제
                이 카드가 대신한다. 전월 대비 증감은 아래 본문 문장이 이미 말하므로
                (server가 만든 분석 문장), 배지로 같은 숫자를 다시 보여주지 않는다.
                '이 카테고리 공동구매 추천' 라벨과 같은 스타일을 써서 카드 안 두 제목의
                형태를 통일한다.
              -->
              <p
                v-if="card.type === 'SPENDING'"
                class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
              >
                이번 달 총지출
              </p>
              <p
                v-if="card.type === 'SPENDING'"
                class="mt-(--space-2) flex flex-wrap items-baseline gap-x-(--space-2) gap-y-(--space-1)"
                :aria-label="monthlySpendingAriaLabel"
                data-testid="monthly-spending-amount-card"
              >
                <span
                  aria-hidden="true"
                  class="text-[28px] font-extrabold leading-none tracking-[-0.035em] text-(color:--color-navy)"
                >{{ formattedMonthlyExpense }}원</span>
                <span
                  aria-hidden="true"
                  class="text-(length:--font-sm) font-semibold leading-snug text-(color:--color-slate-dark)"
                >사용했어요</span>
              </p>

              <!--
                문장만으로는 "사료가 41%"가 다른 카테고리 대비 정말 큰 건지 감이 안 온다.
                도넛으로 구성을 같이 보여주면 한눈에 비교가 된다(참고: Copilot Money·
                Monarch Money의 월간 스냅샷 패턴). 차트를 카드 폭에 맞게 키워서 오른쪽에
                빈 공간이 크게 남지 않게 한다. 카테고리가 없으면(집계 실패 등) 조용히 숨긴다.
              -->
              <div
                v-if="card.type === 'SPENDING' && card.categoryBreakdown?.length"
                class="mt-(--space-5) flex items-center gap-(--space-5)"
              >
                <CategoryDonutChart :shares="card.categoryBreakdown" />
                <ul class="min-w-0 flex-1 list-none space-y-[9px] p-0 pr-(--space-2) m-0">
                  <li
                    v-for="(share, shareIndex) in card.categoryBreakdown"
                    :key="share.label"
                    class="flex items-center justify-between gap-(--space-2) text-(length:--font-xs) text-(color:--color-slate-dark)"
                  >
                    <span class="flex min-w-0 items-center gap-(--space-2)">
                      <span
                        class="size-2 shrink-0 rounded-full"
                        :style="{ background: categoryChartColor(shareIndex) }"
                      />
                      <span class="min-w-0 truncate font-semibold text-(color:--color-navy)">{{ share.label }}</span>
                    </span>
                    <span class="shrink-0 font-extrabold text-(color:--color-navy)">{{ share.percentage }}%</span>
                  </li>
                </ul>
              </div>

              <div
                v-else
                class="flex items-center gap-(--space-3)"
                data-testid="insight-headline-row"
              >
                <span
                  class="flex size-[26px] shrink-0 items-center justify-center rounded-(--radius-md)"
                  :class="insightIconTone(card.type)"
                  data-testid="insight-icon-tile"
                >
                  <component
                    :is="insightIcon(card.type)"
                    size="15"
                  />
                </span>
                <p class="min-w-0 flex-1 text-(length:--font-sm) font-bold text-(color:--color-navy)">
                  {{ card.headline }}
                </p>
              </div>

              <p class="mt-(--space-3) text-(length:--font-sm) leading-[1.6] break-keep text-(color:--color-slate-dark)">
                <template
                  v-for="(part, index) in splitByPercent(card.body)"
                  :key="index"
                >
                  <span
                    v-if="part.highlight"
                    class="font-bold text-(color:--color-leaf-dark)"
                  >{{ part.text }}</span><template v-else>
                    {{ part.text }}
                  </template>
                </template>
              </p>

              <!--
                지나간 일을 요약한 문장과 앞날을 말하는 문장은 신뢰도가 다르다.
                예측은 따로 떼어 '예상'이라고 못박아 둔다. 근거가 모자라면 서버가
                이 값을 안 내려주므로 자리도 사라진다.
              -->
              <!--
                묶음 배경(leaf-soft)·흰 카드와 이어지려면 진한 파랑 같은 이질적인 색보다
                이미 이 디자인 시스템에 'info' 용도로 있던 중립 톤(info-surface)이 낫다.
                글자는 다른 카드 본문과 같은 navy를 써서 대비를 지킨다(옅은 파랑 글자는
                명암비가 3:1도 안 나온다). '예상' 라벨은 작은 배지로 감싸서 본문과
                한눈에 구분되게 한다(굵은 글씨만으로는 옆 문장과 잘 안 갈라져 보였다).
              -->
              <p
                v-if="card.projection"
                class="mt-(--space-3) mb-0 flex items-start gap-(--space-2) rounded-(--radius-lg) bg-(--color-info-surface) px-(--space-3) py-(--space-2) text-(length:--font-sm) leading-[1.5] break-keep text-(color:--color-navy)"
              >
                <span class="mt-[1px] shrink-0 rounded-full bg-(--color-white) px-(--space-2) py-[2px] text-(length:--font-xs) font-bold text-(color:--color-navy)">예상</span>
                <span>{{ card.projection }}</span>
              </p>

              <p
                v-if="card.ctaPath"
                class="mt-(--space-3) mb-0 flex items-center justify-end gap-[2px] text-(length:--font-sm) font-bold text-(color:--color-leaf-dark)"
              >
                {{ card.ctaLabel }}
                <IconChevronRight
                  :size="16"
                  color="currentColor"
                />
              </p>
            </component>

            <!--
              추천은 카드 전체를 감싸는 링크(card.ctaPath) 안에 두면 <a> 안에 <a>가 중첩돼
              접근성/클릭 동작이 깨진다. 그래서 카드 바깥, 같은 반복 안의 형제 요소로 둔다.
              지금은 SPENDING 카드에서 이번 달 최다 지출 카테고리로만 채워진다.
            -->
            <div
              v-if="card.recommendedProducts?.length"
              class="mt-(--space-3) rounded-[22px] border border-(--color-card-border) bg-(--color-white) p-(--space-4)"
            >
              <p class="mb-(--space-3) text-(length:--font-sm) font-bold text-(color:--color-navy)">
                이 카테고리 공동구매 추천
              </p>
              <RecommendedProductCarousel :products="card.recommendedProducts" />
            </div>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>
