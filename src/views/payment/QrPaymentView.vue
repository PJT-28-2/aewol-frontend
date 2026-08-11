<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconQrCode from '@/components/common/icons/IconQrCode.vue'
import IconWallet from '@/components/common/icons/IconWallet.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'
import AppButton from '@/components/common/AppButton.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { transactionApi } from '@/api/transaction'
import { useWalletStore } from '@/stores/wallet'
import { FILE_DECODE_ERROR_MESSAGE, useQrScanner } from '@/composables/useQrScanner'
import { parseQrPayment } from '@/utils/qr'

const router = useRouter()
const walletStore = useWalletStore()

// scan(스캔 대기) → confirm(인식 결과 확인) → done(결제 완료)
const step = ref('scan')
const fileInput = ref(null)
const isDecodingFile = ref(false)
// QR을 읽었지만 결제 정보로 쓸 수 없을 때의 안내(다른 앱 QR, 손상된 페이로드 등)
const scanMessage = ref('')
const detectedPayment = ref(null)
const isPaying = ref(false)
const paymentError = ref('')

const isBalanceLoading = ref(false)
const balance = computed(() => walletStore.wallet?.totalBalance ?? null)
const formattedBalance = computed(() =>
  balance.value === null ? '-' : balance.value.toLocaleString('ko-KR'),
)
const balanceAfterPayment = computed(() => {
  if (balance.value === null || !detectedPayment.value) return null
  return balance.value - detectedPayment.value.amount
})
// 잔액을 못 불러온 상태(null)에서는 막지 않는다. 최종 판정은 어차피 서버가 한다.
const isBalanceShort = computed(
  () => balanceAfterPayment.value !== null && balanceAfterPayment.value < 0,
)

const { videoRef, isCameraOn, isCameraStarting, cameraError, startCamera, stopCamera, decodeImageFile } =
  useQrScanner({ onDetect: handleDetected })

onMounted(() => {
  loadBalance()
  startCamera()
})

async function loadBalance() {
  isBalanceLoading.value = true
  try {
    await walletStore.fetchWallet()
  } catch {
    // 잔액 조회 실패로 스캔까지 막지는 않는다. 잔액 자리에는 '-'가 보이고 결제는 그대로 시도할 수 있다.
  } finally {
    isBalanceLoading.value = false
  }
}

function handleDetected(text) {
  const parsed = parseQrPayment(text)
  if (!parsed.ok) {
    scanMessage.value = parsed.message
    return
  }

  scanMessage.value = ''
  paymentError.value = ''
  detectedPayment.value = { merchantName: parsed.merchantName, amount: parsed.amount }
  step.value = 'confirm'
}

async function restartScan() {
  scanMessage.value = ''
  paymentError.value = ''
  detectedPayment.value = null
  step.value = 'scan'
  // v-if로 감춰둔 스캔 영역이 다시 그려져야 video 엘리먼트에 스트림을 붙일 수 있다.
  await nextTick()
  startCamera()
}

function openGallery() {
  // 파일을 고르는 동안 카메라가 QR을 먼저 잡아버리면 화면이 엉키므로 스캔을 멈춘다.
  stopCamera()
  fileInput.value?.click()
}

async function handleFile(event) {
  const input = event.target
  const file = input.files?.[0]
  // 같은 파일을 다시 고를 수 있도록 값을 비운다(change 이벤트가 안 뜨는 문제 방지).
  input.value = ''
  if (!file) return

  scanMessage.value = ''
  isDecodingFile.value = true
  try {
    const text = await decodeImageFile(file)
    if (text) {
      handleDetected(text)
    } else {
      scanMessage.value = FILE_DECODE_ERROR_MESSAGE
    }
  } catch {
    scanMessage.value = '사진을 열지 못했어요. 다른 이미지로 시도해주세요.'
  } finally {
    isDecodingFile.value = false
  }
}

async function submitPayment() {
  if (!detectedPayment.value || isPaying.value) return

  isPaying.value = true
  paymentError.value = ''
  try {
    await transactionApi.createPayment({
      merchantName: detectedPayment.value.merchantName,
      amount: detectedPayment.value.amount,
    })
    // 결제는 이미 끝났으므로 잔액 재조회가 실패해도 완료 화면으로 넘어간다.
    try {
      await walletStore.fetchWallet()
    } catch {
      // 재조회 실패 시 결제 금액을 차감해 완료 화면에 근사 잔액을 표시한다.
      // 기존 잔액 정보가 없으면 null로 두어 '-'로 표시한다.
      if (walletStore.wallet !== null) {
        walletStore.$patch(state => {
          state.wallet.totalBalance -= detectedPayment.value.amount
        })
      }
    }
    step.value = 'done'
  } catch (error) {
    paymentError.value = toPaymentErrorMessage(error)
  } finally {
    isPaying.value = false
  }
}

// 백엔드 오류 응답은 { status, message, result } 형태라 message에 사유가 담긴다.
// (예: 잔액 부족 시 400 "잔액이 부족합니다.")
function toPaymentErrorMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.response) return '결제를 처리하지 못했어요. 잠시 후 다시 시도해주세요.'
  return '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
}
</script>

<template>
  <section class="min-h-svh bg-(--color-navy) px-(--space-5) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-8))] text-(color:--color-white)">
    <header class="mb-(--space-5) flex h-[42px] items-center justify-between">
      <h1 class="text-(length:--font-2xl) font-bold">
        QR 결제
      </h1>
      <button
        type="button"
        class="rounded-(--radius-full) bg-(--color-navy-light) px-(--space-3) py-(--space-2) text-(length:--font-xs) font-semibold"
        @click="router.push('/wallet/history')"
      >
        거래 내역
      </button>
    </header>

    <!-- 1단계: 스캔 -->
    <template v-if="step === 'scan'">
      <p class="text-(length:--font-sm) text-(color:--color-slate-light)">
        매장의 QR을 화면 안에 맞춰주세요.
      </p>

      <div class="relative mt-(--space-4) flex h-[354px] items-center justify-center overflow-hidden rounded-[30px] bg-(--color-navy-light) p-(--space-8)">
        <!-- 스트림을 붙이려면 카메라를 켜기 전에도 엘리먼트가 있어야 해서 v-show를 쓴다 -->
        <video
          v-show="isCameraOn"
          ref="videoRef"
          class="absolute inset-0 size-full object-cover"
          muted
          playsinline
        />

        <div
          v-if="isCameraOn"
          class="pointer-events-none relative size-[248px] rounded-[28px] border-[3px] border-dashed border-(--color-leaf)"
        />

        <div
          v-else-if="isCameraStarting || isDecodingFile"
          class="flex flex-col items-center gap-(--space-4)"
        >
          <LoadingSpinner
            size="lg"
            color="leaf"
          />
          <p class="text-(length:--font-sm) text-(color:--color-slate-light)">
            {{ isDecodingFile ? '사진에서 QR을 찾는 중이에요' : '카메라를 여는 중이에요' }}
          </p>
        </div>

        <div
          v-else-if="cameraError"
          class="flex flex-col items-center px-(--space-4) text-center"
        >
          <IconWarning
            size="40"
            color="var(--color-slate-light)"
          />
          <p class="mt-(--space-4) text-(length:--font-sm) text-(color:--color-slate-light)">
            {{ cameraError.message }}
          </p>
          <AppButton
            v-if="cameraError.code !== 'INSECURE'"
            class="mt-(--space-4)"
            variant="white"
            size="sm"
            @click="startCamera"
          >
            카메라 다시 열기
          </AppButton>
        </div>

        <div
          v-else
          class="flex size-[248px] flex-col items-center justify-center rounded-[28px] border-[3px] border-dashed border-(--color-leaf)"
        >
          <IconQrCode
            size="72"
            color="var(--color-white)"
          />
          <AppButton
            class="mt-(--space-5)"
            variant="white"
            size="sm"
            @click="startCamera"
          >
            카메라 켜기
          </AppButton>
        </div>
      </div>

      <p
        v-if="scanMessage"
        class="mt-(--space-3) flex items-start gap-(--space-2) rounded-(--radius-xl) bg-[color-mix(in_srgb,var(--color-danger-strong)_18%,transparent)] p-(--space-3) text-(length:--font-sm) text-(color:--color-white)"
        role="alert"
      >
        <IconWarning
          size="16"
          color="currentColor"
          class="mt-[2px] shrink-0"
        />
        {{ scanMessage }}
      </p>
    </template>

    <!-- 2단계: 인식 결과 확인 -->
    <template v-else-if="step === 'confirm'">
      <p class="text-(length:--font-sm) text-(color:--color-slate-light)">
        결제 정보를 확인해주세요.
      </p>

      <article class="mt-(--space-4) rounded-[30px] bg-(--color-navy-light) p-(--space-6)">
        <p class="text-(length:--font-sm) text-(color:--color-slate-light)">
          {{ detectedPayment.merchantName }}
        </p>
        <p class="mt-(--space-2) text-(length:--font-3xl) font-bold">
          {{ detectedPayment.amount.toLocaleString('ko-KR') }}원
        </p>

        <dl class="mt-(--space-6) flex flex-col gap-(--space-3) border-t border-[color-mix(in_srgb,var(--color-white)_14%,transparent)] pt-(--space-5) text-(length:--font-sm)">
          <div class="flex items-center justify-between">
            <dt class="text-(color:--color-slate-light)">
              현재 잔액
            </dt>
            <dd class="font-semibold">
              {{ formattedBalance }}원
            </dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-(color:--color-slate-light)">
              결제 후 잔액
            </dt>
            <dd
              class="font-semibold"
              :class="isBalanceShort ? 'text-(color:--color-danger-strong)' : ''"
            >
              {{ balanceAfterPayment === null ? '-' : `${balanceAfterPayment.toLocaleString('ko-KR')}원` }}
            </dd>
          </div>
        </dl>
      </article>

      <p
        v-if="isBalanceShort || paymentError"
        class="mt-(--space-3) flex items-start gap-(--space-2) rounded-(--radius-xl) bg-[color-mix(in_srgb,var(--color-danger-strong)_18%,transparent)] p-(--space-3) text-(length:--font-sm) text-(color:--color-white)"
        role="alert"
      >
        <IconWarning
          size="16"
          color="currentColor"
          class="mt-[2px] shrink-0"
        />
        {{ paymentError || '잔액이 부족해요. 충전 후 다시 시도해주세요.' }}
      </p>

      <div class="mt-(--space-5) flex flex-col gap-(--space-3)">
        <AppButton
          variant="primary"
          size="lg"
          block
          :loading="isPaying"
          :disabled="isBalanceShort"
          @click="submitPayment"
        >
          {{ detectedPayment.amount.toLocaleString('ko-KR') }}원 결제하기
        </AppButton>
        <AppButton
          v-if="isBalanceShort"
          variant="white"
          size="lg"
          block
          @click="router.push('/wallet/charge')"
        >
          충전하러 가기
        </AppButton>
        <AppButton
          variant="ghost"
          size="lg"
          block
          class="text-(color:--color-slate-light)"
          :disabled="isPaying"
          @click="restartScan"
        >
          다시 스캔하기
        </AppButton>
      </div>
    </template>

    <!-- 3단계: 결제 완료 -->
    <template v-else>
      <div class="mt-(--space-8) flex flex-col items-center text-center">
        <span class="flex size-[72px] items-center justify-center rounded-(--radius-full) bg-(--color-leaf)">
          <IconCheck
            size="36"
            color="var(--color-navy)"
          />
        </span>
        <p class="mt-(--space-5) text-(length:--font-md) text-(color:--color-slate-light)">
          {{ detectedPayment.merchantName }}
        </p>
        <p class="mt-(--space-2) text-(length:--font-3xl) font-bold">
          {{ detectedPayment.amount.toLocaleString('ko-KR') }}원
        </p>
        <p class="mt-(--space-3) text-(length:--font-sm) text-(color:--color-slate-light)">
          결제가 완료되었어요
        </p>
      </div>

      <article class="mt-(--space-8) flex items-center justify-between rounded-[26px] bg-(--color-navy-light) p-(--space-5) text-(length:--font-sm)">
        <span class="text-(color:--color-slate-light)">남은 잔액</span>
        <span class="text-(length:--font-lg) font-bold">{{ formattedBalance }}원</span>
      </article>

      <div class="mt-(--space-5) flex flex-col gap-(--space-3)">
        <AppButton
          variant="primary"
          size="lg"
          block
          @click="router.push('/wallet/history')"
        >
          거래 내역 보기
        </AppButton>
        <AppButton
          variant="ghost"
          size="lg"
          block
          class="text-(color:--color-slate-light)"
          @click="restartScan"
        >
          다시 결제하기
        </AppButton>
      </div>
    </template>

    <!-- 지갑 카드는 스캔 단계에서만 노출 -->
    <article
      v-if="step === 'scan'"
      class="mt-(--space-5) rounded-[26px] bg-(--color-white) p-(--space-5) text-(color:--color-navy)"
    >
      <div class="flex items-center gap-(--space-3)">
        <FeatureIconTile
          :icon="IconWallet"
          tone="green"
        />
        <div class="flex-1">
          <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
            결제 지갑
          </p>
          <p class="mt-[2px] text-(length:--font-md) font-bold">
            포리의 애월 지갑
          </p>
        </div>
        <LoadingSpinner
          v-if="isBalanceLoading"
          size="sm"
        />
        <p
          v-else
          class="text-(length:--font-lg) font-bold"
        >
          {{ formattedBalance }}원
        </p>
      </div>
      <button
        type="button"
        class="mt-(--space-5) flex h-(--control-height-lg) w-full items-center justify-center gap-(--space-2) rounded-[18px] bg-(--color-leaf-soft) text-(length:--font-sm) font-bold disabled:opacity-50"
        :disabled="isDecodingFile"
        @click="openGallery"
      >
        <IconImage size="24" /> 사진에서 QR 불러오기
      </button>
      <input
        ref="fileInput"
        class="hidden"
        type="file"
        accept="image/*"
        @change="handleFile"
      >
    </article>
  </section>
</template>
