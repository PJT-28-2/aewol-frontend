<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconQrCode from '@/components/common/icons/IconQrCode.vue'
import IconWallet from '@/components/common/icons/IconWallet.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import { mockWalletBalance } from '@/mocks/transaction'

const router = useRouter()
const fileInput = ref(null)
const selectedFileName = ref('')
const formattedBalance = computed(() => Number(mockWalletBalance).toLocaleString('ko-KR'))

function openGallery() {
  fileInput.value?.click()
}

function handleFile(event) {
  selectedFileName.value = event.target.files?.[0]?.name ?? ''
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

    <p class="text-(length:--font-sm) text-(color:--color-slate-light)">
      매장의 QR을 화면 안에 맞춰주세요.
    </p>

    <div class="mt-(--space-4) flex h-[354px] items-center justify-center rounded-[30px] bg-(--color-navy-light) p-(--space-8)">
      <div class="flex size-[248px] flex-col items-center justify-center rounded-[28px] border-[3px] border-dashed border-(--color-leaf)">
        <IconQrCode
          size="72"
          color="var(--color-white)"
        />
        <p class="mt-(--space-5) text-(length:--font-sm) font-medium text-(color:--color-slate-light)">
          QR 인식 영역
        </p>
      </div>
    </div>

    <article class="mt-(--space-5) rounded-[26px] bg-(--color-white) p-(--space-5) text-(color:--color-navy)">
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
        <p class="text-(length:--font-lg) font-bold">
          {{ formattedBalance }}원
        </p>
      </div>
      <button
        type="button"
        class="mt-(--space-5) flex h-(--control-height-lg) w-full items-center justify-center gap-(--space-2) rounded-[18px] bg-(--color-leaf-soft) text-(length:--font-sm) font-bold"
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
      <p
        v-if="selectedFileName"
        class="mt-(--space-2) truncate text-center text-(length:--font-xs) text-(color:--color-slate-muted)"
      >
        {{ selectedFileName }}
      </p>
    </article>
  </section>
</template>
