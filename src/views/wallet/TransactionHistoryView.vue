<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomSheet from '@/components/common/BottomSheet.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import TransactionList from '@/components/common/TransactionList.vue';
import { formatYearMonth } from '@/utils/date';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconClose from '@/components/common/icons/IconClose.vue';
import { CATEGORY_LABELS } from '@/mocks/transaction';
import { usePetStore } from '@/stores/pet';
import { useTransactionStore } from '@/stores/transaction';

const route = useRoute();
const router = useRouter();
const transactionStore = useTransactionStore();
const petStore = usePetStore();

// 이번 달 지출 화면 등 다른 화면에서 카테고리를 지정해 들어올 수 있다
const categoryFilter = ref(
  typeof route.query.category === 'string' &&
    route.query.category in CATEGORY_LABELS
    ? route.query.category
    : null,
);
const categoryFilterLabel = computed(
  () => CATEGORY_LABELS[categoryFilter.value] ?? '',
);

function clearCategoryFilter() {
  categoryFilter.value = null;
  const rest = { ...route.query };
  delete rest.category;
  router.replace({ query: rest });
}

// 이번 달 지출 화면 "반려동물별" 탭에서 반려동물을 지정해 들어올 수 있다
function resolvePetFilterFromQuery() {
  return typeof route.query.petId === 'string' &&
    petStore.pets.some((pet) => String(pet.id) === route.query.petId)
    ? Number(route.query.petId)
    : null;
}

const petFilter = ref(resolvePetFilterFromQuery());
const petFilterLabel = computed(
  () => petStore.pets.find((pet) => pet.id === petFilter.value)?.name ?? '',
);

// /wallet/history는 쿼리만 바뀌어도 라우터가 컴포넌트를 재마운트하지 않으므로,
// 다른 반려동물 카드를 눌러 petId만 바뀌어 들어와도 필터가 갱신되도록 감지한다
watch(
  () => route.query.petId,
  () => {
    petFilter.value = resolvePetFilterFromQuery();
  },
);

function clearPetFilter() {
  petFilter.value = null;
  const rest = { ...route.query };
  delete rest.petId;
  router.replace({ query: rest });
}

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const transactions = computed(() => transactionStore.transactions);
const isLoading = ref(true);
const isError = ref(false);

// 거래 필터 (전체/충전/출금)
const filters = [
  { key: 'all', label: '전체' },
  { key: 'charge', label: '충전' },
  { key: 'withdraw', label: '출금' },
];
const activeFilter = ref('all');

// 월 선택 바텀시트
const isMonthSheetOpen = ref(false);
const today = new Date();
const activeMonth = ref({
  year: today.getFullYear(),
  month: today.getMonth() + 1,
});

const monthOptions = computed(() => {
  const options = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1,
    );
    options.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: formatYearMonth(d.getFullYear(), d.getMonth() + 1),
    });
  }
  return options;
});

const activeMonthLabel = computed(() => {
  const isCurrentMonth =
    activeMonth.value.year === today.getFullYear() &&
    activeMonth.value.month === today.getMonth() + 1;
  return isCurrentMonth
    ? '이번달'
    : `${activeMonth.value.month}월`;
});

function isActiveMonth(option) {
  return (
    option.year === activeMonth.value.year &&
    option.month === activeMonth.value.month
  );
}

function selectMonth(option) {
  activeMonth.value = { year: option.year, month: option.month };
  isMonthSheetOpen.value = false;
}

const filteredTransactions = computed(() => {
  return transactions.value
    .filter((tx) => {
      const [txYear, txMonth] = tx.date.split('-').map(Number);
      const matchesMonth =
        txYear === activeMonth.value.year &&
        txMonth === activeMonth.value.month;
      const matchesType =
        activeFilter.value === 'all' ||
        tx.type === activeFilter.value;
      const matchesCategory =
        !categoryFilter.value || tx.category === categoryFilter.value;
      const matchesPet =
        !petFilter.value || tx.petId === petFilter.value;
      return matchesMonth && matchesType && matchesCategory && matchesPet;
    })
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
});

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

    <h1
      class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-6)"
    >
      전체 결제내역
    </h1>

    <div
      v-if="isLoading"
      class="py-(--space-8)"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="isError"
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>거래 내역을 불러오지 못했습니다.</p>
    </div>

    <template v-else>
      <div
        class="flex items-center justify-between mb-(--space-4)"
      >
        <div class="flex gap-(--space-2)">
          <button
            v-for="filter in filters"
            :key="filter.key"
            type="button"
            class="h-(--space-7) px-(--space-4) rounded-full text-(length:--font-sm) font-semibold"
            :class="
              activeFilter === filter.key
                ? 'bg-(--color-navy) text-(color:--color-white)'
                : 'bg-(--color-surface) text-(color:--color-slate-muted)'
            "
            @click="activeFilter = filter.key"
          >
            {{ filter.label }}
          </button>
        </div>
        <button
          type="button"
          class="flex items-center gap-(--space-1) text-(length:--font-sm) text-(color:--color-slate-muted)"
          @click="isMonthSheetOpen = true"
        >
          {{ activeMonthLabel }}
          <IconChevronDown
            size="14"
            color="var(--color-slate-muted)"
          />
        </button>
      </div>

      <button
        v-if="categoryFilter"
        type="button"
        class="inline-flex items-center gap-(--space-1) h-(--space-7) px-(--space-3) rounded-full bg-(--color-navy) text-(color:--color-white) text-(length:--font-sm) font-semibold mb-(--space-4)"
        @click="clearCategoryFilter"
      >
        {{ categoryFilterLabel }} 필터 적용됨
        <IconClose
          size="14"
          color="var(--color-white)"
        />
      </button>
      <button
        v-else-if="petFilter"
        type="button"
        class="inline-flex items-center gap-(--space-1) h-(--space-7) px-(--space-3) rounded-full bg-(--color-navy) text-(color:--color-white) text-(length:--font-sm) font-semibold mb-(--space-4)"
        @click="clearPetFilter"
      >
        {{ petFilterLabel }} 필터 적용됨
        <IconClose
          size="14"
          color="var(--color-white)"
        />
      </button>

      <TransactionList :transactions="filteredTransactions" />
    </template>

    <BottomSheet
      v-model="isMonthSheetOpen"
      title="월 선택"
    >
      <ul>
        <li
          v-for="option in monthOptions"
          :key="`${option.year}-${option.month}`"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              isActiveMonth(option)
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectMonth(option)"
          >
            <span>{{ option.label }}</span>
            <IconCheck
              v-if="isActiveMonth(option)"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>
  </div>
</template>
