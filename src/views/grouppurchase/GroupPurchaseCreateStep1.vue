<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomSheet from '@/components/common/BottomSheet.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue'
import IconImage from '@/components/common/icons/IconImage.vue'

// TODO: 실제 등록 연동은 별도 작업에서 구현
const photos = ref([])
const productName = ref('')
const category = ref('')
const originalPrice = ref('')
const groupPrice = ref('')

const categoryOptions = ['사료', '간식', '영양제', '용품', '기타']
const isCategorySheetOpen = ref(false)
function selectCategory(option) {
  category.value = option
  isCategorySheetOpen.value = false
}

function handlePhotoChange(event) {
  const files = Array.from(event.target.files || [])
  photos.value = [...photos.value, ...files].slice(0, 5)
  event.target.value = ''
}

function removePhoto(index) {
  photos.value = photos.value.filter((_, i) => i !== index)
}

// 콤마/원 등 숫자 외 문자를 제거해 실제 금액만 추출
function parsePrice(value) {
  const digits = value.replace(/[^0-9]/g, '')
  return digits ? Number(digits) : 0
}

// 정가 대비 공동구매가 할인율 실시간 계산 (정가가 더 작거나 없으면 표시하지 않음)
const discountRate = computed(() => {
  const original = parsePrice(originalPrice.value)
  const group = parsePrice(groupPrice.value)
  if (!original || !group || group >= original) return 0
  return Math.round((1 - group / original) * 100)
})

// 사진, 상품명, 카테고리, 정가, 공동구매가격이 모두 입력되어야 다음 단계로 이동 가능
const isFormValid = computed(
  () =>
    photos.value.length > 0 &&
    productName.value.trim() !== '' &&
    category.value.trim() !== '' &&
    parsePrice(originalPrice.value) > 0 &&
    parsePrice(groupPrice.value) > 0,
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
          class="px-(--space-2) py-(--space-1) rounded-full bg-(--color-discount-bg) text-(color:--color-discount-text) text-(length:--font-xs) font-bold"
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
          multiple
          class="hidden"
          @change="handlePhotoChange"
        >
        <IconImage
          size="20"
          color="var(--color-slate-dark)"
        />
        <span class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark)">
          {{ photos.length > 0 ? `사진 ${photos.length}장 선택됨` : '사진 추가' }}
        </span>
        <span class="text-(length:--font-xs) text-(color:--color-slate-muted)">
          최대 5장
        </span>
      </label>

      <!-- 업로드한 파일명 목록 + 삭제 -->
      <ul
        v-if="photos.length > 0"
        class="mt-(--space-2) flex flex-col gap-(--space-1)"
      >
        <li
          v-for="(photo, index) in photos"
          :key="`${photo.name}-${index}`"
          class="flex items-center justify-between px-(--space-3) py-(--space-2) rounded-lg bg-(--color-surface)"
        >
          <span class="text-(length:--font-xs) text-(color:--color-slate-dark) truncate">
            {{ photo.name }}
          </span>
          <button
            type="button"
            class="text-(length:--font-xs) font-bold text-(color:--color-slate-muted)"
            @click="removePhoto(index)"
          >
            삭제
          </button>
        </li>
      </ul>
    </section>

    <!-- 상품명 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        상품명 *
      </label>
      <input
        v-model="productName"
        type="text"
        placeholder="예: 프리미엄 사료 15kg"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
      >
    </section>

    <!-- 카테고리 -->
    <section class="mb-(--space-5)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        카테고리 *
      </label>
      <button
        type="button"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) flex items-center justify-between"
        @click="isCategorySheetOpen = true"
      >
        <span
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
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        정가 *
      </label>
      <input
        v-model="originalPrice"
        type="text"
        inputmode="numeric"
        placeholder="40,000 원"
        class="w-full h-[46px] px-(--space-4) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
      >
    </section>

    <!-- 공동구매 가격 -->
    <section class="mb-(--space-6)">
      <label class="block text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-2)">
        공동구매 가격 *
      </label>
      <div class="relative">
        <input
          v-model="groupPrice"
          type="text"
          inputmode="numeric"
          placeholder="28,000 원"
          class="w-full h-[46px] pl-(--space-4) pr-(--space-9) rounded-xl bg-(--color-surface) border border-(--color-border) text-(length:--font-sm) text-(color:--color-navy) placeholder:text-(color:--color-slate-muted)"
        >
        <span
          v-if="discountRate > 0"
          class="absolute right-(--space-4) top-1/2 -translate-y-1/2 px-(--space-2) py-(--space-1) rounded-full bg-(--color-discount-bg) text-(color:--color-discount-text) text-(length:--font-xs) font-bold"
        >
          {{ discountRate }}% 할인
        </span>
      </div>
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
