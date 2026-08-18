<script setup>
import { computed, onMounted, ref } from 'vue'
import AewolLogo from '@/components/common/AewolLogo.vue'
import AppButton from '@/components/common/AppButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconNotificationBell from '@/components/common/icons/IconNotificationBell.vue'
import IconPublicSupport from '@/components/common/icons/IconPublicSupport.vue'
import IconWallet from '@/components/common/icons/IconWallet.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import IconSavings from '@/components/common/icons/IconSavings.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useMemberStore } from '@/stores/member'
import { usePetStore } from '@/stores/pet'
import { getHomeInsights } from '@/api/insight'
import dogHero from '@/assets/images/pet-dog-default-home-v3.png'
import catHero from '@/assets/images/pet-cat-default-home-v3.png'

const memberStore = useMemberStore()
const petStore = usePetStore()
const dashboardStore = useDashboardStore()
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

function insightIcon(type) {
  const icon = INSIGHT_ICONS[type]
  if (!icon && import.meta.env.DEV) {
    // 조용히 기본 아이콘으로 대체되면 서버가 새 카드를 추가한 걸 놓치기 쉽다.
    console.warn(`[home] 아이콘이 정의되지 않은 인사이트 카드 종류: ${type}`)
  }
  return icon ?? IconPaw
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

      <!--
        인사이트는 위쪽 메뉴 카드와 성격이 다르다. 사용자가 누를 기능이 아니라
        읽을 내용이라, 묶음 배경과 머리글로 한 덩어리임을 먼저 보이게 한다.
        'AI 요약' 배지도 카드마다 반복하지 않고 여기 한 번만 단다.
      -->
      <section
        v-if="isInsightsLoading || insights.length > 0"
        class="mt-(--space-5) rounded-[24px] bg-(--color-leaf-soft) p-(--space-4)"
        aria-labelledby="home-insight-title"
      >
        <div class="flex items-center justify-between gap-(--space-2)">
          <h2
            id="home-insight-title"
            class="m-0 text-(length:--font-md) font-bold text-(color:--color-navy)"
          >
            오늘의 읽을거리
          </h2>
          <span
            v-if="hasAiWrittenCard"
            class="shrink-0 rounded-full bg-(--color-white) px-(--space-2) py-[2px] text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)"
          >AI 요약</span>
        </div>

        <!-- 카드 자리를 미리 잡아 두면 도착할 때 아래 내용이 밀리지 않는다. -->
        <div
          v-if="isInsightsLoading"
          class="mt-(--space-3) space-y-(--space-3)"
          aria-hidden="true"
        >
          <div
            v-for="placeholder in 2"
            :key="placeholder"
            class="h-[104px] animate-pulse rounded-[18px] bg-(--color-white)"
          />
        </div>

        <div
          v-else
          class="mt-(--space-3) space-y-(--space-3)"
        >
          <component
            :is="card.ctaPath ? 'router-link' : 'div'"
            v-for="card in insights"
            :key="card.type"
            v-bind="card.ctaPath ? { to: card.ctaPath } : {}"
            class="block rounded-[18px] bg-(--color-white) p-(--space-4) text-inherit no-underline"
          >
            <div class="flex items-start gap-(--space-3)">
              <span class="mt-[2px] flex size-[26px] shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-leaf) text-(color:--color-navy)">
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
              {{ card.body }}
            </p>

            <!--
              지나간 일을 요약한 문장과 앞날을 말하는 문장은 신뢰도가 다르다.
              예측은 따로 떼어 '전망'이라고 못박아 둔다. 근거가 모자라면 서버가
              이 값을 안 내려주므로 자리도 사라진다.
            -->
            <p
              v-if="card.projection"
              class="mt-(--space-3) mb-0 rounded-(--radius-lg) bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-sm) leading-[1.5] break-keep text-(color:--color-leaf-dark)"
            >
              <span class="font-bold">전망</span>
              · {{ card.projection }}
            </p>

            <p
              v-if="card.ctaPath"
              class="mt-(--space-3) mb-0 text-right text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)"
            >
              {{ card.ctaLabel }} →
            </p>
          </component>
        </div>
      </section>
    </template>
  </div>
</template>
