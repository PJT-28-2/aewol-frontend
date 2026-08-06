<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BottomSheet from '@/components/common/BottomSheet.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import TransactionList from '@/components/common/TransactionList.vue';
import { formatYearMonth } from '@/utils/date';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import iconRecurring3d from '@/assets/images/icons-3d/calendar_3d.png';
import iconStats3d from '@/assets/images/icons-3d/bar_chart_3d.png';
import iconSavings3d from '@/assets/images/icons-3d/money_bag_3d.png';
import iconSearch3d from '@/assets/images/icons-3d/magnifying_glass_tilted_right_3d.png';
import iconCat3d from '@/assets/images/icons-3d/cat_face_3d.png';
import iconDog3d from '@/assets/images/icons-3d/dog_face_3d.png';
import { mockWalletBalance } from '@/mocks/transaction';
import { usePetStore } from '@/stores/pet';
import { useTransactionStore } from '@/stores/transaction';

const transactionStore = useTransactionStore();
const petStore = usePetStore();

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const walletBalance = ref(mockWalletBalance);
const transactions = computed(
  () => transactionStore.transactions,
);

const isLoading = ref(true);

// 서브 메뉴 4종
const subMenus = [
  { label: '지출리포트', to: '/dashboard', icon: iconStats3d },
  {
    label: '짜투리 저금통',
    to: '/donation',
    icon: iconSavings3d,
  },
  {
    label: '정기결제',
    to: '/payment/recurring',
    icon: iconRecurring3d,
  },
  {
    label: '전체내역',
    to: '/wallet/history',
    icon: iconSearch3d,
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
  return species === 'CAT' ? iconCat3d : iconDog3d;
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
        !petFilter.value || tx.petId === petFilter.value;
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
function handleTransfer() {
  router.push('/wallet/transfer');
}

onMounted(async () => {
  isLoading.value = false;
});
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-gray-100) min-h-screen"
  >
    <!-- 잔액 + 충전/송금 카드 -->
    <div
      class="bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-md) px-(--space-5) py-(--space-5) mb-(--space-4)"
    >
      <p
        class="text-(length:--font-sm) text-(color:--color-slate-muted)"
      >
        애월지갑 잔액
      </p>
      <p
        class="text-(length:--font-3xl) font-bold text-(color:--color-gray-900) mt-(--space-1)"
      >
        {{ walletBalance.toLocaleString() }}원
      </p>
      <div class="flex gap-(--space-2) mt-(--space-2)">
        <button
          type="button"
          class="flex-1 h-[38px] rounded-(--radius-md) bg-(--color-pastel-frost) text-(color:--color-navy) text-(length:--font-base) font-semibold"
          @click="handleCharge"
        >
          충전
        </button>
        <button
          type="button"
          class="flex-1 h-[38px] rounded-(--radius-md) bg-(--color-pastel-frost) text-(color:--color-navy) text-(length:--font-base) font-semibold"
          @click="handleTransfer"
        >
          송금
        </button>
      </div>
    </div>

    <!-- 서브 메뉴 3종 -->
    <div class="grid grid-cols-4 gap-(--space-2) mb-(--space-4)">
      <router-link
        v-for="menu in subMenus"
        :key="menu.label"
        :to="menu.to"
        class="flex flex-col items-center justify-center gap-(--space-2) bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-md) px-(--space-1) py-(--space-3) no-underline text-(color:--color-gray-900) text-(length:--font-xs) font-medium text-center leading-tight"
      >
        <img
          :src="menu.icon"
          alt=""
          class="w-[26px] h-[26px] object-contain saturate-[0.8] brightness-[1.03] contrast-[0.95]"
        />
        {{ menu.label }}
      </router-link>
    </div>

    <div v-if="isLoading" class="py-(--space-8)">
      <LoadingSpinner />
    </div>

    <template v-else>
      <!-- 거래 리스트 카드 -->
      <div
        class="bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-sm) px-(--space-4) py-(--space-3)"
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
        <TransactionList :transactions="filteredTransactions" />
      </div>
    </template>

    <BottomSheet v-model="isTypeSheetOpen" title="거래 유형">
      <ul>
        <li v-for="filter in filters" :key="filter.key">
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

    <BottomSheet v-model="isPetSheetOpen" title="반려동물 선택">
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
        <li v-for="pet in petStore.pets" :key="pet.id">
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
              <img
                :src="petIcon(pet.species)"
                :alt="
                  pet.species === 'CAT' ? '고양이' : '강아지'
                "
                class="w-[22px] h-[22px] object-contain saturate-[0.8] brightness-[1.03] contrast-[0.95]"
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

    <BottomSheet v-model="isMonthSheetOpen" title="월 선택">
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
