<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ExpenseDonutChart from '@/components/dashboard/ExpenseDonutChart.vue';
import AppButton from '@/components/common/AppButton.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';
import IconStats from '@/components/common/icons/IconStats.vue';
import { CATEGORY_LABELS } from '@/constants/transactionCategory';
import { useDashboardStore } from '@/stores/dashboard';
import { usePetStore } from '@/stores/pet';

const router = useRouter();
const route = useRoute();
const petStore = usePetStore();
const dashboardStore = useDashboardStore();

const pets = computed(() => petStore.pets);

const CATEGORY_COLOR_TOKENS = {
  MEDICAL: '--color-chart-leaf',
  FOOD: '--color-chart-sage',
  GROOMING: '--color-chart-amber',
  SUPPLIES: '--color-chart-teal',
  ETC: '--color-chart-lilac',
};

const UI_CATEGORY_BY_API = {
  HOSPITAL: 'MEDICAL',
  FOOD: 'FOOD',
  GROOMING: 'GROOMING',
  TOY: 'SUPPLIES',
  ETC: 'ETC',
};

const today = new Date();
const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
const categories = computed(() =>
  (dashboardStore.category?.items ?? []).map((entry) => {
    const key = UI_CATEGORY_BY_API[entry.category] ?? entry.category ?? 'ETC';
    return {
      key,
      label: CATEGORY_LABELS[key] ?? '기타',
      amount: Number(entry.amount ?? 0),
      petBreakdown: (entry.petBreakdown ?? []).map((pet) => ({
        petId: pet.petId == null ? null : String(pet.petId),
        petName: pet.petName,
        amount: Number(pet.amount ?? 0),
      })),
      colorToken: CATEGORY_COLOR_TOKENS[key] ?? CATEGORY_COLOR_TOKENS.ETC,
    };
  }),
);

function categoryDetail(category) {
  if (!category.petBreakdown.length) return '';

  return category.petBreakdown
    .map((entry) => {
      const pet = pets.value.find((p) => String(p.id) === entry.petId);
      const petName = pet?.name ?? entry.petName;
      return petName ? `${petName} ${entry.amount.toLocaleString()}원` : '';
    })
    .filter(Boolean)
    .join(' · ');
}

const isLoading = ref(true);
const loadError = ref(false);

// 한 마리만 등록되어 있어도 반려동물별 지출을 확인할 수 있다.
const showPetTab = computed(() => pets.value.length > 0);

// 홈 화면 "자세히 보기"에서 반려동물별 탭으로 들어오려 했지만
// 탭 자체가 안 보이는 상황(반려동물 1마리 이하/태깅 데이터 없음)이면 카테고리별로 진입한다
function resolveTabFromQuery() {
  return route.query.tab === 'pet' && showPetTab.value ? 'pet' : 'category';
}

const activeTab = ref(resolveTabFromQuery());

// /dashboard는 쿼리만 바뀌어도 라우터가 컴포넌트를 재마운트하지 않으므로,
// 홈에서 다시 들어올 때 activeTab이 이전 값에 머물러 있지 않도록 쿼리 변경을 감지한다
watch(
  () => route.query.tab,
  () => {
    activeTab.value = resolveTabFromQuery();
  },
);

function selectTab(tab) {
  if (tab === 'pet' && !showPetTab.value) return;
  activeTab.value = tab;
}

// activeTab이 'pet'이어도 showPetTab이 나중에 false가 되면 activeItems는 카테고리 목록을 보여주므로,
// 표시 조건과 클릭 시 이동 대상(펫/카테고리)을 이 값 하나로 통일해서 어긋나지 않게 한다
const isPetTabActive = computed(
  () => activeTab.value === 'pet' && showPetTab.value,
);

function withPercentages(list) {
  const total = list.reduce((sum, item) => sum + item.amount, 0);
  const items = list.map((item) => ({
    ...item,
    percentage: total
      ? Math.round((item.amount / total) * 100)
      : 0,
  }));

  if (total && items.length > 1) {
    const othersTotal = items
      .slice(0, -1)
      .reduce((sum, item) => sum + item.percentage, 0);
    items[items.length - 1].percentage = 100 - othersTotal;
  }

  return items;
}

// 선명하고 다양한 팔레트
const petColors = [
  '--color-chart-leaf',
  '--color-chart-sage',
  '--color-chart-teal',
  '--color-chart-amber',
  '--color-chart-lilac',
];

const categoryItems = computed(() =>
  withPercentages(
    categories.value.map((category) => ({
      ...category,
      detail: categoryDetail(category),
    })),
  ),
);

function petAmount(petId) {
  return categories.value.reduce((sum, category) => {
    const entry = category.petBreakdown.find(
      (b) => b.petId === String(petId),
    );
    return sum + (entry?.amount ?? 0);
  }, 0);
}

const petItems = computed(() => {
  // 반려동물별 지출이 하나도 없으면(태깅 안 된 지출만 있으면) 목록에 안 나온다
  const tagged = pets.value
    .map((pet) => ({
      ...pet,
      label: pet.name,
      amount: petAmount(pet.id),
    }))
    .filter((pet) => pet.amount > 0);

  return withPercentages(tagged).map((pet, index) => ({
    ...pet,
    colorToken: petColors[index % petColors.length],
  }));
});

const activeItems = computed(() =>
  isPetTabActive.value ? petItems.value : categoryItems.value,
);

const totalExpense = computed(() =>
  isPetTabActive.value
    ? petItems.value.reduce((sum, item) => sum + item.amount, 0)
    : Number(dashboardStore.category?.totalAmount ?? 0),
);

function petIcon(species) {
  return species === 'CAT' ? IconCat : IconDog;
}

function goToCategoryHistory(categoryKey) {
  router.push({
    path: '/wallet/history',
    query: { category: categoryKey },
  });
}

function goToPetHistory(petId) {
  router.push({
    path: '/wallet/history',
    query: { petId },
  });
}

async function fetchDashboard() {
  isLoading.value = true;
  loadError.value = false;

  try {
    const [, categoryResult] = await Promise.allSettled([
      petStore.pets.length ? Promise.resolve() : petStore.fetchPets(),
      dashboardStore.fetchCategory({
        groupBy: 'CATEGORY',
        yearMonth: currentYearMonth,
      }),
    ]);
    loadError.value = categoryResult.status === 'rejected';
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchDashboard);
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-app-bg) min-h-screen"
  >
    <header class="mb-(--space-6)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-gray-900)"
      >
        이번 달 지출
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        이번 달 지출을 한눈에 확인해요
      </p>
    </header>

    <div
      v-if="isLoading"
      class="py-(--space-8)"
    >
      <LoadingSpinner />
    </div>

    <section
      v-else-if="loadError"
      class="flex flex-col items-center gap-(--space-4) py-(--space-8) text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        지출 정보를 불러오지 못했어요.
      </p>
      <AppButton
        variant="secondary"
        size="sm"
        @click="fetchDashboard"
      >
        다시 시도
      </AppButton>
    </section>

    <template v-else>
      <div class="flex gap-(--space-2) mb-(--space-6)">
        <button
          type="button"
          :aria-pressed="activeTab === 'category'"
          class="h-(--control-height-sm) px-(--space-4) rounded-(--radius-full) text-(length:--font-sm) font-semibold"
          :class="
            activeTab === 'category'
              ? 'bg-(--color-gray-900) text-(color:--color-white)'
              : 'bg-(--color-white) text-(color:--color-slate-muted) shadow-(--shadow-sm)'
          "
          @click="selectTab('category')"
        >
          카테고리별
        </button>
        <button
          v-if="showPetTab"
          type="button"
          :aria-pressed="activeTab === 'pet'"
          class="h-(--control-height-sm) px-(--space-4) rounded-(--radius-full) text-(length:--font-sm) font-semibold"
          :class="
            activeTab === 'pet'
              ? 'bg-(--color-gray-900) text-(color:--color-white)'
              : 'bg-(--color-white) text-(color:--color-slate-muted) shadow-(--shadow-sm)'
          "
          @click="selectTab('pet')"
        >
          반려동물별
        </button>
      </div>

      <EmptyState
        v-if="activeItems.length === 0"
        :icon="IconStats"
        :message="isPetTabActive ? '반려동물로 분류된 지출이 없어요' : '이번 달 지출 내역이 없어요'"
      />

      <template v-else>
        <div
          class="relative grid size-(--dashboard-chart-size) place-items-center mx-auto mb-(--space-7)"
        >
          <ExpenseDonutChart :items="activeItems" />
          <div
            class="pointer-events-none absolute z-10 flex flex-col items-center text-center px-(--space-3)"
          >
            <p
              class="text-(length:--font-2xl) font-bold text-(color:--color-gray-900)"
            >
              {{ totalExpense.toLocaleString() }}원
            </p>
            <p
              class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
            >
              이번 달 총지출
            </p>
          </div>
        </div>

        <ul class="flex flex-col gap-(--space-3)">
          <li
            v-for="item in activeItems"
            :key="item.key ?? item.id"
          >
            <button
              type="button"
              class="w-full flex items-center gap-(--space-3) bg-(--color-white) shadow-(--shadow-sm) rounded-(--radius-lg) p-(--space-4) text-left"
              @click="
                isPetTabActive
                  ? goToPetHistory(item.id)
                  : goToCategoryHistory(item.key)
              "
            >
              <span
                class="shrink-0 w-(--space-3) h-(--space-3) rounded-(--radius-full)"
                :style="{
                  backgroundColor: `var(${item.colorToken})`,
                }"
              />

              <div class="flex-1 min-w-0">
                <div
                  class="flex items-center justify-between gap-(--space-2)"
                >
                  <p
                    class="flex items-center gap-(--space-1) text-(length:--font-base) font-semibold text-(color:--color-gray-900)"
                  >
                    <component
                      :is="petIcon(item.species)"
                      v-if="isPetTabActive"
                      size="24"
                    />
                    {{ item.label }}
                  </p>
                  <p
                    class="text-(length:--font-base) font-bold text-(color:--color-gray-900) shrink-0"
                  >
                    {{ item.percentage }}%
                  </p>
                </div>
                <p
                  class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
                >
                  {{ item.amount.toLocaleString() }}원
                </p>
                <p
                  v-if="item.detail"
                  class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
                >
                  {{ item.detail }}
                </p>
              </div>
            </button>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>
