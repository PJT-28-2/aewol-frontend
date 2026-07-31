<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ExpenseDonutChart from '@/components/dashboard/ExpenseDonutChart.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';
import IconStats from '@/components/common/icons/IconStats.vue';
import { usePetStore } from '@/stores/pet';
import { useTransactionStore } from '@/stores/transaction';

const router = useRouter();
const route = useRoute();
const petStore = usePetStore();
const transactionStore = useTransactionStore();

const pets = computed(() => petStore.pets);

const CATEGORY_COLOR_TOKENS = {
  MEDICAL: '--color-navy',
  FOOD: '--color-olive',
  GROOMING: '--color-gold',
  SUPPLIES: '--color-gold-dark',
  ETC: '--color-danger-dark',
};

// 이번 달 출금 내역을 category별로 합산한 값 (useTransactionStore가 단일 소스)
// petBreakdown이 비어있으면 반려동물이 지정 안 된 지출 → 반려동물별 탭에는 집계되지 않는다
const today = new Date();
const categories = computed(() =>
  transactionStore
    .categoryBreakdown(today.getFullYear(), today.getMonth() + 1)
    .map((entry) => ({
      ...entry,
      colorToken: CATEGORY_COLOR_TOKENS[entry.key],
    })),
);

function categoryDetail(category) {
  if (!category.petBreakdown.length) return '';

  return category.petBreakdown
    .map((entry) => {
      const pet = pets.value.find((p) => p.id === entry.petId);
      return pet
        ? `${pet.name} ${entry.amount.toLocaleString()}원`
        : '';
    })
    .filter(Boolean)
    .join(' · ');
}

function hasTaggedPetData() {
  return pets.value.some((pet) => petAmount(pet.id) > 0);
}

const isLoading = ref(true);

// 반려동물이 2마리 이상이고, 태깅된 지출이 하나라도 있을 때만 "반려동물별" 탭을 보여준다
const showPetTab = computed(
  () => pets.value.length >= 2 && hasTaggedPetData(),
);

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

// HomeView.vue와 동일한 팔레트
const petColors = [
  '--color-navy',
  '--color-olive',
  '--color-chart-blue',
  '--color-chart-purple',
  '--color-gold-dark',
  '--color-danger-dark',
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
      (b) => b.petId === petId,
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
  activeTab.value === 'pet' && showPetTab.value
    ? petItems.value
    : categoryItems.value,
);

const totalExpense = computed(() =>
  categories.value.reduce((sum, item) => sum + item.amount, 0),
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

function goBack() {
  router.back();
}

onMounted(() => {
  isLoading.value = false;
});
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-screen"
  >
    <button
      type="button"
      class="mb-(--space-3) text-(color:--color-navy)"
      aria-label="뒤로 가기"
      @click="goBack"
    >
      <IconArrowLeft size="24" />
    </button>

    <header class="mb-(--space-6)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
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

    <template v-else>
      <div class="flex gap-(--space-2) mb-(--space-6)">
        <button
          type="button"
          :aria-pressed="activeTab === 'category'"
          class="h-(--control-height-sm) px-(--space-4) rounded-(--radius-full) text-(length:--font-sm) font-semibold"
          :class="
            activeTab === 'category'
              ? 'bg-(--color-navy) text-(color:--color-white)'
              : 'bg-(--color-surface) text-(color:--color-slate-muted)'
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
              ? 'bg-(--color-navy) text-(color:--color-white)'
              : 'bg-(--color-surface) text-(color:--color-slate-muted)'
          "
          @click="selectTab('pet')"
        >
          반려동물별
        </button>
      </div>

      <EmptyState
        v-if="categoryItems.length === 0"
        :icon="IconStats"
        message="이번 달 지출 내역이 없어요"
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
              class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
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
              class="w-full flex items-center gap-(--space-3) bg-(--color-surface) rounded-(--radius-xl) p-(--space-4) text-left"
              @click="
                activeTab === 'category'
                  ? goToCategoryHistory(item.key)
                  : goToPetHistory(item.id)
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
                    class="flex items-center gap-(--space-1) text-(length:--font-base) font-semibold text-(color:--color-navy)"
                  >
                    <component
                      :is="petIcon(item.species)"
                      v-if="activeTab === 'pet'"
                      size="16"
                      color="var(--color-navy)"
                    />
                    {{ item.label }}
                  </p>
                  <p
                    class="text-(length:--font-base) font-bold text-(color:--color-navy) shrink-0"
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
