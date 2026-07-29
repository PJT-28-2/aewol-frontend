<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconBarberShop from '@/components/common/icons/IconBarberShop.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconDog from '@/components/common/icons/IconDog.vue';
import IconDogBowl from '@/components/common/icons/IconDogBowl.vue';
import IconHospital from '@/components/common/icons/IconHospital.vue';
import IconShowerGel from '@/components/common/icons/IconShowerGel.vue';
import IconSos from '@/components/common/icons/IconSos.vue';
import IconWallet from '@/components/common/icons/IconWallet.vue';

const route = useRoute();
const router = useRouter();
const txId = computed(() => route.params.txId);

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const mockTransactionsById = {
  1: {
    id: 1,
    title: '24시 우리동물병원',
    subtitle: '병원비 · 소로 진료',
    amount: -42000,
    date: '2026-07-18',
    time: '15:24',
    type: 'withdraw',
    category: 'MEDICAL',
    petId: 1,
    paymentMethod: '애월 통합 지갑',
  },
  2: {
    id: 2,
    title: '펫사료마트',
    subtitle: '사료·간식 · LLM 분류',
    amount: -31200,
    date: '2026-07-17',
    time: '11:32',
    type: 'withdraw',
    category: 'FOOD',
    petId: null,
    paymentMethod: '애월 통합 지갑',
  },
  3: {
    id: 3,
    title: '엄마 · 충전',
    subtitle: '펫지갑에 100,000원 충전',
    amount: 100000,
    date: '2026-07-17',
    time: '09:05',
    type: 'charge',
    chargeMethod: '계좌이체',
  },
  4: {
    id: 4,
    title: '미미미용실',
    subtitle: '미용비 · 나비 미용',
    amount: -38000,
    date: '2026-07-15',
    time: '14:10',
    type: 'withdraw',
    category: 'GROOMING',
    petId: 2,
    paymentMethod: '애월 통합 지갑',
  },
  5: {
    id: 5,
    title: '24시 제주동물병원',
    subtitle: 'SOS포켓 · 응급진료',
    amount: -150000,
    date: '2026-07-12',
    time: '22:47',
    type: 'withdraw',
    category: 'SOS',
    petId: null,
    paymentMethod: '애월 통합 지갑',
  },
  6: {
    id: 6,
    title: '펫프렌즈',
    subtitle: '위생용품 · 자동분류',
    amount: -18900,
    date: '2026-07-10',
    time: '16:20',
    type: 'withdraw',
    category: 'SUPPLIES',
    petId: null,
    paymentMethod: '애월 통합 지갑',
  },
  7: {
    id: 7,
    title: '24시 우리동물병원',
    subtitle: '병원비 · 나비 진료',
    amount: -25000,
    date: '2026-06-20',
    time: '18:03',
    type: 'withdraw',
    category: 'MEDICAL',
    petId: 2,
    paymentMethod: '애월 통합 지갑',
  },
  8: {
    id: 8,
    title: '아빠 · 충전',
    subtitle: '펫지갑에 50,000원 충전',
    amount: 50000,
    date: '2026-06-05',
    time: '20:15',
    type: 'charge',
    chargeMethod: '카드결제',
  },
  9: {
    id: 9,
    title: '24시 우리동물병원',
    subtitle: '병원비 · 소로 진료',
    amount: -42000,
    date: '2026-07-18',
    time: '10:12',
    type: 'withdraw',
    category: 'MEDICAL',
    petId: 1,
    paymentMethod: '애월 통합 지갑',
  },
  10: {
    id: 10,
    title: '펫사료마트',
    subtitle: '사료·간식 · LLM 분류',
    amount: -31200,
    date: '2026-07-17',
    time: '13:40',
    type: 'withdraw',
    category: 'FOOD',
    petId: null,
    paymentMethod: '애월 통합 지갑',
  },
  11: {
    id: 11,
    title: '엄마 · 충전',
    subtitle: '펫지갑에 100,000원 충전',
    amount: 100000,
    date: '2026-07-17',
    time: '08:20',
    type: 'charge',
    chargeMethod: '계좌이체',
  },
  12: {
    id: 12,
    title: '미미미용실',
    subtitle: '미용비 · 나비 미용',
    amount: -38000,
    date: '2026-07-15',
    time: '11:05',
    type: 'withdraw',
    category: 'GROOMING',
    petId: 2,
    paymentMethod: '애월 통합 지갑',
  },
  13: {
    id: 13,
    title: '24시 우리동물병원',
    subtitle: '병원비 · 나비 진료',
    amount: -25000,
    date: '2026-06-20',
    time: '17:30',
    type: 'withdraw',
    category: 'MEDICAL',
    petId: 2,
    paymentMethod: '애월 통합 지갑',
  },
  14: {
    id: 14,
    title: '아빠 · 충전',
    subtitle: '펫지갑에 50,000원 충전',
    amount: 50000,
    date: '2026-06-05',
    time: '19:50',
    type: 'charge',
    chargeMethod: '카드결제',
  },
  15: {
    id: 15,
    title: '펫사료마트',
    subtitle: '사료·간식 · LLM 분류',
    amount: -28000,
    date: '2026-05-12',
    time: '12:15',
    type: 'withdraw',
    category: 'FOOD',
    petId: null,
    paymentMethod: '애월 통합 지갑',
  },
};

const transaction = computed(() => mockTransactionsById[txId.value]);
const notFound = computed(() => !transaction.value);
const isWithdraw = computed(() => transaction.value?.type === 'withdraw');

const pets = [
  { id: 1, name: '소로', icon: IconDog },
  { id: 2, name: '나비', icon: IconCat },
];

// 바로가기 메뉴(HomeView.vue quickActions)와 동일한 파스텔 배경 팔레트 스타일 적용
const categories = [
  {
    key: 'MEDICAL',
    label: '병원비',
    icon: IconHospital,
    bg: 'var(--color-pastel-blue)',
  },
  { key: 'GROOMING', label: '미용비', icon: IconBarberShop, bg: '#F5E6EE' },
  { key: 'FOOD', label: '사료·간식', icon: IconDogBowl, bg: '#FDECD8' },
  { key: 'SUPPLIES', label: '위생용품', icon: IconShowerGel, bg: '#E3F1F1' },
  { key: 'SOS', label: 'SOS포켓', icon: IconSos, bg: '#FCE3E1' },
];

const selectedCategory = ref('');
const selectedPetId = ref(null);
const isSaving = ref(false);

watch(
  transaction,
  (newTx) => {
    if (!newTx) return;
    selectedCategory.value = newTx.category ?? '';
    selectedPetId.value = newTx.petId ?? null;
  },
  { immediate: true },
);

const selectedCategoryOption = computed(() =>
  categories.find((category) => category.key === selectedCategory.value),
);

const headerIcon = computed(() => {
  if (!isWithdraw.value) return IconWallet;
  return selectedCategoryOption.value?.icon ?? IconHospital;
});

const headerBg = computed(() => {
  if (!isWithdraw.value) return 'var(--color-pastel-green)';
  return selectedCategoryOption.value?.bg ?? 'var(--color-pastel-blue)';
});

const amountColorClass = computed(() =>
  transaction.value?.amount > 0
    ? 'text-(color:--color-olive)'
    : 'text-(color:--color-navy)',
);

const formattedAmount = computed(() => {
  if (!transaction.value) return '';
  const { amount } = transaction.value;
  const sign = amount > 0 ? '+' : '';
  return `${sign}${amount.toLocaleString()}원`;
});

const formattedDateTime = computed(() => {
  if (!transaction.value) return '';
  const [year, month, day] = transaction.value.date.split('-');
  const [hour, minute] = transaction.value.time.split(':').map(Number);
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${year}.${month}.${day} · ${period} ${hour12}:${String(minute).padStart(2, '0')}`;
});

function selectCategory(key) {
  selectedCategory.value = key;
}

function selectPet(id) {
  selectedPetId.value = id;
}

function goBack() {
  router.back();
}

async function handleSave() {
  isSaving.value = true;
  // TODO: implement transaction category/pet 태깅 수정 API 연동
  isSaving.value = false;
  router.push('/wallet/history');
}
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

    <div
      v-if="notFound"
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>거래 내역을 찾을 수 없어요.</p>
    </div>

    <template v-else>
      <div class="flex flex-col items-center mb-(--space-6)">
        <span
          class="flex items-center justify-center w-[56px] h-[56px] rounded-(--radius-xl) mb-(--space-4)"
          :style="{ backgroundColor: headerBg }"
        >
          <component
            :is="headerIcon"
            size="30"
            color="var(--color-navy)"
          />
        </span>
        <p
          class="text-(length:--font-3xl) font-bold"
          :class="amountColorClass"
        >
          {{ formattedAmount }}
        </p>
        <p
          class="text-(length:--font-base) font-medium text-(color:--color-slate-dark) mt-(--space-2)"
        >
          {{ transaction.title }}
        </p>
        <p
          v-if="!isWithdraw"
          class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          {{ transaction.subtitle }}
        </p>
        <p
          class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          {{ formattedDateTime }}
        </p>
      </div>

      <template v-if="isWithdraw">
        <div class="mb-(--space-6)">
          <div class="flex items-center justify-between mb-(--space-2)">
            <p
              class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark)"
            >
              카테고리
            </p>
            <p
              class="text-(length:--font-xs) text-(color:--color-slate-muted)"
            >
              자동 분류됨
            </p>
          </div>
          <div class="flex flex-wrap gap-(--space-2)">
            <button
              v-for="category in categories"
              :key="category.key"
              type="button"
              :aria-pressed="selectedCategory === category.key"
              class="inline-flex items-center gap-(--space-2) h-[36px] px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
              :class="
                selectedCategory === category.key
                  ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
                  : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
              "
              @click="selectCategory(category.key)"
            >
              <component
                :is="category.icon"
                size="16"
              />
              {{ category.label }}
            </button>
          </div>
        </div>

        <div class="mb-(--space-6)">
          <p
            class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark) mb-(--space-2)"
          >
            반려동물
          </p>
          <div class="flex flex-wrap gap-(--space-2)">
            <button
              v-for="pet in pets"
              :key="pet.id"
              type="button"
              :aria-pressed="selectedPetId === pet.id"
              class="inline-flex items-center gap-(--space-2) h-[36px] px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
              :class="
                selectedPetId === pet.id
                  ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
                  : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
              "
              @click="selectPet(pet.id)"
            >
              <component
                :is="pet.icon"
                size="16"
                :color="
                  selectedPetId === pet.id
                    ? 'var(--color-white)'
                    : 'var(--color-slate-dark)'
                "
              />
              {{ pet.name }}
            </button>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-(--space-4) border-t border-(--color-border) mb-(--space-6)"
        >
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >
            결제 수단
          </p>
          <p
            class="text-(length:--font-sm) font-medium text-(color:--color-navy)"
          >
            {{ transaction.paymentMethod }}
          </p>
        </div>

        <AppButton
          type="button"
          variant="navy"
          size="lg"
          block
          :loading="isSaving"
          @click="handleSave"
        >
          변경사항 저장
        </AppButton>
      </template>

      <template v-else>
        <div
          class="flex items-center justify-between py-(--space-4) border-t border-(--color-border) mb-(--space-6)"
        >
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >
            충전 수단
          </p>
          <p
            class="text-(length:--font-sm) font-medium text-(color:--color-navy)"
          >
            {{ transaction.chargeMethod }}
          </p>
        </div>

        <AppButton
          type="button"
          variant="navy"
          size="lg"
          block
          @click="goBack"
        >
          확인
        </AppButton>
      </template>
    </template>
  </div>
</template>
