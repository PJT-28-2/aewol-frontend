<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BottomSheet from '@/components/common/BottomSheet.vue';
import TransactionList from '@/components/common/TransactionList.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';

const router = useRouter();

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const transactions = ref([]);
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
      label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
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
  return transactions.value.filter((tx) => {
    const [txYear, txMonth] = tx.date.split('-').map(Number);
    const matchesMonth =
      txYear === activeMonth.value.year &&
      txMonth === activeMonth.value.month;
    const matchesType =
      activeFilter.value === 'all' ||
      tx.type === activeFilter.value;
    return matchesMonth && matchesType;
  });
});

function goBack() {
  router.back();
}

onMounted(async () => {
  try {
    transactions.value = [
      {
        id: 1,
        date: '2026-07-18',
        title: '24시 우리동물병원',
        subtitle: '병원비 · 소로 진료',
        amount: -42000,
        type: 'withdraw',
        petId: 1,
        petName: '소로',
      },
      {
        id: 2,
        date: '2026-07-17',
        title: '펫사료마트',
        subtitle: '사료·간식 · LLM 분류',
        amount: -31200,
        type: 'withdraw',
        petId: null,
        petName: null,
      },
      {
        id: 3,
        date: '2026-07-17',
        title: '엄마 · 충전',
        subtitle: '펫지갑에 100,000원 충전',
        amount: 100000,
        type: 'charge',
        petId: null,
        petName: null,
      },
      {
        id: 4,
        date: '2026-07-15',
        title: '미미미용실',
        subtitle: '미용비 · 나비 미용',
        amount: -38000,
        type: 'withdraw',
        petId: 2,
        petName: '나비',
      },
      {
        id: 5,
        date: '2026-07-12',
        title: '24시 제주동물병원',
        subtitle: 'SOS포켓 · 응급진료',
        amount: -150000,
        type: 'withdraw',
        petId: null,
        petName: null,
      },
      {
        id: 6,
        date: '2026-07-10',
        title: '펫프렌즈',
        subtitle: '위생용품 · 자동분류',
        amount: -18900,
        type: 'withdraw',
        petId: null,
        petName: null,
      },
      {
        id: 7,
        date: '2026-06-20',
        title: '24시 우리동물병원',
        subtitle: '병원비 · 나비 진료',
        amount: -25000,
        type: 'withdraw',
        petId: 2,
        petName: '나비',
      },
      {
        id: 8,
        date: '2026-06-05',
        title: '아빠 · 충전',
        subtitle: '펫지갑에 50,000원 충전',
        amount: 50000,
        type: 'charge',
        petId: null,
        petName: null,
      },
    ];
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
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
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>로딩 중...</p>
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
