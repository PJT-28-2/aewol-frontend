<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import petSuccess from '@/assets/images/pet-success.png';
import petNotFound from '@/assets/images/pet-not-found.png';
import { getBankMeta } from '@/utils/bankMeta';

const route = useRoute();
const router = useRouter();

const bankCode = computed(() => route.query.bankCode || '');
const accountNumber = computed(() => route.query.accountNumber || '');
const amount = computed(() => Number(route.query.amount) || 0);

const bankMeta = computed(() => (bankCode.value ? getBankMeta(bankCode.value) : null));

const isInvalid = computed(
  () => !bankCode.value || !accountNumber.value || amount.value <= 0,
);

const sentAt = new Date();
const sentAtLabel = computed(() => {
  const year = sentAt.getFullYear();
  const month = String(sentAt.getMonth() + 1).padStart(2, '0');
  const day = String(sentAt.getDate()).padStart(2, '0');
  const hour = sentAt.getHours();
  const minute = sentAt.getMinutes();
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${year}.${month}.${day} ${period} ${hour12}:${String(minute).padStart(2, '0')}`;
});

function confirmComplete() {
  router.replace('/wallet');
}
</script>

<template>
  <div
    class="min-h-screen max-w-(--content-max-width) mx-auto bg-(--color-bg) px-(--space-6) pt-[calc(var(--header-height)+var(--space-4))] flex flex-col items-center text-center"
  >
    <template v-if="isInvalid">
      <img
        :src="petNotFound"
        alt=""
        class="w-32 h-auto mb-(--space-4)"
      >
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)"
      >
        송금 정보를 찾을 수 없어요
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-gray-600) mb-(--space-8)"
      >
        펫지갑에서 송금을 다시 시도해주세요
      </p>
      <AppButton
        variant="navy"
        size="lg"
        block
        @click="confirmComplete"
      >
        펫지갑으로 이동
      </AppButton>
    </template>

    <template v-else>
      <img
        :src="petSuccess"
        alt=""
        class="w-32 h-auto mb-(--space-4)"
      >
      <h1
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)"
      >
        송금을 완료했어요!
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-gray-600) mb-(--space-8)"
      >
        {{ bankMeta.name }} 계좌로 {{ amount.toLocaleString() }}원을 보냈어요
      </p>

      <div
        class="w-full flex flex-col gap-(--space-3) bg-(--color-surface) rounded-(--radius-lg) p-(--space-4) mb-(--space-8)"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >보낸 금액</span>
          <span
            class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
          >{{ amount.toLocaleString() }}원</span>
        </div>
        <div class="flex items-center justify-between">
          <span
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >받는 계좌</span>
          <span
            class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
          >{{ bankMeta.name }}
            {{ accountNumber }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span
            class="text-(length:--font-sm) text-(color:--color-slate-muted)"
          >보낸 시간</span>
          <span
            class="text-(length:--font-sm) font-bold text-(color:--color-navy)"
          >{{ sentAtLabel }}</span>
        </div>
      </div>

      <AppButton
        variant="navy"
        size="lg"
        block
        @click="confirmComplete"
      >
        확인
      </AppButton>
    </template>
  </div>
</template>
