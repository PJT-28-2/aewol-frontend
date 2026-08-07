<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import { useMemberStore } from '@/stores/member'
import petProfileSample from '@/assets/images/pet-profile-sample.png'

const router = useRouter()
const memberStore = useMemberStore()

const photoFile = ref(null)
const photoPreviewUrl = ref('')
const isConverting = ref(false)
const resultUrl = ref('')

function handleFileSelect(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있어요.')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하여야 해요.')
    return
  }
  photoFile.value = file
  photoPreviewUrl.value = URL.createObjectURL(file)
  resultUrl.value = ''
}

function handleConvert() {
  isConverting.value = true
  // TODO(backend): AI 프로필 사진 변환 API 연동 전이라 목업 이미지로 대체
  setTimeout(() => {
    resultUrl.value = petProfileSample
    isConverting.value = false
  }, 1200)
}

function handleReset() {
  photoFile.value = null
  photoPreviewUrl.value = ''
  resultUrl.value = ''
}

function handleApply() {
  memberStore.setPetProfilePhoto(resultUrl.value)
  router.replace('/settings')
}
</script>

<template>
  <div class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-4))] bg-(--color-gray-100) min-h-screen">
    <header class="mb-(--space-4)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        프로필 사진 만들기
      </h1>
      <p class="mt-(--space-1) text-(length:--font-md) text-(color:--color-slate-muted)">
        반려동물 사진을 올리면 AI가 귀여운 프로필로 바꿔드려요
      </p>
    </header>

    <!-- 업로드 단계 -->
    <div
      v-if="!resultUrl"
      class="rounded-(--radius-xl) bg-(--color-white) p-(--space-5) shadow-(--shadow-md)"
    >
      <label
        for="pet-photo-input"
        class="flex flex-col items-center justify-center w-full rounded-(--radius-lg) cursor-pointer overflow-hidden"
        :class="
          photoPreviewUrl
            ? ''
            : 'py-(--space-8) bg-(--color-surface) border-2 border-dashed border-(--color-gray-300)'
        "
      >
        <input
          id="pet-photo-input"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handleFileSelect"
        >
        <img
          v-if="photoPreviewUrl"
          :src="photoPreviewUrl"
          alt=""
          class="w-full h-[260px] object-cover"
        >
        <span
          v-else
          class="text-(length:--font-base) font-medium text-(color:--color-gray-500)"
        >
          + 반려동물 사진 첨부
        </span>
      </label>

      <AppButton
        v-if="photoFile"
        type="button"
        variant="primary"
        size="lg"
        block
        class="mt-(--space-5) !rounded-(--radius-lg)"
        :loading="isConverting"
        @click="handleConvert"
      >
        AI로 변환하기
      </AppButton>
    </div>

    <!-- 변환 결과 -->
    <div
      v-else
      class="rounded-(--radius-xl) bg-(--color-white) p-(--space-5) shadow-(--shadow-md)"
    >
      <p class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-(--space-4) text-center">
        이렇게 바꿔봤어요
      </p>
      <img
        :src="resultUrl"
        alt=""
        class="w-[180px] h-[180px] object-cover rounded-(--radius-full) mx-auto shadow-(--shadow-md)"
      >

      <div class="flex gap-(--space-3) mt-(--space-6)">
        <AppButton
          type="button"
          variant="secondary"
          size="lg"
          class="flex-1 !rounded-(--radius-lg) border-(--color-border)!"
          @click="handleReset"
        >
          다시 선택
        </AppButton>
        <AppButton
          type="button"
          variant="primary"
          size="lg"
          class="flex-1 !rounded-(--radius-lg)"
          @click="handleApply"
        >
          프로필로 설정
        </AppButton>
      </div>
    </div>
  </div>
</template>
