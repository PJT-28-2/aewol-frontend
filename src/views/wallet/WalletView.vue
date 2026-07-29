<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BottomSheet from '@/components/common/BottomSheet.vue';
import TransactionList from '@/components/common/TransactionList.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconStats from '@/components/common/icons/IconStats.vue';
import IconSavings from '@/components/common/icons/IconSavings.vue';
import IconSearch from '@/components/common/icons/IconSearch.vue';
import IconRecurring from '@/components/common/icons/IconRecurring.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const walletBalance = ref(482600);
const transactions = ref([
  {
    id: 9,
    date: '2026-07-18',
    title: '24시 우리동물병원',
    subtitle: '병원비 · 소로 진료',
    amount: -42000,
    type: 'withdraw',
    petId: 1,
    petName: '소로',
  },
  {
    id: 10,
    date: '2026-07-17',
    title: '펫사료마트',
    subtitle: '사료·간식 · LLM 분류',
    amount: -31200,
    type: 'withdraw',
    petId: null,
    petName: null,
  },
  {
    id: 11,
    date: '2026-07-17',
    title: '엄마 · 충전',
    subtitle: '펫지갑에 100,000원 충전',
    amount: 100000,
    type: 'charge',
    petId: null,
    petName: null,
  },
  {
    id: 12,
    date: '2026-07-15',
    title: '미미미용실',
    subtitle: '미용비 · 나비 미용',
    amount: -38000,
    type: 'withdraw',
    petId: 2,
    petName: '나비',
  },
  {
    id: 13,
    date: '2026-06-20',
    title: '24시 우리동물병원',
    subtitle: '병원비 · 나비 진료',
    amount: -25000,
    type: 'withdraw',
    petId: 2,
    petName: '나비',
  },
  {
    id: 14,
    date: '2026-06-05',
    title: '아빠 · 충전',
    subtitle: '펫지갑에 50,000원 충전',
    amount: 50000,
    type: 'charge',
    petId: null,
    petName: null,
  },
  {
    id: 15,
    date: '2026-05-12',
    title: '펫사료마트',
    subtitle: '사료·간식 · LLM 분류',
    amount: -28000,
    type: 'withdraw',
    petId: null,
    petName: null,
  },
]);

const isLoading = ref(true);

// 서브 메뉴 3종
const subMenus = [
  { label: '지출리포트', to: '/dashboard', icon: IconStats },
  { label: '저금통', to: '/donation', icon: IconSavings },
  { label: '전체내역', to: '/wallet/history', icon: IconSearch },
];

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

// 거래 필터 (전체/충전/출금 + 선택된 월)
const filters = [
  { key: 'all', label: '전체' },
  { key: 'charge', label: '충전' },
  { key: 'withdraw', label: '출금' },
];
const activeFilter = ref('all');

const filteredTransactions = computed(() => {
  return transactions.value.filter((tx) => {
    const [txYear, txMonth] = tx.date.split('-').map(Number);
    const matchesMonth =
      txYear === activeMonth.value.year &&
      txMonth === activeMonth.value.month;
    const matchesType =
      activeFilter.value === 'all' || tx.type === activeFilter.value;
    return matchesMonth && matchesType;
  });
});

const router = useRouter();

function handleCharge() {
  router.push('/wallet/charge');
}
function handleTransfer() {
  router.push('/wallet/transfer');
}

onMounted(async () => {
  isLoading.value = false;
});
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-bg) min-h-screen"
  >
    <!-- 헤더 -->
    <div
      class="flex items-center justify-between mb-(--space-4)"
    >
      <h1
        class="text-(length:--font-lg) font-bold text-(color:--color-navy)"
      >
        펫지갑
      </h1>
      <router-link
        to="/payment/recurring"
        class="inline-flex items-center gap-(--space-1) text-(length:--font-sm) font-semibold text-(color:--color-navy) no-underline"
      >
        <IconRecurring size="16" />
        정기결제
      </router-link>
    </div>

    <!-- 잔액 -->
    <p
      class="text-(length:--font-3xl) font-bold text-(color:--color-navy) mb-(--space-4)"
    >
      {{ walletBalance.toLocaleString() }}원
    </p>

    <!-- 충전 / 이체 버튼 -->
    <div class="flex gap-(--space-2) mb-(--space-7)">
      <button
        type="button"
        class="flex-1 h-[44px] rounded-md bg-(--color-olive) text-(color:--color-white) text-(length:--font-base) font-semibold"
        @click="handleCharge"
      >
        충전
      </button>
      <button
        type="button"
        class="flex-1 h-[44px] rounded-md bg-(--color-gray-100) text-(color:--color-slate-dark) text-(length:--font-base) font-semibold"
        @click="handleTransfer"
      >
        이체
      </button>
    </div>

    <!-- 서브 메뉴 3종 -->
    <div class="flex justify-around mb-(--space-6)">
      <router-link
        v-for="menu in subMenus"
        :key="menu.label"
        :to="menu.to"
        class="flex flex-col items-center gap-(--space-2) no-underline text-(color:--color-slate-dark) text-(length:--font-sm) font-medium"
      >
        <span
          class="flex items-center justify-center w-(--space-9) h-(--space-9) rounded-full bg-(--color-surface)"
        >
          <component
            :is="menu.icon"
            size="20"
            color="var(--color-navy)"
          />
        </span>
        {{ menu.label }}
      </router-link>
    </div>

    <div
      v-if="isLoading"
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>로딩 중...</p>
    </div>

    <template v-else>
      <!-- 거래 필터 탭 -->
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

      <!-- 거래 리스트 -->
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
