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
const { balance, isLoading, withdrawAmount, withdrawError } =
  storeToRefs(donationStore)

const isConfirmOpen = ref(false)

const hasBalance = computed(() => balance.value > 0)

/** 입력 중 천 단위 콤마를 유지하기 위해 표시용 문자열을 따로 만든다. */
const withdrawAmountInput = computed(() =>
  withdrawAmount.value > 0 ? withdrawAmount.value.toLocaleString('ko-KR') : '',
)

const confirmTitle = computed(
  () => `${formatWon(withdrawAmount.value)}을 지갑으로 옮길까요?`,
)

function onAmountInput(value) {
  const digitsOnly = String(value).replace(/[^\d]/g, '')

  donationStore.setWithdrawAmount(digitsOnly ? Number(digitsOnly) : 0)
}

function selectPreset(preset) {
  donationStore.setWithdrawAmount(preset)
}

function openConfirm() {
  if (!donationStore.validateWithdrawAmount()) return

  isConfirmOpen.value = true
}

/**
 * 시트를 닫는 leave 트랜지션 도중 라우트가 바뀌면 Teleport 노드가 body에 남아
 * 화면 전체를 덮는 오버레이가 클릭을 가로챈다. 이동 시에는 닫기 토글 없이
 * 언마운트가 시트를 정리하도록 둔다.
 */
async function confirmWithdraw() {
  if (!(await donationStore.withdraw())) return

  donationStore.resetWithdraw()
  router.push('/wallet')
}

onMounted(() => {
  donationStore.resetWithdraw()

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
        출금하기
      </h1>

      <section
        class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-leaf-soft) px-[var(--space-5)] py-[var(--space-4)] text-(--color-navy) shadow-(--shadow-card)"
      >
        <span
          class="block text-[length:var(--font-sm)] text-(--color-slate-light)"
        >내 저금통 잔액</span>
        <strong class="block text-[length:var(--font-2xl)]">
          ₩{{ balance.toLocaleString('ko-KR') }}
        </strong>
      </section>

      <template v-if="hasBalance">
        <div class="mt-[var(--space-6)]">
          <AppInput
            :model-value="withdrawAmountInput"
            label="출금 금액 (원)"
            placeholder="출금할 금액을 입력해주세요"
            inputmode="numeric"
            :error="withdrawError"
            @update:model-value="onAmountInput"
            @focusout="donationStore.validateWithdrawAmount()"
          />
        </div>

        <div class="mt-[var(--space-3)] flex gap-[var(--space-2)]">
          <SelectableChip
            v-for="preset in donationAmountPresets"
            :key="preset"
            block
            shape="rounded"
            :selected="withdrawAmount === preset"
            :disabled="preset > balance"
            @click="selectPreset(preset)"
          >
            {{ formatWon(preset) }}
          </SelectableChip>
          <SelectableChip
            block
            shape="rounded"
            :selected="withdrawAmount === balance"
            @click="selectPreset(balance)"
          >
            전액
          </SelectableChip>
        </div>

        <section
          class="mt-[var(--space-4)] flex items-center justify-between rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)]"
        >
          <span class="text-[length:var(--font-sm)] text-(--color-slate-dark)">
            {{ withdrawError ? '출금 가능 금액' : '출금 후 저금통 잔액' }}
          </span>
          <strong class="text-[length:var(--font-md)] font-bold">
            {{
              withdrawError
                ? formatWon(balance)
                : formatWon(donationStore.balanceAfterWithdraw)
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
            >출금한 잔돈은 지갑 잔액에 바로 반영돼요</strong>
            <span
              class="mt-[var(--space-1)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
            >저금통에 남은 금액은 계속 모을 수 있어요</span>
          </div>
        </section>

        <AppButton
          class="mt-[var(--space-7)]"
          block
          size="lg"
          variant="primary"
          :disabled="!donationStore.canWithdraw"
          @click="openConfirm"
        >
          {{
            donationStore.canWithdraw
              ? `지갑으로 ${formatWon(withdrawAmount)} 출금하기`
              : '지갑으로 출금하기'
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
        message="저금통에 모인 잔돈이 아직 없어요. 매일 밤 지갑 잔돈이 모여요."
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
      출금한 금액은 바로 지갑에서 사용할 수 있어요
    </p>

    <dl
      class="mt-[var(--space-5)] mb-0 rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)]"
    >
      <div class="flex justify-between">
        <dt class="text-[length:var(--font-sm)] text-(--color-slate-dark)">
          출금 금액
        </dt>
        <dd class="m-0 text-[length:var(--font-md)] font-bold">
          {{ formatWon(withdrawAmount) }}
        </dd>
      </div>
      <hr class="my-[var(--space-3)] border-0 border-t border-(--color-border)">
      <div class="flex justify-between">
        <dt class="text-[length:var(--font-sm)] text-(--color-slate-dark)">
          출금 후 저금통 잔액
        </dt>
        <dd class="m-0 text-[length:var(--font-md)] font-bold">
          {{ formatWon(donationStore.balanceAfterWithdraw) }}
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
        @click="confirmWithdraw"
      >
        출금하기
      </AppButton>
    </div>
  </BottomSheet>
</template>
