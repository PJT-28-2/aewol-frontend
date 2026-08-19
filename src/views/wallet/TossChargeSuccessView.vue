<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import CompletionPageLayout from '@/components/common/CompletionPageLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useTransactionStore } from '@/stores/transaction'
import { useWalletStore } from '@/stores/wallet'

const route = useRoute()
const router = useRouter()
const transactionStore = useTransactionStore()
const walletStore = useWalletStore()

const isLoading = ref(true)
const approvalError = ref('')
const paymentKey = computed(() => String(route.query.paymentKey ?? ''))
const orderId = computed(() => String(route.query.orderId ?? ''))
const amount = computed(() => Number(route.query.amount) || 0)
const isValidCallback = computed(
  () => paymentKey.value && orderId.value && amount.value > 0,
)

async function refreshWalletData() {
  await transactionStore.fetchRecentTransactions({ limit: 20 }).catch(() => {})
}

async function approveCharge() {
  if (!isValidCallback.value) {
    approvalError.value = '결제 승인 정보가 올바르지 않아요.'
    isLoading.value = false
    return
  }

  if (
    walletStore.completedTossCharge?.orderId === orderId.value
    && walletStore.completedTossCharge.amount === amount.value
  ) {
    await router.replace({ name: 'ChargeComplete' })
    return
  }

  isLoading.value = true
  approvalError.value = ''
  try {
    await walletStore.confirmTossCharge({
      paymentKey: paymentKey.value,
      orderId: orderId.value,
      amount: amount.value,
    })
    await refreshWalletData()
    await router.replace({ name: 'ChargeComplete' })
  } catch (error) {
    approvalError.value = error.response?.data?.message
      || error.message
      || '충전 승인을 완료하지 못했어요. 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}

function goToWallet() {
  router.replace('/wallet')
}

onMounted(approveCharge)
</script>

<template>
  <main
    v-if="isLoading"
    class="grid min-h-screen place-items-center bg-(--color-app-bg) px-(--space-5) text-center"
  >
    <div>
      <LoadingSpinner />
      <p class="mt-(--space-4) text-(length:--font-md) text-(color:--color-slate-muted)">
        결제 승인 후 지갑에 반영하고 있어요
      </p>
    </div>
  </main>

  <CompletionPageLayout
    v-else
    title="충전을 완료하지 못했어요"
    :description="approvalError"
    variant="danger"
  >
    <template #action>
      <div class="flex flex-col gap-(--space-3)">
        <AppButton
          v-if="isValidCallback"
          variant="primary"
          size="lg"
          block
          @click="approveCharge"
        >
          다시 확인하기
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
