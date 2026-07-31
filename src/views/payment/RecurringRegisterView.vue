<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconCat from '@/components/common/icons/IconCat.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconDog from '@/components/common/icons/IconDog.vue';
import IconInfo from '@/components/common/icons/IconInfo.vue';
import { mockWalletBalance } from '@/mocks/transaction';
import { usePaymentStore } from '@/stores/payment';
import { usePetStore } from '@/stores/pet';
import { RECURRING_CATEGORIES } from '@/utils/recurringCategory';

const router = useRouter();
const paymentStore = usePaymentStore();
const petStore = usePetStore();

const categories = RECURRING_CATEGORIES;

function petIcon(species) {
  return species === 'CAT' ? IconCat : IconDog;
}

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

const canSubmit = computed(
  () => !!merchantName.value.trim() && Number(amount.value) > 0 && !!category.value,
);

async function handleSubmit() {
  if (!canSubmit.value) return;
  const pet = petStore.pets.find((p) => p.id === selectedPetId.value);
  // TODO: 백엔드 정기결제 API 연동 후 실제 등록 처리로 교체
  await paymentStore.createRecurringPayment({
    merchantName: merchantName.value.trim(),
    amount: Number(amount.value),
    dayOfMonth: dayOfMonth.value,
    nextPaymentLabel: `다음 결제 매월 ${dayOfMonth.value}일`,
    category: category.value,
    petName: pet?.name ?? null,
  });
  router.push({
    path: '/payment/recurring/register/complete',
    query: { dayOfMonth: dayOfMonth.value, amount: amount.value },
  });
}
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+96px)] bg-(--color-bg) min-h-screen"
  >
    <header class="mb-(--space-6)">
      <button
        type="button"
        aria-label="뒤로 가기"
        class="inline-flex mb-(--space-3) text-(color:--color-navy)"
        @click="router.back()"
      >
        <IconArrowLeft size="24" />
      </button>
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        정기결제 등록
      </h1>
      <p
        class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
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
        class="w-full p-4 rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-md) text-(color:--color-navy) outline-none placeholder:text-(--color-slate-muted)"
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
        class="w-full p-4 rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-md) text-(color:--color-navy) outline-none placeholder:text-(--color-slate-muted)"
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
        class="w-full flex items-center justify-between p-4 rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-md) font-semibold text-(color:--color-navy)"
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
              ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
              : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
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
        <button
          v-for="pet in petStore.pets"
          :key="pet.id"
          type="button"
          :aria-pressed="selectedPetId === pet.id"
          class="inline-flex items-center gap-(--space-2) h-(--control-height-sm) px-(--space-4) rounded-(--radius-full) border text-(length:--font-sm) font-medium"
          :class="
            selectedPetId === pet.id
              ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
              : 'bg-(--color-white) border-(--color-border) text-(color:--color-slate-dark)'
          "
          @click="selectPet(pet.id)"
        >
          <component
            :is="petIcon(pet.species)"
            size="16"
            :color="selectedPetId === pet.id ? 'var(--color-white)' : 'var(--color-slate-dark)'"
          />
          {{ pet.name }}
        </button>
      </div>
    </section>

    <section class="mb-(--space-5)">
      <h2
        class="text-(length:--font-md) font-semibold text-(color:--color-navy) mb-(--space-2)"
      >
        결제 수단
      </h2>
      <div
        class="w-full p-4 rounded-xl bg-(--color-surface) border border-(--color-border)"
      >
        <p
          class="text-(length:--font-md) font-semibold text-(color:--color-navy)"
        >
          애월 통합 지갑
        </p>
        <p
          class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          잔액 {{ mockWalletBalance.toLocaleString() }}원
        </p>
      </div>
    </section>

    <div
      class="flex items-start gap-(--space-2) rounded-(--radius-lg) bg-(--color-surface) p-(--space-4) mb-(--space-6)"
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
      :disabled="!canSubmit"
      @click="handleSubmit"
    >
      정기결제 등록하기
    </AppButton>

    <BottomSheet
      v-model="isDaySheetOpen"
      title="결제 주기 선택"
    >
      <ul>
        <li
          v-for="day in dayOptions"
          :key="day"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              day === dayOfMonth
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectDay(day)"
          >
            <span>매월 {{ day }}일</span>
            <IconCheck
              v-if="day === dayOfMonth"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>
  </div>
</template>
