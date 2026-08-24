<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import TransactionList from '@/components/common/TransactionList.vue';
import { formatYearMonth } from '@/utils/date';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconClose from '@/components/common/icons/IconClose.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';
import { CATEGORY_LABELS } from '@/constants/transactionCategory';
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
    ? route.query.petId
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

function petIcon(species) {
  return species === 'CAT' ? IconCat : IconDog;
}

// 반려동물 선택 바텀시트 (반려동물이 2마리 이상일 때만 필터가 의미 있다)
const isPetSheetOpen = ref(false);
const petFilterButtonLabel = computed(() => petFilterLabel.value || '반려동물');
const hasMultiplePets = computed(() => petStore.pets.length > 1);

function selectPetFilter(petId) {
  petFilter.value = petId;
  isPetSheetOpen.value = false;
  const rest = { ...route.query };
  if (petId) {
    rest.petId = String(petId);
  } else {
    delete rest.petId;
  }
  router.replace({ query: rest });
}

const transactions = computed(() => transactionStore.transactions);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const isError = ref(false);
const loadMoreError = ref(false);

// 지출리포트(DashboardView)에서 카테고리/반려동물 카드를 눌러 들어온 진입(=category 또는
// petId 쿼리가 있는 상태)은 "이 카테고리/반려동물의 지출 상세"가 목적이라, REFUND가 섞여
// 나오면 안 된다. 반면 지갑 메인 > 전체 거래내역처럼 필터 없이 들어온 일반 조회는 REFUND도
// 함께 보여주는 게 기존 의도된 동작이라 그대로 둔다. activeFilter를 직접 '충전'/'출금'으로
// 바꾼 경우는 사용자가 명시적으로 고른 값이라 이 분기로 덮어쓰지 않는다.
// 백엔드가 type=PAYMENT를 지원하며, PAYMENT/WITHDRAW 필터 양쪽 다 환불(REFUND)된 원 결제를
// NOT EXISTS로 이미 제외해준다(TransactionMapper.xml) — 클라이언트에서 따로 걸러낼 필요 없음.
function transactionRequestParams(cursor = null) {
  const isCategoryOrPetEntry = Boolean(categoryFilter.value || petFilter.value);
  const type =
    activeFilter.value === 'all' && isCategoryOrPetEntry
      ? 'PAYMENT'
      : activeFilter.value.toUpperCase();
  return {
    type,
    period: `${activeMonth.value.year}-${String(activeMonth.value.month).padStart(2, '0')}`,
    size: 100,
    ...(cursor ? { cursor } : {}),
  };
}

async function fetchTransactions() {
  isLoading.value = true;
  isError.value = false;

  try {
    await transactionStore.fetchTransactions(transactionRequestParams());
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

async function fetchMoreTransactions() {
  if (!transactionStore.nextCursor || isLoadingMore.value) return;
  isLoadingMore.value = true;
  loadMoreError.value = false;

  try {
    await transactionStore.fetchTransactions(
      transactionRequestParams(transactionStore.nextCursor),
      { append: true },
    );
  } catch {
    loadMoreError.value = true;
  } finally {
    isLoadingMore.value = false;
  }
}

// 거래 타입 선택 바텀시트 (전체/충전/출금)
const filters = [
  { key: 'all', label: '전체' },
  { key: 'charge', label: '충전' },
  { key: 'withdraw', label: '출금' },
];
const activeFilter = ref('all');
const isTypeSheetOpen = ref(false);
const activeFilterLabel = computed(() =>
  activeFilter.value === 'all'
    ? '유형'
    : filters.find((filter) => filter.key === activeFilter.value)?.label ?? '유형',
);

function selectType(key) {
  activeFilter.value = key;
  isTypeSheetOpen.value = false;
  fetchTransactions();
}

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
  fetchTransactions();
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
        petFilter.value === null ||
        (tx.petId !== null && String(tx.petId) === String(petFilter.value));
      return matchesMonth && matchesType && matchesCategory && matchesPet;
    })
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
});

onMounted(async () => {
  // hasMultiplePets/반려동물 필터 시트도 petStore.pets를 쓰므로, petId 쿼리 유무와 무관하게
  // pets가 비어있으면 로드는 항상 시도한다. 다만 petFilter 계산(=petId를 유효한 값으로
  // 해석하는 것)에만 pets 데이터가 필요하므로, petId 쿼리로 들어온 경우에만 그 로드를
  // 기다렸다가 거래내역을 조회한다 — 예전처럼 Promise.allSettled로 무조건 병렬 실행하면
  // 새로고침 등 pets가 비어있는 상태에서 petFilter가 null인 채로 첫 조회가 나가버린다.
  // category 진입이나 필터 없는 일반 진입은 pets 로드를 기다릴 필요가 없으니 백그라운드로
  // 흘려보내고 거래내역 조회를 바로 시작한다.
  if (!petStore.pets.length) {
    const petsLoaded = petStore.fetchPets().catch(() => {});
    if (route.query.petId) await petsLoaded;
  }
  petFilter.value = resolvePetFilterFromQuery();
  await fetchTransactions();
});
</script>

<template>
  <div
    class="p-(--space-4) bg-(--color-app-bg) min-h-screen"
  >
    <h1
      class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-6)"
    >
      거래 내역
    </h1>

    <div
      v-if="isLoading"
      class="py-(--space-8)"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="isError"
      class="flex flex-col items-center py-(--space-8) text-center text-(color:--color-gray-500)"
      role="alert"
    >
      <p>거래 내역을 불러오지 못했어요.</p>
      <AppButton
        class="mt-(--space-4)"
        size="sm"
        @click="fetchTransactions"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else>
      <div
        class="flex items-center justify-between mb-(--space-4)"
      >
        <div class="flex items-center gap-(--space-3)">
          <button
            type="button"
            class="flex items-center gap-(--space-1) text-(length:--font-sm)"
            :class="
              activeFilter !== 'all'
                ? 'font-semibold text-(color:--color-navy)'
                : 'text-(color:--color-slate-muted)'
            "
            @click="isTypeSheetOpen = true"
          >
            {{ activeFilterLabel }}
            <IconChevronDown
              size="14"
              :color="activeFilter !== 'all' ? 'var(--color-navy)' : 'var(--color-slate-muted)'"
            />
          </button>
          <button
            v-if="hasMultiplePets"
            type="button"
            class="flex items-center gap-(--space-1) text-(length:--font-sm)"
            :class="
              petFilter
                ? 'font-semibold text-(color:--color-navy)'
                : 'text-(color:--color-slate-muted)'
            "
            @click="isPetSheetOpen = true"
          >
            {{ petFilterButtonLabel }}
            <IconChevronDown
              size="14"
              :color="petFilter ? 'var(--color-navy)' : 'var(--color-slate-muted)'"
            />
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
        class="inline-flex items-center gap-(--space-1) h-(--space-7) px-(--space-3) rounded-full bg-(--color-brand-dark) text-(color:--color-contrast) text-(length:--font-sm) font-semibold mb-(--space-4)"
        @click="clearCategoryFilter"
      >
        {{ categoryFilterLabel }} 필터 적용됨
        <IconClose
          size="14"
          color="var(--color-contrast)"
        />
      </button>

      <TransactionList
        :transactions="filteredTransactions"
        empty-text="해당 조건의 거래 내역이 없어요"
      />
      <AppButton
        v-if="transactionStore.nextCursor"
        class="mt-(--space-4)"
        variant="secondary"
        size="md"
        block
        :loading="isLoadingMore"
        @click="fetchMoreTransactions"
      >
        거래 내역 더 보기
      </AppButton>
      <p
        v-if="loadMoreError"
        class="mt-(--space-3) text-center text-(length:--font-sm) text-(color:--color-danger-strong)"
        role="alert"
      >
        추가 거래 내역을 불러오지 못했어요. 다시 시도해주세요.
      </p>
    </template>

    <BottomSheet
      v-model="isTypeSheetOpen"
      title="거래 유형"
    >
      <ul>
        <li
          v-for="filter in filters"
          :key="filter.key"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              activeFilter === filter.key
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectType(filter.key)"
          >
            <span>{{ filter.label }}</span>
            <IconCheck
              v-if="activeFilter === filter.key"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>

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

    <BottomSheet
      v-model="isPetSheetOpen"
      title="반려동물 선택"
    >
      <ul>
        <li>
          <button
            type="button"
            class="w-full flex items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              !petFilter
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectPetFilter(null)"
          >
            <span>전체</span>
            <IconCheck
              v-if="!petFilter"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
        <li
          v-for="pet in petStore.pets"
          :key="pet.id"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              petFilter === pet.id
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectPetFilter(pet.id)"
          >
            <span class="flex items-center gap-(--space-2)">
              <component
                :is="petIcon(pet.species)"
                size="24"
              />
              {{ pet.name }}
            </span>
            <IconCheck
              v-if="petFilter === pet.id"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>
  </div>
</template>
