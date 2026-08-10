<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue';
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
  <CompletionPageLayout
    v-if="isInvalid"
    title="송금 정보를 찾을 수 없어요"
    description="애월지갑에서 송금을 다시 시도해주세요"
    variant="warning"
  >
    <template #action>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="confirmComplete"
      >
        애월지갑으로 이동
      </AppButton>
    </template>
  </CompletionPageLayout>

  <CompletionPageLayout
    v-else
    title="송금 완료"
    :description="`${bankMeta.name} 계좌로 ${amount.toLocaleString()}원을 보냈어요`"
  >
    <div class="mt-(--space-6) flex w-full flex-col gap-(--space-3) rounded-(--radius-xl) bg-(--color-white) p-(--space-4)">
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
    <template #action>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="confirmComplete"
      >
        지갑으로
      </AppButton>
    </template>
  </CompletionPageLayout>
</template>
