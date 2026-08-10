<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import PetSelectorChip from '@/components/common/PetSelectorChip.vue';
import IconHospital from '@/components/common/icons/IconHospital.vue';
import IconDogBowl from '@/components/common/icons/IconDogBowl.vue';
import IconShowerGel from '@/components/common/icons/IconShowerGel.vue';
import IconGroupPurchase from '@/components/common/icons/IconGroupPurchase.vue';
import IconEtc from '@/components/common/icons/IconEtc.vue';
import IconWallet from '@/components/common/icons/IconWallet.vue';
import { CATEGORY_LABELS } from '@/mocks/transaction';
import { usePetStore } from '@/stores/pet';
import { useTransactionStore } from '@/stores/transaction';

const route = useRoute();
const router = useRouter();
const petStore = usePetStore();
const transactionStore = useTransactionStore();
const txId = computed(() => Number(route.params.txId));

const transaction = computed(() =>
  transactionStore.transactions.find((tx) => tx.id === txId.value),
);
const notFound = computed(() => !transaction.value);
const isWithdraw = computed(() => transaction.value?.type === 'withdraw');

const pets = computed(() => petStore.pets);

// 바로가기 메뉴(HomeView.vue quickActions)와 동일한 파스텔 배경 팔레트 스타일 적용
const categories = [
  {
    key: 'MEDICAL',
    label: CATEGORY_LABELS.MEDICAL,
    icon: IconHospital,
    bg: 'var(--color-pastel-violet)',
  },
  {
    key: 'GROOMING',
    label: CATEGORY_LABELS.GROOMING,
    icon: IconShowerGel,
    bg: 'var(--color-pastel-coral)',
  },
  {
    key: 'FOOD',
    label: CATEGORY_LABELS.FOOD,
    icon: IconDogBowl,
    bg: 'var(--color-pastel-blue)',
  },
  {
    key: 'SUPPLIES',
    label: CATEGORY_LABELS.SUPPLIES,
    icon: IconGroupPurchase,
    bg: 'var(--color-pastel-peach)',
  },
  {
    key: 'ETC',
    label: CATEGORY_LABELS.ETC,
    icon: IconEtc,
    bg: 'var(--color-pastel-beige)',
  },
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
  selectedPetId.value = selectedPetId.value === id ? null : id;
}

function goBack() {
  router.back();
}

function handleSave() {
  if (!selectedCategory.value) return;

  isSaving.value = true;
  transactionStore.updateTransactionTag(txId.value, {
    category: selectedCategory.value,
    petId: selectedPetId.value,
  });
  isSaving.value = false;
  router.push('/wallet/history');
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-app-bg) min-h-screen"
  >
    <div
      v-if="notFound"
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>거래 내역을 찾을 수 없어요.</p>
    </div>

    <template v-else>
      <div class="flex flex-col items-center mb-(--space-6)">
        <FeatureIconTile
          class="mb-(--space-4)"
          :icon="headerIcon"
          :tone="isWithdraw ? 'blue' : 'green'"
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

      <template v-if="isWithdraw">
        <div
          class="bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-sm) p-(--space-4) mb-(--space-6)"
        >
          <div class="mb-(--space-5)">
            <div class="flex items-center justify-between mb-(--space-2)">
              <p
                class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark)"
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
                  size="24"
                />
                {{ category.label }}
              </button>
            </div>
          </div>

          <div class="mb-(--space-5)">
            <p
              class="text-(length:--font-sm) font-medium text-(color:--color-slate-dark) mb-(--space-2)"
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

          <div
            class="flex items-center justify-between pt-(--space-4) border-t border-(--color-border)"
          >
            <p
              class="text-(length:--font-sm) text-(color:--color-slate-muted)"
            >
              결제 수단
            </p>
            <p
              class="text-(length:--font-sm) font-medium text-(color:--color-gray-900)"
            >
              {{ transaction.paymentMethod }}
            </p>
          </div>
        </div>

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
      </template>

      <template v-else>
        <div
          class="flex items-center justify-between bg-(--color-white) rounded-(--radius-lg) shadow-(--shadow-sm) p-(--space-4) mb-(--space-6)"
        >
          <p
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >
            충전 수단
          </p>
          <p
            class="text-(length:--font-sm) font-medium text-(color:--color-gray-900)"
          >
            {{ transaction.chargeMethod }}
          </p>
        </div>

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
