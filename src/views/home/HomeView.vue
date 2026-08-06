<script setup>
import { computed, onMounted, ref } from 'vue';
import ExpenseDonutChart from '@/components/dashboard/ExpenseDonutChart.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';
import iconCat3d from '@/assets/images/icons-3d/cat_face_3d.png';
import iconDog3d from '@/assets/images/icons-3d/dog_face_3d.png';
import iconCertificate3d from '@/assets/images/icons-3d/identification_card_3d.png';
import iconSos3d from '@/assets/images/icons-3d/ambulance_3d.png';
import iconSavings3d from '@/assets/images/icons-3d/money_bag_3d.png';
import iconFamily3d from '@/assets/images/icons-3d/people_hugging_3d.png';
import iconSupportProgram3d from '@/assets/images/icons-3d/classical_building_3d.png';
import iconGroupPurchase3d from '@/assets/images/icons-3d/basket_3d.png';
import { mockWalletBalance } from '@/mocks/transaction';
import { usePetStore } from '@/stores/pet';
import { useTransactionStore } from '@/stores/transaction';

const memberName = ref('애월');

const petStore = usePetStore();
const transactionStore = useTransactionStore();

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const walletBalance = ref(mockWalletBalance);

const today = new Date();

// 시간대별 인사말
const greetingText = computed(() => {
  const hour = today.getHours();
  if (hour < 5) return '포근한 밤 되세요';
  if (hour < 11) return '좋은 아침이에요';
  if (hour < 17) return '활기찬 오후예요';
  if (hour < 21) return '편안한 저녁이에요';
  return '포근한 밤 되세요';
});

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

// 펫별 지출 도넛 차트 색상 팔레트 (연한 파스텔 배경 톤은 차트에서 너무 흐려서,
// 채도를 살짝 높인 더스티 파스텔 톤으로 구성)
const petColorTokens = [
  '--color-gold-dark',
  '--color-olive-muted',
  '--color-chart-blue',
  '--color-danger-muted',
  '--color-chart-purple',
  '--color-olive-dark',
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

// 펫별 지출 카드: 홈 화면은 최대 4마리까지만 카드로 보여주고,
// 그 이상은 "+N마리" 카드로 요약해 화면이 무한정 길어지지 않게 한다
const PET_CARD_LIMIT = 4;
const visiblePetCards = computed(() =>
  petBreakdown.value.slice(0, PET_CARD_LIMIT),
);
const hiddenPetCount = computed(() =>
  Math.max(petBreakdown.value.length - PET_CARD_LIMIT, 0),
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
    tapBg: 'var(--color-pastel-peach)',
  },
  {
    label: '함께 돌보기',
    to: '/share',
    icon: iconFamily3d,
    tapBg: 'var(--color-pastel-violet)',
  },
  {
    label: '짜투리 저금통',
    to: '/donation',
    icon: iconSavings3d,
    tapBg: 'var(--color-pastel-cream)',
  },
  {
    label: '증명서 관리',
    to: '/certificates',
    icon: iconCertificate3d,
    tapBg: 'var(--color-pastel-blue)',
  },
  {
    label: '응급 SOS',
    to: '/emergency',
    icon: iconSos3d,
    tapBg: 'var(--color-pastel-coral)',
  },
  {
    label: '지원사업',
    to: '/support-programs',
    icon: iconSupportProgram3d,
    tapBg: 'var(--color-pastel-mist)',
  },
];

// 펫 종에 따라 강아지/고양이 아이콘 선택
function petIcon(species) {
  return species === 'CAT' ? iconCat3d : iconDog3d;
}

onMounted(async () => {
  // TODO: fetch wallet balance, monthly expense summary, and pet expense
  // breakdown from wallet/dashboard/pet stores
  isLoading.value = false;
});
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-gray-100) min-h-screen"
  >
    <!-- 로딩 상태 -->
    <div
      v-if="isLoading"
      class="py-(--space-8)"
    >
      <LoadingSpinner />
    </div>

    <template v-else>
      <!-- 총 잔액 카드 -->
      <router-link
        to="/wallet"
        class="block bg-(--color-navy) rounded-(--radius-lg) shadow-(--shadow-md) px-(--space-5) py-(--space-4) mb-(--space-4) no-underline text-inherit"
      >
        <p
          class="text-(length:--font-sm) font-medium text-(color:--color-slate-light)"
        >
          {{ memberName }}님, {{ greetingText }}
        </p>
        <div class="mt-(--space-2)">
          <span
            class="flex items-baseline gap-(--space-2)"
          >
            <span
              class="text-(length:--font-sm) text-(color:--color-slate-light)"
            >
              총 잔액
            </span>
            <span
              class="text-(length:--font-2xl) font-bold text-(color:--color-white)"
            >
              {{ walletBalance.toLocaleString() }}원
            </span>
            <IconChevronRight
              :size="18"
              color="var(--color-slate-light)"
            />
          </span>
        </div>
      </router-link>

      <!-- 펫별 지출 카드 -->
      <div
        class="grid gap-(--space-3) mb-(--space-4)"
        :class="visiblePetCards.length === 1 ? 'grid-cols-1' : 'grid-cols-2'"
      >
        <router-link
          v-for="pet in visiblePetCards"
          :key="pet.id"
          :to="{ path: '/wallet/history', query: { petId: pet.id } }"
          class="flex flex-col justify-between bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-md) p-(--space-4) no-underline text-inherit"
        >
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-dark)"
          >
            {{ pet.name }} 지출
          </p>
          <div class="flex items-end justify-between mt-(--space-3)">
            <p
              class="text-(length:--font-lg) font-bold text-(color:--color-gray-900)"
            >
              {{ pet.expenseAmount.toLocaleString() }}원
            </p>
            <img
              :src="petIcon(pet.species)"
              :alt="pet.species === 'CAT' ? '고양이' : '강아지'"
              class="w-[40px] h-[40px] object-contain shrink-0 saturate-[0.8] brightness-[1.03] contrast-[0.95]"
            />
          </div>
        </router-link>
        <router-link
          v-if="hiddenPetCount > 0"
          :to="dashboardDetailTarget"
          class="flex flex-col items-center justify-center gap-(--space-1) bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-sm) p-(--space-4) no-underline text-(color:--color-slate-dark)"
        >
          <span
            class="text-(length:--font-base) font-bold text-(color:--color-gray-900)"
          >
            +{{ hiddenPetCount }}마리
          </span>
          <span class="text-(length:--font-xs)">전체 보기</span>
        </router-link>
      </div>

      <!-- 이번 달 지출 요약 + 반려동물별 도넛 차트 -->
      <router-link
        :to="dashboardDetailTarget"
        class="flex items-center gap-(--space-4) bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-md) p-(--space-4) mb-(--space-4) no-underline text-inherit"
      >
        <ExpenseDonutChart
          :items="donutChartItems"
          size="72px"
          class="shrink-0"
        />
        <div class="flex-1">
          <p
            class="flex items-center gap-(--space-2) text-(length:--font-base) font-semibold text-(color:--color-gray-900)"
          >
            이번 달 총지출
            <span
              class="text-(length:--font-xs) font-bold"
              :class="
                monthlyExpense.changeRate > 0
                  ? 'text-(color:--color-danger)'
                  : monthlyExpense.changeRate < 0
                    ? 'text-(color:--color-chart-blue)'
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

      <!-- 바로가기 메뉴 그리드 -->
      <section class="mt-(--space-7)">
        <h2
          class="text-(length:--font-lg) font-bold text-(color:--color-gray-900) mb-(--space-4)"
        >
          바로가기
        </h2>
        <div class="grid grid-cols-3 gap-(--space-3)">
          <component
            :is="item.to ? 'router-link' : 'div'"
            v-for="item in quickActions"
            :key="item.label"
            v-bind="item.to ? { to: item.to } : {}"
            :style="{ '--tap-bg': item.tapBg }"
            class="flex aspect-square flex-col justify-between bg-(--color-white) active:bg-(--tap-bg) transition-colors rounded-(--radius-lg) shadow-(--shadow-md) p-(--space-3) no-underline text-(color:--color-gray-900) text-(length:--font-md) font-semibold"
            :class="{ 'cursor-not-allowed': !item.to }"
          >
            <span class="leading-tight">{{ item.label }}</span>
            <img
              :src="item.icon"
              :alt="item.label"
              class="w-[38px] h-[38px] self-end object-contain saturate-[0.8] brightness-[1.03] contrast-[0.95]"
            />
          </component>
        </div>
      </section>
    </template>
  </div>
</template>
