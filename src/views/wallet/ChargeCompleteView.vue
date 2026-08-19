<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue'
import { useWalletStore } from '@/stores/wallet'

const router = useRouter()
const walletStore = useWalletStore()
const charge = computed(() => walletStore.completedTossCharge)
const isInvalid = computed(() => !charge.value?.orderId || charge.value.amount <= 0)

function finish() {
  const destination = charge.value?.returnTo === 'home' ? '/home' : '/wallet'
  walletStore.clearCompletedTossCharge()
  router.replace(destination)
}
</script>

<template>
  <CompletionPageLayout
    v-if="isInvalid"
    title="충전 정보를 찾을 수 없어요"
    description="애월지갑에서 충전을 다시 시도해주세요"
    variant="danger"
  >
    <template #action>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="finish"
      >
        애월지갑으로 이동
      </AppButton>
    </template>
  </CompletionPageLayout>

  <CompletionPageLayout
    v-else
    title="충전 완료"
    :description="`${charge.amount.toLocaleString()}원이 애월지갑에 충전되었어요`"
  >
    <dl class="mt-(--space-6) flex w-full flex-col gap-(--space-3) rounded-(--radius-xl) bg-(--color-white) p-(--space-4)">
      <div class="flex items-center justify-between">
        <dt class="text-(length:--font-sm) text-(color:--color-slate-muted)">
          충전 금액
        </dt>
        <dd class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ charge.amount.toLocaleString() }}원
        </dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-(length:--font-sm) text-(color:--color-slate-muted)">
          결제 수단
        </dt>
        <dd class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          TossPayments
        </dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-(length:--font-sm) text-(color:--color-slate-muted)">
          충전 후 잔액
        </dt>
        <dd class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
          {{ charge.walletBalance.toLocaleString() }}원
        </dd>
      </div>
    </dl>
    <template #action>
      <AppButton
        variant="primary"
        size="lg"
        block
        @click="finish"
      >
        확인
      </AppButton>
    </template>
  </CompletionPageLayout>
</template>
