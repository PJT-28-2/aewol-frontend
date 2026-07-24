<script setup>
import { computed, onMounted, ref } from 'vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconCertificate from '@/components/common/icons/IconCertificate.vue';
import IconDog from '@/components/common/icons/IconDog.vue';
import IconFamily from '@/components/common/icons/IconFamily.vue';
import IconGroupPurchase from '@/components/common/icons/IconGroupPurchase.vue';
import IconSavings from '@/components/common/icons/IconSavings.vue';
import IconSos from '@/components/common/icons/IconSos.vue';
import IconSupportProgram from '@/components/common/icons/IconSupportProgram.vue';

const memberName = ref('애월');

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const walletBalance = ref(482600);
const monthlyExpense = ref({ total: 243000, changeRate: -12 });
const pets = ref([
  { id: 1, name: '소로', species: 'DOG', expenseAmount: 168000 },
  { id: 2, name: '나비', species: 'CAT', expenseAmount: 75000 },
]);

const isLoading = ref(true);

const petColors = [
  'var(--color-navy)',
  'var(--color-olive)',
  '#4A6FA5',
  '#B25CC9',
];

const petBreakdown = computed(() => {
  const totalSpent = pets.value.reduce(
    (sum, pet) => sum + (pet.expenseAmount || 0),
    0,
  );
  const breakdown = pets.value.map((pet, index) => ({
    ...pet,
    color: petColors[index % petColors.length],
    percentage: totalSpent
      ? Math.round((pet.expenseAmount / totalSpent) * 100)
      : 0,
  }));

  if (totalSpent && breakdown.length > 1) {
    const othersTotal = breakdown
      .slice(0, -1)
      .reduce((sum, pet) => sum + pet.percentage, 0);
    breakdown[breakdown.length - 1].percentage = 100 - othersTotal;
  }

  return breakdown;
});

const petNamesText = computed(() =>
  pets.value.length
    ? pets.value.map((pet) => pet.name).join('·')
    : '반려동물',
);

const donutGradient = computed(() => {
  if (!petBreakdown.value.length) return 'var(--color-gray-200)';
  let cursor = 0;
  const stops = petBreakdown.value.map((pet) => {
    const start = cursor;
    cursor += pet.percentage;
    return `${pet.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
});

const donutBreakdownText = computed(() =>
  petBreakdown.value
    .map((pet) => `${pet.name} ${pet.percentage}%`)
    .join(' · '),
);

const quickActions = [
  { label: '증명서', to: null, icon: IconCertificate, bg: '#EFEAE3' },
  { label: 'SOS 포켓', to: '/emergency', icon: IconSos, bg: '#FCE3E1' },
  { label: '저금통', to: '/donation', icon: IconSavings, bg: '#E1F2E7' },
  { label: '가족관리', to: '/share', icon: IconFamily, bg: '#E5EAF6' },
  { label: '지원사업', to: '/support', icon: IconSupportProgram, bg: '#FBEED9' },
  { label: '공동구매', to: '/group-purchase', icon: IconGroupPurchase, bg: '#EBE4F5' },
];

function petIcon(species) {
  return species === 'CAT' ? IconCat : IconDog;
}

onMounted(async () => {
  // TODO: fetch wallet balance, monthly expense summary, and pet expense
  // breakdown from wallet/dashboard/pet stores
  isLoading.value = false;
});
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-screen"
  >
    <div class="flex justify-end mb-(--space-4)">
      <router-link
        to="/wallet"
        class="inline-flex items-center h-[26px] gap-(--space-2) pl-(--space-4) pr-(--space-2) bg-(--color-surface) border border-(--color-border) rounded-full shadow-(--shadow-sm) text-(color:--color-navy) text-(length:--font-sm) font-semibold no-underline"
      >
        <span>{{ walletBalance.toLocaleString() }}원</span>
        <span
          class="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full bg-(--color-gold) text-(color:--color-navy) text-(length:--font-sm) leading-none"
        >+</span>
      </router-link>
    </div>

    <header class="mb-(--space-6)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        {{ memberName }}님, 오늘도 화이팅!
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        이번 달 {{ petNamesText }} 지출을 확인해보세요
      </p>
    </header>

    <div
      v-if="isLoading"
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>로딩 중...</p>
    </div>

    <template v-else>
      <!-- Summary Stat Cards -->
      <section
        class="grid grid-cols-2 gap-(--space-3) mb-(--space-5)"
      >
        <div
          class="bg-(--color-surface) rounded-(--radius-lg) p-(--space-5) shadow-(--shadow-sm)"
        >
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-dark)"
          >
            총 잔액
          </p>
          <p
            class="text-(length:--font-xl) font-bold text-(color:--color-navy) mt-(--space-2)"
          >
            {{ walletBalance.toLocaleString() }}원
          </p>
        </div>
        <div
          class="bg-(--color-surface) rounded-(--radius-lg) p-(--space-5) shadow-(--shadow-sm)"
        >
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-dark)"
          >
            이번 달 총지출
          </p>
          <p
            class="text-(length:--font-xl) font-bold text-(color:--color-navy) mt-(--space-2)"
          >
            {{ monthlyExpense.total.toLocaleString() }}원
          </p>
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            전월 대비
            {{ monthlyExpense.changeRate > 0 ? '+' : ''
            }}{{ monthlyExpense.changeRate }}%
          </p>
        </div>
        <div
          v-for="pet in petBreakdown"
          :key="pet.id"
          class="bg-(--color-surface) rounded-(--radius-lg) p-(--space-5) shadow-(--shadow-sm)"
        >
          <p
            class="flex items-center gap-(--space-1) text-(length:--font-sm) text-(color:--color-slate-dark)"
          >
            <component
              :is="petIcon(pet.species)"
              :size="14"
              color="var(--color-slate-dark)"
              class="shrink-0"
            />
            {{ pet.name }} 지출
          </p>
          <p
            class="text-(length:--font-xl) font-bold mt-(--space-2)"
            :style="{ color: pet.color }"
          >
            {{ pet.expenseAmount.toLocaleString() }}원
          </p>
        </div>
      </section>

      <!-- Pet Expense Donut Chart -->
      <section
        class="bg-(--color-white) rounded-(--radius-lg) p-(--space-5) shadow-(--shadow-sm) mb-(--space-5)"
      >
        <div class="flex items-center gap-(--space-5)">
          <div
            class="w-[88px] h-[88px] rounded-full shrink-0 relative"
            :style="{ background: donutGradient }"
          >
            <div
              class="absolute inset-[16px] rounded-full bg-(--color-white)"
            />
          </div>
          <div class="flex-1">
            <h2
              class="text-(length:--font-base) font-semibold text-(color:--color-navy)"
            >
              반려동물별 지출 차트
            </h2>
            <p
              class="text-(length:--font-sm) text-(color:--color-gray-600) mt-(--space-1)"
            >
              {{ donutBreakdownText || '지출 내역이 없습니다' }}
            </p>
            <router-link
              to="/dashboard"
              class="inline-block mt-(--space-2) text-(length:--font-sm) font-semibold text-(color:--color-gold) no-underline"
            >
              자세히 보기 &rsaquo;
            </router-link>
          </div>
        </div>
      </section>

      <!-- Quick Links -->
      <section>
        <h2
          class="text-(length:--font-lg) font-semibold text-(color:--color-navy) mb-(--space-4)"
        >
          바로가기
        </h2>
        <div
          class="grid grid-cols-3 gap-y-(--space-4) gap-x-(--space-2)"
        >
          <component
            :is="item.to ? 'router-link' : 'div'"
            v-for="item in quickActions"
            :key="item.label"
            v-bind="item.to ? { to: item.to } : {}"
            class="flex flex-col items-center gap-(--space-2) no-underline text-(color:--color-slate-dark) text-(length:--font-sm) font-medium"
            :class="{ 'cursor-not-allowed': !item.to }"
          >
            <span
              class="flex items-center justify-center w-[48px] h-[48px] rounded-full"
              :style="{ backgroundColor: item.bg }"
            >
              <component
                :is="item.icon"
                :size="20"
              />
            </span>
            <span>{{ item.label }}</span>
          </component>
        </div>
      </section>
    </template>
  </div>
</template>
