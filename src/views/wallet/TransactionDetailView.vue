<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import PetSelectorChip from '@/components/common/PetSelectorChip.vue';
import IconWallet from '@/components/common/icons/IconWallet.vue';
import { CATEGORY_LABELS } from '@/constants/transactionCategory';
import { getRecurringCategory } from '@/utils/recurringCategory';
import { usePetStore } from '@/stores/pet';
import { useTransactionStore } from '@/stores/transaction';

const route = useRoute();
const router = useRouter();
const petStore = usePetStore();
const transactionStore = useTransactionStore();
const txId = computed(() => String(route.params.txId));

const transaction = computed(() => transactionStore.currentTxn);
const isLoading = ref(true);
const loadError = ref(false);
const notFound = computed(() => !transaction.value);
const isPayment = computed(() => transaction.value?.txnType === 'PAYMENT');
const isWalletWithdrawal = computed(() => transaction.value?.txnType === 'WITHDRAW');
const isRefund = computed(() => transaction.value?.txnType === 'REFUND');
const returnPath = computed(() =>
  route.query.from === 'wallet' ? '/wallet' : '/wallet/history',
);

const pets = computed(() => petStore.pets);

// 카테고리 아이콘은 정기결제와 동일한 세트를 쓰도록 getRecurringCategory 단일 소스에서 가져온다.
// 배경(bg)은 바로가기 메뉴(HomeView.vue quickActions)와 동일한 파스텔 팔레트 스타일을 유지.
const categories = [
  {
    key: 'MEDICAL',
    label: CATEGORY_LABELS.MEDICAL,
    icon: getRecurringCategory('MEDICAL').icon,
    bg: 'var(--color-pastel-violet)',
  },
  {
    key: 'GROOMING',
    label: CATEGORY_LABELS.GROOMING,
    icon: getRecurringCategory('GROOMING').icon,
    bg: 'var(--color-pastel-coral)',
  },
  {
    key: 'FOOD',
    label: CATEGORY_LABELS.FOOD,
    icon: getRecurringCategory('FOOD').icon,
    bg: 'var(--color-pastel-blue)',
  },
  {
    key: 'SUPPLIES',
    label: CATEGORY_LABELS.SUPPLIES,
    icon: getRecurringCategory('SUPPLIES').icon,
    bg: 'var(--color-pastel-peach)',
  },
  {
    key: 'ETC',
    label: CATEGORY_LABELS.ETC,
    icon: getRecurringCategory('ETC').icon,
    bg: 'var(--color-pastel-beige)',
  },
];

const selectedCategory = ref('');
const selectedPetId = ref(null);
const isSaving = ref(false);
const saveError = ref('');

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
  if (!isPayment.value) return IconWallet;
  return selectedCategoryOption.value?.icon ?? getRecurringCategory('MEDICAL').icon;
});

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

const walletMovementDetails = computed(() => {
  if (!transaction.value) return [];
  let details;
  if (isWalletWithdrawal.value) {
    details = [
      { label: '출금 계좌', value: transaction.value.title },
      { label: '출금 수단', value: transaction.value.paymentMethod },
    ];
  } else if (isRefund.value) {
    // REFUND는 충전이 아니라서 '충전 수단' 라벨을 그대로 쓰면 오해를 준다
    details = [{ label: '환불 수단', value: transaction.value.chargeMethod }];
  } else {
    details = [{ label: '충전 수단', value: transaction.value.chargeMethod }];
  }

  if (transaction.value.memo) {
    details.push({ label: '메모', value: transaction.value.memo });
  }
  return details;
});

function selectCategory(key) {
  selectedCategory.value = key;
}

function selectPet(id) {
  selectedPetId.value = selectedPetId.value === id ? null : id;
}

function goBack() {
  router.back();
}

async function fetchTransaction() {
  isLoading.value = true;
  loadError.value = false;
  transactionStore.currentTxn = null;

  try {
    await Promise.all([
      transactionStore.fetchTransaction(txId.value),
      petStore.pets.length ? Promise.resolve() : petStore.fetchPets(),
    ]);
  } catch {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}

async function handleSave() {
  if (!selectedCategory.value) return;

  isSaving.value = true;
  saveError.value = '';
  try {
    await transactionStore.updateTransactionTag(txId.value, {
      category: selectedCategory.value,
      petId: selectedPetId.value,
    });
    router.push(returnPath.value);
  } catch {
    saveError.value = '거래 분류를 저장하지 못했어요. 다시 시도해주세요.';
  } finally {
    isSaving.value = false;
  }
}

onMounted(fetchTransaction);
</script>

<template>
  <div
    class="p-(--space-4) bg-(--color-app-bg) min-h-screen"
  >
    <div
      v-if="isLoading"
      class="py-(--space-8)"
    >
      <LoadingSpinner />
    </div>

    <div
      v-else-if="loadError || notFound"
      class="flex flex-col items-center py-(--space-8) text-center text-(color:--color-gray-500)"
      role="alert"
    >
      <p>거래 내역을 찾을 수 없어요.</p>
      <AppButton
        class="mt-(--space-4)"
        size="sm"
        @click="fetchTransaction"
      >
        다시 시도
      </AppButton>
    </div>

    <template v-else>
      <div class="flex flex-col items-center mb-(--space-6)">
        <FeatureIconTile
          class="mb-(--space-4)"
          :icon="headerIcon"
          :tone="isPayment ? 'blue' : 'green'"
        />
        <p
          class="text-(length:--font-3xl) font-bold text-(color:--color-navy)"
        >
          {{ formattedAmount }}
        </p>
        <p
          class="text-(length:--font-base) font-medium text-(color:--color-slate-dark) mt-(--space-2)"
        >
          {{ transaction.title }}
        </p>
        <p
          class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          {{ formattedDateTime }}
        </p>
      </div>

      <template v-if="isPayment">
        <div
          class="bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-sm) p-(--space-4) mb-(--space-4)"
        >
          <div class="mb-(--space-5)">
            <div class="flex items-center justify-between mb-(--space-2)">
              <p
                class="text-(length:--font-md) text-(color:--color-slate-muted)"
              >
                카테고리
              </p>
              <p
                v-if="transaction.autoTagged"
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
                class="inline-flex items-center gap-(--space-2) h-(--control-height-sm) px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
                :class="
                  selectedCategory === category.key
                    ? 'bg-(--color-gray-900) border-(--color-gray-900) text-(color:--color-white)'
                    : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
                "
                @click="selectCategory(category.key)"
              >
                <component
                  :is="category.icon"
                  size="18"
                />
                {{ category.label }}
              </button>
            </div>
          </div>

          <div class="mb-(--space-5)">
            <p
              class="text-(length:--font-md) text-(color:--color-slate-muted) mb-(--space-2)"
            >
              반려동물
            </p>
            <div class="flex flex-wrap gap-(--space-2)">
              <PetSelectorChip
                v-for="pet in pets"
                :key="pet.id"
                :label="pet.name"
                :species="pet.species"
                :selected="selectedPetId === pet.id"
                @click="selectPet(pet.id)"
              />
            </div>
          </div>
        </div>

        <dl
          class="mb-(--space-6) flex flex-col gap-(--space-4) rounded-(--radius-2xl) bg-(--color-white) p-(--space-5)"
        >
          <div class="flex items-start justify-between gap-(--space-4)">
            <dt class="text-(length:--font-md) text-(color:--color-slate-muted)">
              결제 수단
            </dt>
            <dd class="text-right text-(length:--font-md) font-semibold text-(color:--color-navy)">
              {{ transaction.paymentMethod }}
            </dd>
          </div>
        </dl>

        <AppButton
          type="button"
          variant="primary"
          size="lg"
          block
          :disabled="!selectedCategory"
          :loading="isSaving"
          @click="handleSave"
        >
          변경사항 저장
        </AppButton>
        <p
          v-if="saveError"
          class="mt-(--space-3) text-center text-(length:--font-sm) text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ saveError }}
        </p>
      </template>

      <template v-else>
        <dl
          class="mb-(--space-6) flex flex-col gap-(--space-4) rounded-(--radius-2xl) bg-(--color-white) p-(--space-5)"
        >
          <div
            v-for="detail in walletMovementDetails"
            :key="detail.label"
            class="flex items-start justify-between gap-(--space-4)"
          >
            <dt class="text-(length:--font-md) text-(color:--color-slate-muted)">
              {{ detail.label }}
            </dt>
            <dd class="text-right text-(length:--font-md) font-semibold text-(color:--color-navy)">
              {{ detail.value }}
            </dd>
          </div>
        </dl>

        <AppButton
          type="button"
          variant="primary"
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
