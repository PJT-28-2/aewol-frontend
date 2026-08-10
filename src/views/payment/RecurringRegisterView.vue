<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import PetSelectorChip from '@/components/common/PetSelectorChip.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconInfo from '@/components/common/icons/IconInfo.vue';
import { mockWalletBalance } from '@/mocks/transaction';
import { usePaymentStore } from '@/stores/payment';
import { usePetStore } from '@/stores/pet';
import { RECURRING_CATEGORIES } from '@/utils/recurringCategory';

const router = useRouter();
const paymentStore = usePaymentStore();
const petStore = usePetStore();

const categories = RECURRING_CATEGORIES;

const merchantName = ref('');
const amount = ref('');
const category = ref('');
const selectedPetId = ref(null);

function selectCategory(key) {
  category.value = key;
}

function selectPet(id) {
  selectedPetId.value = selectedPetId.value === id ? null : id;
}

const dayOfMonth = ref(15);
const isDaySheetOpen = ref(false);
const dayOptions = Array.from({ length: 28 }, (_, index) => index + 1);

function selectDay(day) {
  dayOfMonth.value = day;
  isDaySheetOpen.value = false;
}

// 사용자가 placeholder처럼 콤마를 넣어 입력해도(예: "32,000") 정상 인식되도록
// 숫자가 아닌 문자는 모두 제거하고 파싱한다.
const numericAmount = computed(() => Number(String(amount.value).replace(/[^0-9]/g, '')) || 0);

const canSubmit = computed(
  () => !!merchantName.value.trim() && numericAmount.value > 0 && !!category.value,
);

const isSubmitting = ref(false);

// mockData.js의 기존 항목과 같은 "다음 M/D" 형식으로 다음 결제일을 계산한다.
function computeNextPaymentLabel(day) {
  const today = new Date();
  let month = today.getMonth() + 1;
  if (day <= today.getDate()) {
    month += 1;
    if (month > 12) month = 1;
  }
  return `다음 ${month}/${day}`;
}

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const pet = petStore.pets.find((p) => p.id === selectedPetId.value);
    await paymentStore.createRecurringPayment({
      merchantName: merchantName.value.trim(),
      amount: numericAmount.value,
      dayOfMonth: dayOfMonth.value,
      nextPaymentLabel: computeNextPaymentLabel(dayOfMonth.value),
      category: category.value,
      petId: selectedPetId.value,
      petName: pet?.name ?? null,
    });
    router.push({
      path: '/payment/recurring/register/complete',
      query: { dayOfMonth: dayOfMonth.value, amount: numericAmount.value },
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)]"
  >
    <header class="mb-(--space-6)">
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        정기결제 등록
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        구독형 결제 정보를 입력해주세요
      </p>
    </header>

    <section class="mb-(--space-5)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        상품명 *
      </h2>
      <input
        v-model="merchantName"
        type="text"
        placeholder="예: 강아지 사료 정기배송"
        class="w-full p-4 rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border) text-(length:--font-md) text-(color:--color-navy) outline-none placeholder:text-(--color-slate-muted)"
      >
    </section>

    <section class="mb-(--space-5)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        결제 금액 *
      </h2>
      <input
        v-model="amount"
        type="text"
        inputmode="numeric"
        placeholder="32,000 원"
        class="w-full p-4 rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border) text-(length:--font-md) text-(color:--color-navy) outline-none placeholder:text-(--color-slate-muted)"
      >
    </section>

    <section class="mb-(--space-5)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        결제 주기 *
      </h2>
      <button
        type="button"
        class="w-full flex items-center justify-between p-4 rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border) text-(length:--font-md) font-semibold text-(color:--color-navy)"
        @click="isDaySheetOpen = true"
      >
        매월 {{ dayOfMonth }}일
        <IconChevronDown
          size="16"
          color="var(--color-slate-muted)"
        />
      </button>
    </section>

    <section class="mb-(--space-5)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        카테고리 *
      </h2>
      <div class="flex flex-wrap gap-(--space-2)">
        <button
          v-for="item in categories"
          :key="item.key"
          type="button"
          :aria-pressed="category === item.key"
          class="inline-flex items-center gap-(--space-2) h-(--control-height-sm) px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
          :class="
            category === item.key
              ? 'bg-(--color-leaf-soft) border-(--color-leaf) text-(color:--color-navy)'
              : 'bg-(--color-white) border-(--color-card-border) text-(color:--color-slate-dark)'
          "
          @click="selectCategory(item.key)"
        >
          <component
            :is="item.icon"
            size="16"
          />
          {{ item.label }}
        </button>
      </div>
    </section>

    <section
      v-if="petStore.pets.length"
      class="mb-(--space-5)"
    >
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        반려동물
      </h2>
      <div class="flex flex-wrap gap-(--space-2)">
        <PetSelectorChip
          v-for="pet in petStore.pets"
          :key="pet.id"
          :label="pet.name"
          :species="pet.species"
          :selected="selectedPetId === pet.id"
          @click="selectPet(pet.id)"
        />
      </div>
    </section>

    <section class="mb-(--space-5)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        결제 수단
      </h2>
      <div
        class="w-full p-4 rounded-(--radius-xl) bg-(--color-surface) border border-(--color-border)"
      >
        <p
          class="text-(length:--font-md) font-semibold text-(color:--color-navy)"
        >
          애월지갑
        </p>
        <p
          class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          잔액 {{ mockWalletBalance.toLocaleString() }}원
        </p>
      </div>
    </section>

    <div
      class="mb-(--space-6) flex items-start gap-(--space-2) rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4)"
    >
      <IconInfo
        size="16"
        class="mt-[1px] shrink-0 text-(--color-gold-dark)"
      />
      <p class="text-(length:--font-sm) text-(color:--color-slate-dark)">
        매월 결제일 3일 전에 미리 알려드려요
      </p>
    </div>

    <AppButton
      variant="primary"
      size="lg"
      block
      :disabled="!canSubmit || isSubmitting"
      @click="handleSubmit"
    >
      정기결제 등록하기
    </AppButton>

    <BottomSheet
      v-model="isDaySheetOpen"
      title="결제 주기 선택"
    >
      <ul class="flex flex-col gap-(--space-2)">
        <li
          v-for="day in dayOptions"
          :key="day"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-(--radius-xl) border px-(--space-4) py-(--space-3) text-(length:--font-base)"
            :class="
              day === dayOfMonth
                ? 'border-(--color-leaf) bg-(--color-leaf-soft) font-bold text-(color:--color-navy)'
                : 'border-(--color-card-border) bg-(--color-white) text-(color:--color-slate-dark)'
            "
            @click="selectDay(day)"
          >
            <span>매월 {{ day }}일</span>
            <IconCheck
              v-if="day === dayOfMonth"
              size="18"
              color="var(--color-leaf-dark)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>
  </div>
</template>
