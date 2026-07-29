<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import BottomSheet from '@/components/common/BottomSheet.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import { useGroupPurchaseCreateStore } from '@/stores/groupPurchase'

// 1~3단계가 공유하는 작성 데이터 (3단계 최종 확인에서 그대로 사용)
const groupPurchaseCreateStore = useGroupPurchaseCreateStore()
const { image, productName, category, unitPrice, groupPrice } = storeToRefs(
  groupPurchaseCreateStore,
)

const categoryOptions = ['사료', '간식', '영양제', '용품', '기타']
const isCategorySheetOpen = ref(false)
function selectCategory(option) {
  category.value = option
  isCategorySheetOpen.value = false
}

function handleImageChange(event) {
  const file = event.target.files?.[0]
  if (file) image.value = file
  event.target.value = ''
}

function removeImage() {
  image.value = null
}

// 콤마/원 등 숫자 외 문자를 제거해 실제 금액만 추출, 음수X
function parsePrice(value) {
  const raw = String(value).trim()
  if (raw.includes('-')) return 0
  const digits = raw.replace(/[^0-9]/g, '')
  return digits ? Number(digits) : 0
}

// 정가 대비 공동구매가 할인율 실시간 계산 (정가가 더 작거나 없으면 표시하지 않음)
const discountRate = computed(() => {
  const original = parsePrice(unitPrice.value)
  const group = parsePrice(groupPrice.value)
  if (!original || !group || group >= original) return 0
  return Math.round((1 - group / original) * 100)
})

// 공동구매 가격이 정가보다 높은 경우 (둘 다 입력됐을 때만 검사)
const isGroupPriceTooHigh = computed(() => {
  const original = parsePrice(unitPrice.value)
  const group = parsePrice(groupPrice.value)
  return original > 0 && group > 0 && group > original
})

// 사진, 상품명, 카테고리, 정가, 공동구매가격이 모두 입력되고 가격이 유효해야 다음 단계로 이동 가능
const isFormValid = computed(
  () =>
    image.value !== null &&
    productName.value.trim() !== '' &&
    category.value.trim() !== '' &&
    parsePrice(unitPrice.value) > 0 &&
    parsePrice(groupPrice.value) > 0 &&
    !isGroupPriceTooHigh.value,
)

const router = useRouter()
function goToNextStep() {
  router.push('/group-purchase/create/step2')
}
</script>

<template>
  <div class="p-(--space-4) pb-(--space-8) bg-(--color-bg) min-h-screen">
    <header class="mb-(--space-5)">
      <div class="flex items-center justify-between mb-(--space-4)">
        <router-link
          to="/group-purchase"
          class="inline-flex text-(color:--color-navy) no-underline"
          aria-label="공동구매 목록으로"
        >
          <IconArrowLeft
            size="18"
            color="var(--color-navy)"
          />
        </router-link>
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-muted)">
          1/3
        </p>
      </div>
      <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy) mb-(--space-1)">
        상품 정보
      </h1>
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        판매할 상품 정보를 입력해주세요
      </p>
    </header>

    <!-- 사진 업로드 (필수) -->
    <section class="mb-(--space-6)">
      <div class="flex items-center gap-(--space-2) mb-(--space-3)">
        <p class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark)">
          사진 직접 업로드
        </p>
        <span
          class="px-(--space-2) py-(--space-1) rounded-full bg-(--color-gold-surface) text-(color:--color-gold-dark) text-(length:--font-xs) font-bold"
        >
          필수
        </span>
      </div>
      <label
        class="w-full h-[90px] rounded-2xl bg-(--color-white) border-[1.2px] border-(--color-slate-muted) flex flex-col items-center justify-center gap-(--space-1) cursor-pointer"
      >
        <input
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleImageChange"
        >
        <IconImage
          size="20"
          color="var(--color-slate-dark)"
        />
        <span class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark)">
          {{ image ? '사진 선택됨' : '사진 추가' }}
        </span>
      </label>

      <!-- 업로드한 파일명 + 삭제 -->
      <div
        v-if="image"
        class="mt-(--space-2) flex items-center justify-between px-(--space-3) py-(--space-2) rounded-lg bg-(--color-surface)"
      >
        <span class="text-(length:--font-xs) text-(color:--color-slate-dark) truncate">
          {{ image.name }}
        </span>
        <button
          type="button"
          class="text-(length:--font-xs) font-bold text-(color:--color-slate-muted)"
          @click="removeImage"
        >
          삭제
        </button>
      </div>
    </section>

    <!-- 상품명 -->
    <section class="mb-(--space-5)">
      <label
        for="product-name"
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
        상품명 *
      </label>
      <input
        id="product-name"
        v-model="productName"
        type="text"
        placeholder="예: 프리미엄 사료 15kg"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
      >
    </section>

    <!-- 카테고리 -->
    <section class="mb-(--space-5)">
      <label
        id="category-label"
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
      카테고리 *
      </label>
      <button
        type="button"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) flex items-center justify-between"
        aria-labelledby="category-label category-value"
        @click="isCategorySheetOpen = true"
      >
        <span
          id="category-value"
          class="text-(length:--font-sm)"
          :class="category === '' ? 'text-(color:--color-slate-muted)' : 'text-(color:--color-navy)'"
        >
          {{ category === '' ? '카테고리를 선택해주세요' : category }}
        </span>
        <IconChevronDown
          size="14"
          color="var(--color-slate-muted)"
        />
      </button>
    </section>

    <BottomSheet
      v-model="isCategorySheetOpen"
      title="카테고리 선택"
    >
      <ul>
        <li
          v-for="option in categoryOptions"
          :key="option"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              category === option
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectCategory(option)"
          >
            <span>{{ option }}</span>
            <IconCheck
              v-if="category === option"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>

    <!-- 정가 -->
    <section class="mb-(--space-5)">
      <label
        for="unit-price"
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
        정가 *
      </label>
      <input
        id="unit-price"
        v-model="unitPrice"
        type="text"
        inputmode="numeric"
        placeholder="40,000 원"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
      >
    </section>

    <!-- 공동구매 가격 -->
    <section class="mb-(--space-6)">
      <label
        for="group-price"
        class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)"
      >
        공동구매 가격 *
      </label>
      <div class="relative">
        <input
          id="group-price"
          v-model="groupPrice"
          type="text"
          inputmode="numeric"
          placeholder="28,000 원"
          class="w-full h-[46px] pl-(--space-4) pr-(--space-9) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
        >
        <span
          v-if="discountRate > 0"
          class="absolute right-(--space-4) top-1/2 -translate-y-1/2 px-(--space-2) py-(--space-1) rounded-full bg-(--color-gold-surface) text-(color:--color-gold-dark) text-(length:--font-xs) font-bold"
        >
          {{ discountRate }}% 할인
        </span>
      </div>
      <p
        v-if="isGroupPriceTooHigh"
        class="mt-(--space-2) text-(length:--font-xs) text-(color:--color-danger)"
      >
        공동구매 가격은 정가보다 높을 수 없습니다
      </p>
    </section>

    <!-- 다음: 사진/필수 입력값이 모두 채워져야 2단계(구매 조건)로 이동 가능 -->
    <button
      type="button"
      class="w-full h-[52px] rounded-2xl bg-(--color-navy) text-(color:--color-white) text-(length:--font-md) font-bold disabled:opacity-40"
      :disabled="!isFormValid"
      @click="goToNextStep"
    >
      다음
    </button>
  </div>
</template>
