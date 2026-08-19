<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue'

const route = useRoute()
const router = useRouter()

const transactionId = computed(() => String(route.query.transactionId ?? ''))
const bankName = computed(() => String(route.query.bankName ?? ''))
const accountNumberMasked = computed(() => String(route.query.accountNumberMasked ?? ''))
const amount = computed(() => Number(route.query.amount) || 0)
const withdrawnAt = computed(() => String(route.query.withdrawnAt ?? ''))
const isInvalid = computed(
  () => !transactionId.value || !bankName.value || !accountNumberMasked.value || amount.value <= 0,
)
const withdrawnAtLabel = computed(() => {
  const date = new Date(withdrawnAt.value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
})

function confirmComplete() {
  router.replace('/wallet')
}
</script>

<template>
  <CompletionPageLayout
    v-if="isInvalid"
    title="출금 정보를 찾을 수 없어요"
    description="애월지갑에서 출금을 다시 시도해주세요"
    variant="danger"
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
    title="출금 완료"
    :description="`${bankName} 계좌로 ${amount.toLocaleString()}원을 출금했어요`"
  >
    <div class="mt-(--space-6) flex w-full flex-col gap-(--space-3) rounded-(--radius-xl) bg-(--color-white) p-(--space-4)">
      <div class="flex items-center justify-between">
        <span class="text-(length:--font-sm) text-(color:--color-slate-muted)">출금 금액</span>
        <span class="text-(length:--font-sm) font-bold text-(color:--color-navy)">{{ amount.toLocaleString() }}원</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-(length:--font-sm) text-(color:--color-slate-muted)">받는 계좌</span>
        <span class="text-(length:--font-sm) font-bold text-(color:--color-navy)">{{ bankName }} {{ accountNumberMasked }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-(length:--font-sm) text-(color:--color-slate-muted)">출금 시간</span>
        <span class="text-(length:--font-sm) font-bold text-(color:--color-navy)">{{ withdrawnAtLabel }}</span>
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
