<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import TransactionList from '@/components/common/TransactionList.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import { formatYearMonth } from '@/utils/date';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconStats from '@/components/common/icons/IconStats.vue';
import IconWallet from '@/components/common/icons/IconWallet.vue';
import IconRecurring from '@/components/common/icons/IconRecurring.vue';
import IconSavings from '@/components/common/icons/IconSavings.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';
import { useMemberStore } from '@/stores/member';
import { usePetStore } from '@/stores/pet';
import { useTransactionStore } from '@/stores/transaction';
import { useWalletStore } from '@/stores/wallet';

const transactionStore = useTransactionStore();
const memberStore = useMemberStore();
const petStore = usePetStore();
const walletStore = useWalletStore();

const memberName = computed(() => memberStore.profile?.name || '회원');
const walletBalance = computed(() => walletStore.wallet?.totalBalance ?? 0);
const transactions = computed(() => transactionStore.recentTransactions);

const walletLoading = ref(true);
const loadError = ref(false);
const transactionLoading = ref(true);
const transactionLoadError = ref(false);

async function fetchWallet() {
  walletLoading.value = true;
  loadError.value = false;

  try {
    await walletStore.fetchWallet();
  } catch {
    loadError.value = true;
  } finally {
    walletLoading.value = false;
  }
}

async function fetchRecentTransactions() {
  transactionLoading.value = true;
  transactionLoadError.value = false;

  try {
    await transactionStore.fetchRecentTransactions({
      type: activeFilter.value.toUpperCase(),
      limit: 20,
    });
  } catch {
    transactionLoadError.value = true;
  } finally {
    transactionLoading.value = false;
  }
}

// 서브 메뉴 4종
const subMenus = [
  { label: '지출리포트', to: '/dashboard', icon: IconStats, tone: 'blue' },
  {
    label: '거래 내역',
    to: '/wallet/history',
    icon: IconWallet,
    tone: 'green',
  },
  {
    label: '정기결제',
    to: '/payment/recurring',
    icon: IconRecurring,
    tone: 'pink',
  },
  {
    label: '저금통',
    to: '/donation',
    icon: IconSavings,
    tone: 'yellow',
  },
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

// 거래 유형 선택 바텀시트 (전체/충전/출금)
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
    : (filters.find(
        (filter) => filter.key === activeFilter.value,
      )?.label ?? '유형'),
);

function selectType(key) {
  activeFilter.value = key;
  isTypeSheetOpen.value = false;
  fetchRecentTransactions();
}

// 반려동물 선택 바텀시트
const isPetSheetOpen = ref(false);
const petFilter = ref(null);
const petFilterLabel = computed(
  () =>
    petStore.pets.find((pet) => pet.id === petFilter.value)
      ?.name ?? '',
);
const petFilterButtonLabel = computed(
  () => petFilterLabel.value || '반려동물',
);
const hasMultiplePets = computed(() => petStore.pets.length > 1);

function petIcon(species) {
  return species === 'CAT' ? IconCat : IconDog;
}

function selectPetFilter(petId) {
  petFilter.value = petId;
  isPetSheetOpen.value = false;
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
      const matchesPet =
        petFilter.value === null ||
        (tx.petId !== null && String(tx.petId) === String(petFilter.value));
      return matchesMonth && matchesType && matchesPet;
    })
    .sort((a, b) =>
      `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
    );
});

const router = useRouter();

function handleCharge() {
  router.push({
    path: '/wallet/charge',
    query: { from: 'wallet' },
  });
}
function handleWithdraw() {
  router.push('/wallet/transfer');
}

onMounted(() => {
  fetchWallet();
  fetchRecentTransactions();
  if (!memberStore.profile) memberStore.fetchProfile().catch(() => {});
  if (!petStore.pets.length) petStore.fetchPets().catch(() => {});
});
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) px-(--space-5) pt-(--space-3) pb-(--space-8)"
  >
    <header class="mb-(--space-5) flex h-[42px] items-center">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        지갑
      </h1>
    </header>

    <!-- 잔액 + 충전/출금 카드 -->
    <div
      class="relative mb-(--space-4) overflow-hidden rounded-[28px] bg-(--color-brand-dark) px-(--space-6) py-(--space-6) text-(color:--color-contrast) shadow-(--shadow-card)"
    >
      <p
        class="text-(length:--font-sm) text-(color:--color-slate-light)"
      >
        {{ memberName }}님의 애월지갑
      </p>
      <p
        class="relative z-1 mt-(--space-2) text-[30px] font-bold tracking-[-0.03em] text-(color:--color-contrast)"
        aria-live="polite"
      >
        <span v-if="walletLoading">잔액 조회 중</span>
        <span v-else-if="loadError">잔액 조회 실패</span>
        <span v-else>{{ walletBalance.toLocaleString() }}원</span>
      </p>
      <div class="relative z-1 mt-(--space-2) flex justify-end gap-(--space-2)">
        <button
          type="button"
          class="rounded-(--radius-full) bg-(--color-white) px-(--space-5) py-[10px] text-(length:--font-sm) font-semibold text-(color:--color-navy)"
          @click="handleCharge"
        >
          충전
        </button>
        <button
          type="button"
          class="rounded-(--radius-full) bg-(--color-leaf) px-(--space-5) py-[10px] text-(length:--font-sm) font-bold text-(color:--color-navy)"
          @click="handleWithdraw"
        >
          출금
        </button>
      </div>
    </div>

    <div
      v-if="loadError"
      class="mb-(--space-4) flex items-center justify-between gap-(--space-3) rounded-(--radius-xl) bg-(--color-danger-soft) px-(--space-4) py-(--space-3)"
      role="alert"
    >
      <p class="text-(length:--font-sm) text-(color:--color-danger-strong)">
        지갑 잔액을 불러오지 못했어요.
      </p>
      <AppButton
        variant="danger"
        size="sm"
        @click="fetchWallet"
      >
        다시 시도
      </AppButton>
    </div>

    <!-- 지갑 빠른 메뉴 -->
    <nav
      class="mb-(--space-5) grid grid-cols-4 overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) px-(--space-2)"
      aria-label="지갑 빠른 메뉴"
    >
      <router-link
        v-for="menu in subMenus"
        :key="menu.label"
        :to="menu.to"
        class="flex min-w-0 flex-col items-center justify-center gap-(--space-2) px-(--space-1) py-(--space-4) text-center text-[11px] leading-tight font-medium text-(color:--color-gray-700) no-underline transition-colors active:bg-(--color-gray-100)"
      >
        <FeatureIconTile
          :icon="menu.icon"
          :tone="menu.tone"
        />
        <span class="truncate">{{ menu.label }}</span>
      </router-link>
    </nav>

    <div
      v-if="transactionLoading"
      class="py-(--space-8)"
    >
      <LoadingSpinner />
    </div>

    <template v-else>
      <h2 class="mb-(--space-3) px-(--space-1) text-(length:--font-lg) font-bold text-(color:--color-gray-900)">
        최근 거래
      </h2>
      <div
        v-if="transactionLoadError"
        class="mb-(--space-4) flex flex-col items-center rounded-(--radius-2xl) bg-(--color-white) py-(--space-8) text-(color:--color-gray-500)"
        role="alert"
      >
        <p>최근 거래를 불러오지 못했어요.</p>
        <AppButton
          class="mt-(--space-4)"
          size="sm"
          @click="fetchRecentTransactions"
        >
          다시 시도
        </AppButton>
      </div>
      <!-- 거래 리스트 카드 -->
      <div
        v-else
        class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) px-(--space-4) py-(--space-4)"
      >
        <!-- 거래 필터 탭 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-(--space-3)">
            <button
              type="button"
              class="flex items-center gap-(--space-1) text-(length:--font-sm)"
              :class="
                activeFilter !== 'all'
                  ? 'font-semibold text-(color:--color-gray-900)'
                  : 'text-(color:--color-slate-muted)'
              "
              @click="isTypeSheetOpen = true"
            >
              {{ activeFilterLabel }}
              <IconChevronDown
                size="14"
                :color="
                  activeFilter !== 'all'
                    ? 'var(--color-gray-900)'
                    : 'var(--color-slate-muted)'
                "
              />
            </button>
            <button
              v-if="hasMultiplePets"
              type="button"
              class="flex items-center gap-(--space-1) text-(length:--font-sm)"
              :class="
                petFilter
                  ? 'font-semibold text-(color:--color-gray-900)'
                  : 'text-(color:--color-slate-muted)'
              "
              @click="isPetSheetOpen = true"
            >
              {{ petFilterButtonLabel }}
              <IconChevronDown
                size="14"
                :color="
                  petFilter
                    ? 'var(--color-gray-900)'
                    : 'var(--color-slate-muted)'
                "
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

        <!-- 거래 리스트 -->
        <TransactionList
          :transactions="filteredTransactions"
          :detail-query="{ from: 'wallet' }"
        />
      </div>
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
                color="var(--color-navy)"
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
