<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import BottomSheet from '@/components/common/BottomSheet.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SelectableChip from '@/components/common/SelectableChip.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'
import IconSavings from '@/components/common/icons/IconSavings.vue'
import { donationAmountPresets } from '@/constants/donation'
import { useDonationStore } from '@/stores/donation'
import { formatWon } from '@/utils/bankMeta'

const router = useRouter()
const donationStore = useDonationStore()
const { walletBalance, isLoading, depositAmount, depositError } =
  storeToRefs(donationStore)

const isConfirmOpen = ref(false)

const hasWalletBalance = computed(() => walletBalance.value > 0)

/** 입력 중 천 단위 콤마를 유지하기 위해 표시용 문자열을 따로 만든다. */
const depositAmountInput = computed(() =>
  depositAmount.value > 0 ? depositAmount.value.toLocaleString('ko-KR') : '',
)

const confirmTitle = computed(
  () => `${formatWon(depositAmount.value)}을 저금통에 넣을까요?`,
)

function onAmountInput(value) {
  const digitsOnly = String(value).replace(/[^\d]/g, '')

  donationStore.setDepositAmount(digitsOnly ? Number(digitsOnly) : 0)
}

function selectPreset(preset) {
  donationStore.setDepositAmount(preset)
}

function openConfirm() {
  if (!donationStore.validateDepositAmount()) return

  isConfirmOpen.value = true
}

async function confirmDeposit() {
  if (!(await donationStore.deposit())) return

  donationStore.resetDeposit()
  router.push('/donation')
}

onMounted(() => {
  donationStore.resetDeposit()

  if (!donationStore.isInitialized) donationStore.fetchDonationData()
})
</script>

<template>
  <main
    class="mx-auto min-h-dvh w-full max-w-(--content-max-width) box-border bg-(--color-app-bg) px-[var(--space-5)] pt-[var(--space-4)] pb-[calc(var(--space-8)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <section
      v-if="isLoading"
      class="grid min-h-[calc(100dvh-var(--header-height))] place-items-center"
      aria-live="polite"
    >
      <LoadingSpinner />
    </section>

    <section
      v-else-if="donationStore.error"
      class="flex min-h-[calc(100dvh-var(--header-height))] flex-col items-center justify-center text-center"
      role="alert"
    >
      <p class="m-0 text-[length:var(--font-md)] text-(--color-slate-dark)">
        {{ donationStore.error }}
      </p>
      <AppButton
        class="mt-[var(--space-4)]"
        variant="primary"
        size="sm"
        @click="donationStore.fetchDonationData()"
      >
        다시 시도
      </AppButton>
    </section>

    <template v-else>
      <h1
        class="mb-[var(--space-7)] text-[length:var(--font-2xl)] font-bold text-(--color-navy)"
      >
        넣기
      </h1>

      <section
        class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-leaf-soft) px-[var(--space-5)] py-[var(--space-4)] text-(--color-navy) shadow-(--shadow-card)"
      >
        <span
          class="block text-[length:var(--font-sm)] text-(--color-slate-dark)"
        >내 애월지갑 잔액</span>
        <strong class="block text-[length:var(--font-2xl)]">
          ₩{{ walletBalance.toLocaleString('ko-KR') }}
        </strong>
        <small
          class="block text-[length:var(--font-sm)] text-(--color-slate-dark)"
        >저금통에 넣을 금액을 입력해주세요</small>
      </section>

      <template v-if="hasWalletBalance">
        <div class="mt-[var(--space-6)]">
          <AppInput
            :model-value="depositAmountInput"
            label="넣을 금액 (원)"
            placeholder="저금통에 넣을 금액을 입력해주세요"
            inputmode="numeric"
            :error="depositError"
            @update:model-value="onAmountInput"
            @focusout="donationStore.validateDepositAmount()"
          />
        </div>

        <div class="mt-[var(--space-3)] flex gap-[var(--space-2)]">
          <SelectableChip
            v-for="preset in donationAmountPresets"
            :key="preset"
            block
            shape="rounded"
            :selected="depositAmount === preset"
            :disabled="preset > walletBalance"
            @click="selectPreset(preset)"
          >
            {{ formatWon(preset) }}
          </SelectableChip>
          <SelectableChip
            block
            shape="rounded"
            :selected="depositAmount === walletBalance"
            @click="selectPreset(walletBalance)"
          >
            전액
          </SelectableChip>
        </div>

        <section
          class="mt-[var(--space-4)] flex items-center justify-between rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)]"
        >
          <span class="text-[length:var(--font-sm)] text-(--color-slate-dark)">
            {{ depositError ? '넣을 수 있는 금액' : '넣고 난 뒤 애월지갑 잔액' }}
          </span>
          <strong class="text-[length:var(--font-md)] font-bold">
            {{
              depositError
                ? formatWon(walletBalance)
                : formatWon(donationStore.balanceAfterDeposit)
            }}
          </strong>
        </section>

        <section
          class="mt-[var(--space-4)] flex items-start gap-[var(--space-2)] rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)]"
        >
          <IconInfo
            class="mt-[var(--icon-inline-offset)] shrink-0 text-(--color-gold-dark)"
            :size="16"
          />
          <div>
            <strong
              class="block text-[length:var(--font-sm)] text-(--color-slate-dark)"
            >넣은 금액은 바로 저금통 잔액에 반영돼요</strong>
            <span
              class="mt-[var(--space-1)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
            >매일 밤 자동으로 깎이는 잔돈과 따로, 원할 때 더 넣을 수 있어요</span>
          </div>
        </section>

        <AppButton
          class="mt-[var(--space-7)]"
          block
          size="lg"
          variant="primary"
          :disabled="!donationStore.canDeposit"
          @click="openConfirm"
        >
          {{
            donationStore.canDeposit
              ? `저금통에 ${formatWon(depositAmount)} 넣기`
              : '저금통에 넣기'
          }}
        </AppButton>
        <p
          v-if="donationStore.operationError"
          class="mt-[var(--space-3)] text-center text-[length:var(--font-sm)] text-(--color-danger-strong)"
          role="alert"
        >
          {{ donationStore.operationError }}
        </p>
      </template>

      <EmptyState
        v-else
        :icon="IconSavings"
        message="애월지갑에 넣을 돈이 아직 없어요."
        action-text="저금통으로 돌아가기"
        action-route="/donation"
      />
    </template>
  </main>

  <BottomSheet
    v-model="isConfirmOpen"
    :title="confirmTitle"
  >
    <p class="m-0 text-[length:var(--font-sm)] text-(--color-slate-muted)">
      넣은 금액은 바로 저금통에서 기부하거나 모을 수 있어요
    </p>

    <dl
      class="mt-[var(--space-5)] mb-0 rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)]"
    >
      <div class="flex justify-between">
        <dt class="text-[length:var(--font-sm)] text-(--color-slate-dark)">
          넣을 금액
        </dt>
        <dd class="m-0 text-[length:var(--font-md)] font-bold">
          {{ formatWon(depositAmount) }}
        </dd>
      </div>
      <hr class="my-[var(--space-3)] border-0 border-t border-(--color-border)">
      <div class="flex justify-between">
        <dt class="text-[length:var(--font-sm)] text-(--color-slate-dark)">
          넣고 난 뒤 애월지갑 잔액
        </dt>
        <dd class="m-0 text-[length:var(--font-md)] font-bold">
          {{ formatWon(donationStore.balanceAfterDeposit) }}
        </dd>
      </div>
    </dl>

    <div class="mt-[var(--space-6)] flex gap-[var(--space-3)]">
      <AppButton
        block
        size="lg"
        variant="neutral"
        class="bg-(--color-white)!"
        @click="isConfirmOpen = false"
      >
        취소
      </AppButton>
      <AppButton
        block
        size="lg"
        variant="primary"
        :disabled="donationStore.isSubmitting"
        :loading="donationStore.isSubmitting"
        @click="confirmDeposit"
      >
        넣기
      </AppButton>
    </div>
  </BottomSheet>
</template>
