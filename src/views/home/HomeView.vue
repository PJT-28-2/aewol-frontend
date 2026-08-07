<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import ExpenseDonutChart from '@/components/dashboard/ExpenseDonutChart.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import iconCertificate3d from '@/assets/images/icons-3d/identification_card_3d.png';
import iconSos3d from '@/assets/images/icons-3d/ambulance_3d.png';
import iconSavings3d from '@/assets/images/icons-3d/money_bag_3d.png';
import iconFamily3d from '@/assets/images/icons-3d/people_hugging_3d.png';
import iconSupportProgram3d from '@/assets/images/icons-3d/classical_building_3d.png';
import iconGroupPurchase3d from '@/assets/images/icons-3d/basket_3d.png';
import { groupPurchaseApi } from '@/api/groupPurchase';
import { MOCK_GROUP_PURCHASE_LIST } from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { mockWalletBalance } from '@/mocks/transaction';
import { usePetStore } from '@/stores/pet';
import { useTransactionStore } from '@/stores/transaction';

const petStore = usePetStore();
const transactionStore = useTransactionStore();

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const walletBalance = ref(mockWalletBalance);

const today = new Date();

const monthlyExpense = computed(() => ({
  total: transactionStore.monthlyExpenseTotal(
    today.getFullYear(),
    today.getMonth() + 1,
  ),
  changeRate: -12, // TODO: 전월 대비 실제 계산 로직 연동
}));

const pets = computed(() =>
  petStore.pets.map((pet) => ({
    ...pet,
    expenseAmount: transactionStore.petExpenseTotal(
      pet.id,
      today.getFullYear(),
      today.getMonth() + 1,
    ),
  })),
);

const isLoading = ref(true);
const popularGroupPurchases = ref([]);
const activeBannerIndex = ref(0);
let bannerTimer;

const bannerSlides = computed(() =>
  popularGroupPurchases.value.slice(0, 3).map((item) => ({
    id: item.id ?? item.gpId,
    item,
  })),
);

function viewCountOf(item) {
  return Number(item.viewCount ?? item.views ?? item.hitCount ?? 0);
}

async function loadPopularGroupPurchases() {
  try {
    const items = USE_MOCK_DATA
      ? MOCK_GROUP_PURCHASE_LIST
      : (await groupPurchaseApi.getList()).data.result ?? [];
    popularGroupPurchases.value = [...items]
      .filter((item) => item.status === '진행중')
      .sort((a, b) => viewCountOf(b) - viewCountOf(a))
      .slice(0, 3);
  } catch {
    popularGroupPurchases.value = [];
  }
}

function selectBanner(index) {
  activeBannerIndex.value = index;
}

function startBannerRotation() {
  bannerTimer = window.setInterval(() => {
    if (bannerSlides.value.length > 1) {
      activeBannerIndex.value =
        (activeBannerIndex.value + 1) % bannerSlides.value.length;
    }
  }, 4500);
}

// 펫별 지출 도넛 차트 색상 팔레트 (연한 파스텔 배경 톤은 차트에서 너무 흐려서,
// 채도를 살짝 높인 더스티 파스텔 톤으로 구성)
const petColorTokens = [
  '--color-leaf-dark',
  '--color-leaf',
  '--color-olive-dark',
  '--color-olive-muted',
  '--color-gold-dark',
  '--color-pastel-mint',
];

// 펫별 지출 비율 계산
const petBreakdown = computed(() => {
  const totalSpent = pets.value.reduce(
    (sum, pet) => sum + (pet.expenseAmount || 0),
    0,
  );
  const breakdown = pets.value.map((pet, index) => ({
    ...pet,
    colorToken: petColorTokens[index % petColorTokens.length],
    percentage: totalSpent
      ? Math.round((pet.expenseAmount / totalSpent) * 100)
      : 0,
  }));

  if (totalSpent && breakdown.length > 1) {
    const othersTotal = breakdown
      .slice(0, -1)
      .reduce((sum, pet) => sum + pet.percentage, 0);
    breakdown[breakdown.length - 1].percentage =
      100 - othersTotal;
  }

  return breakdown;
});

// ExpenseDonutChart(echarts)에 넘길 항목
const donutChartItems = computed(() =>
  petBreakdown.value.map((pet) => ({
    label: pet.name,
    percentage: pet.percentage,
    colorToken: pet.colorToken,
  })),
);

// 도넛 차트 옆 비율 텍스트
const donutBreakdownText = computed(() =>
  petBreakdown.value
    .map((pet) => `${pet.name} ${pet.percentage}%`)
    .join(' · '),
);

// 반려동물이 1마리 이하이거나 태깅된 지출이 없으면 이번 달 지출 화면에 "반려동물별" 탭이
// 안 뜨므로, 그럴 땐 "카테고리별"로 진입시킨다
const dashboardDetailTarget = computed(() => {
  const hasPetTab =
    pets.value.length >= 2 &&
    pets.value.some((pet) => pet.expenseAmount > 0);
  return {
    path: '/dashboard',
    query: { tab: hasPetTab ? 'pet' : 'category' },
  };
});

// 바로가기 메뉴 6종
const quickActions = [
  {
    label: '공동구매',
    to: '/group-purchase',
    icon: iconGroupPurchase3d,
  },
  {
    label: '함께 돌보기',
    to: '/share',
    icon: iconFamily3d,
  },
  {
    label: '짜투리 저금통',
    to: '/donation',
    icon: iconSavings3d,
  },
  {
    label: '증명서 관리',
    to: '/certificates',
    icon: iconCertificate3d,
  },
  {
    label: '응급 SOS',
    to: '/emergency',
    icon: iconSos3d,
  },
  {
    label: '지원사업',
    to: '/support-programs',
    icon: iconSupportProgram3d,
  },
];

onMounted(async () => {
  // TODO: fetch wallet balance, monthly expense summary, and pet expense
  // breakdown from wallet/dashboard/pet stores
  await loadPopularGroupPurchases();
  startBannerRotation();
  isLoading.value = false;
});

onBeforeUnmount(() => window.clearInterval(bannerTimer));
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) px-(--space-4) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-7))]"
  >
    <!-- 로딩 상태 -->
    <div
      v-if="isLoading"
      class="py-(--space-8)"
    >
      <LoadingSpinner />
    </div>

    <template v-else>
      <!-- 조회수 상위 공동구매 광고 캐러셀 -->
      <section
        v-if="bannerSlides.length"
        class="relative mb-(--space-4) min-h-[104px] overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-leaf-soft)"
      >
        <div
          class="flex transition-transform duration-500 ease-out"
          :style="{ transform: `translateX(-${activeBannerIndex * 100}%)` }"
        >
          <router-link
            v-for="slide in bannerSlides"
            :key="slide.id"
            :to="`/group-purchase/${slide.id}`"
            class="flex min-h-[104px] w-full shrink-0 items-center justify-between px-(--space-5) pb-(--space-5) pt-(--space-4) text-inherit no-underline"
          >
            <div class="min-w-0 pr-(--space-3)">
              <p class="text-[11px] font-semibold text-(color:--color-leaf-dark)">
                인기 공동구매
              </p>
              <p class="mt-(--space-1) line-clamp-1 text-(length:--font-base) font-bold text-(color:--color-gray-900)">
                {{ slide.item.productName }}
              </p>
              <p class="mt-[3px] text-(length:--font-sm) text-(color:--color-slate-dark)">
                {{ slide.item.badgeText || `${slide.item.groupPrice?.toLocaleString()}원` }}
              </p>
            </div>
            <div class="flex size-[58px] shrink-0 items-center justify-center rounded-[18px] bg-(--color-white)">
              <img
                :src="iconGroupPurchase3d"
                alt="공동구매"
                class="size-[48px] rounded-[14px] object-contain"
              >
            </div>
          </router-link>
        </div>
        <div
          v-if="bannerSlides.length > 1"
          class="absolute bottom-[9px] left-0 right-0 flex justify-center gap-[5px]"
        >
          <button
            v-for="(_, index) in bannerSlides"
            :key="index"
            type="button"
            class="size-[5px] rounded-(--radius-full) transition-colors"
            :class="index === activeBannerIndex ? 'bg-(--color-gray-800)' : 'bg-(--color-gray-400)'"
            :aria-label="`${index + 1}번째 배너 보기`"
            @click="selectBanner(index)"
          />
        </div>
      </section>

      <!-- 잔액과 주요 기능을 묶은 지갑 카드 -->
      <section class="mb-(--space-4) overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-5) shadow-(--shadow-card)">
        <div>
          <div class="min-w-0 flex-1">
            <p class="text-(length:--font-base) font-semibold text-(color:--color-slate-dark)">
              김애월님
            </p>
            <router-link
              to="/wallet"
              class="mt-[2px] block text-[27px] font-bold tracking-[-0.02em] text-(color:--color-gray-900) no-underline"
            >
              {{ walletBalance.toLocaleString() }}원
            </router-link>
          </div>
          <div class="mt-(--space-2) flex justify-end gap-(--space-2)">
            <router-link
              to="/wallet/charge"
              class="rounded-(--radius-full) border border-(--color-card-border) bg-(--color-white) px-(--space-4) py-[9px] text-(length:--font-sm) font-semibold text-(color:--color-gray-900) no-underline"
            >
              충전
            </router-link>
            <router-link
              to="/wallet/transfer"
              class="rounded-(--radius-full) bg-(--color-leaf) px-(--space-4) py-[9px] text-(length:--font-sm) font-bold text-(color:--color-gray-900) no-underline"
            >
              송금
            </router-link>
          </div>
        </div>

        <div class="mt-(--space-5) grid grid-cols-3 gap-x-(--space-2) gap-y-(--space-5) border-t border-(--color-gray-100) pt-(--space-5)">
          <router-link
            v-for="item in quickActions"
            :key="item.label"
            :to="item.to"
            class="flex min-w-0 flex-col items-center gap-(--space-2) text-center text-inherit no-underline"
          >
            <span
              class="flex size-[44px] items-center justify-center rounded-[14px] bg-(--color-gray-100)"
            >
              <img
                :src="item.icon"
                :alt="item.label"
                class="size-[34px] object-contain"
              >
            </span>
            <span class="text-[12px] font-medium leading-tight text-(color:--color-slate-dark)">
              {{ item.label }}
            </span>
          </router-link>
        </div>
      </section>

      <!-- 이번 달 지출 요약 + 반려동물별 도넛 차트 -->
      <router-link
        :to="dashboardDetailTarget"
        class="flex items-center gap-(--space-4) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-5) no-underline text-inherit"
      >
        <div class="flex size-[72px] shrink-0 items-center justify-center rounded-[18px] bg-(--color-leaf-soft)">
          <ExpenseDonutChart
            :items="donutChartItems"
            size="56px"
          />
        </div>
        <div class="flex-1">
          <p
            class="flex flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1) text-(length:--font-base) font-semibold text-(color:--color-gray-900)"
          >
            이번 달 지출
            <span
              class="text-(length:--font-xs) font-bold"
              :class="
                monthlyExpense.changeRate > 0
                  ? 'text-(color:--color-danger)'
                  : monthlyExpense.changeRate < 0
                    ? 'text-(color:--color-leaf-dark)'
                    : 'text-(color:--color-slate-muted)'
              "
            >
              전월 대비
              {{ monthlyExpense.changeRate > 0 ? '+' : ''
              }}{{ monthlyExpense.changeRate }}%
            </span>
          </p>
          <p
            class="text-(length:--font-lg) font-bold text-(color:--color-gray-900) mt-(--space-1)"
          >
            {{ monthlyExpense.total.toLocaleString() }}원
          </p>
          <p
            class="text-(length:--font-sm) text-(color:--color-gray-600) mt-(--space-1)"
          >
            {{ donutBreakdownText || '지출 내역이 없습니다' }}
          </p>
        </div>
      </router-link>

    </template>
  </div>
</template>
