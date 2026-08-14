<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue'
import { useWalletStore } from '@/stores/wallet'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()

const pendingCharge = walletStore.pendingTossCharge
const errorCode = computed(() => String(route.query.code ?? ''))
const orderId = computed(() => String(route.query.orderId ?? ''))
const description = computed(() => {
  if (['PAY_PROCESS_CANCELED', 'USER_CANCEL'].includes(errorCode.value)) {
    return '결제가 취소되었어요. 지갑 잔액은 변경되지 않았어요.'
  }
  return String(route.query.message ?? '결제를 진행하지 못했어요. 다시 시도해주세요.')
})

function retryCharge() {
  router.replace({
    name: 'Charge',
    query: {
      amount: pendingCharge?.amount || undefined,
      from: pendingCharge?.returnTo === 'home' ? 'home' : undefined,
    },
  })
}

function goToWallet() {
  router.replace('/wallet')
}

onMounted(() => walletStore.clearPendingTossCharge(orderId.value || undefined))
</script>

<template>
  <CompletionPageLayout
    title="충전이 취소되었어요"
    :description="description"
    variant="danger"
  >
    <template #action>
      <div class="flex flex-col gap-(--space-3)">
        <AppButton
          variant="primary"
          size="lg"
          block
          @click="retryCharge"
        >
          다시 충전하기
        </AppButton>
        <AppButton
          variant="secondary"
          size="lg"
          block
          @click="goToWallet"
        >
          애월지갑으로 이동
        </AppButton>
      </div>
    </template>
  </CompletionPageLayout>
</template>
