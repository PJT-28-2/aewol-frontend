<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import IconClose from '@/components/common/icons/IconClose.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import { useShareStore } from '@/stores/share'
import { useShareDiaryStore } from '@/stores/shareDiary'

const MAX_CONTENT_LENGTH = 500
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const route = useRoute()
const router = useRouter()
const shareStore = useShareStore()
const diaryStore = useShareDiaryStore()

const petId = ref('')
const diaryDate = ref('')
const content = ref('')
const imageFile = ref(null)
const imagePreview = ref('')
const errorMessage = ref('')

const today = new Date()
const todayText = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('-')

const canSubmit = computed(
  () => Boolean(petId.value)
    && Boolean(diaryDate.value)
    && (content.value.trim().length > 0 || Boolean(imageFile.value)),
)

function releasePreview() {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
    imagePreview.value = ''
  }
}

function handleFileSelect(event) {
  const [file] = event.target.files ?? []
  event.target.value = ''
  if (!file) return

  if (file.size > MAX_IMAGE_BYTES) {
    errorMessage.value = '사진은 10MB까지 올릴 수 있어요.'
    return
  }

  errorMessage.value = ''
  releasePreview()
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  releasePreview()
  imageFile.value = null
}

async function submit() {
  if (!canSubmit.value || diaryStore.isSubmitting) return
  errorMessage.value = ''
  try {
    await diaryStore.createDiary({
      petId: petId.value,
      diaryDate: diaryDate.value,
      content: content.value.trim(),
      image: imageFile.value,
    })
    router.replace({ path: '/share/diary', query: { petId: petId.value } })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '일기를 저장하지 못했어요. 다시 시도해 주세요.'
  }
}

onMounted(async () => {
  diaryDate.value = todayText
  const pets = shareStore.pets.length > 0 ? shareStore.pets : await shareStore.fetchPets()
  petId.value = route.query.petId ?? pets[0]?.id ?? ''
})

onBeforeUnmount(releasePreview)
</script>

<template>
  <div
    class="mx-auto min-h-[calc(100dvh-var(--header-height))] w-full max-w-(--content-max-width) box-border bg-(--color-white) px-[var(--space-5)] pt-[var(--space-4)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <header>
      <h1 class="m-0 text-(length:--font-2xl) font-bold leading-[1.3] text-(--color-navy)">
        일기 쓰기
      </h1>
      <p class="mb-0 mt-[var(--space-1)] text-(length:--font-md) text-(--color-slate-muted)">
        사진과 한 줄이면 충분해요
      </p>
    </header>

    <form
      class="mt-[var(--space-6)]"
      @submit.prevent="submit"
    >
      <div>
        <label
          for="diary-date"
          class="block text-(length:--font-sm) font-semibold text-(--color-slate-dark)"
        >
          날짜
        </label>
        <input
          id="diary-date"
          v-model="diaryDate"
          type="date"
          :max="todayText"
          required
          class="mt-[var(--space-2)] h-[var(--control-height-md)] w-full rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-white) px-[var(--space-4)] text-(length:--font-md) text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-leaf-dark)"
        >
      </div>

      <div class="mt-[var(--space-5)]">
        <span class="block text-(length:--font-sm) font-semibold text-(--color-slate-dark)">
          사진
        </span>

        <div
          v-if="imagePreview"
          class="relative mt-[var(--space-2)]"
        >
          <img
            :src="imagePreview"
            alt="선택한 사진 미리보기"
            class="block max-h-[var(--diary-photo-max-height)] w-full rounded-[var(--radius-lg)] object-cover"
          >
          <AppButton
            class="absolute right-[var(--space-2)] top-[var(--space-2)]"
            variant="white"
            size="xs"
            icon-only
            pill
            aria-label="선택한 사진 제거"
            @click="removeImage"
          >
            <IconClose :size="16" />
          </AppButton>
        </div>

        <label
          v-else
          class="mt-[var(--space-2)] flex h-[var(--control-height-lg)] cursor-pointer items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-dashed border-(--color-border) bg-(--color-surface) text-(length:--font-md) text-(--color-slate-muted) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-leaf-dark)"
        >
          <input
            type="file"
            accept="image/*"
            class="sr-only"
            @change="handleFileSelect"
          >
          <IconImage :size="20" />
          사진 첨부하기
        </label>
      </div>

      <div class="mt-[var(--space-5)]">
        <label
          for="diary-content"
          class="block text-(length:--font-sm) font-semibold text-(--color-slate-dark)"
        >
          오늘의 기록
        </label>
        <textarea
          id="diary-content"
          v-model="content"
          rows="5"
          :maxlength="MAX_CONTENT_LENGTH"
          placeholder="산책은 어땠나요? 밥은 잘 먹었나요?"
          class="mt-[var(--space-2)] w-full resize-none rounded-[var(--radius-lg)] border border-(--color-border) bg-(--color-white) p-[var(--space-4)] text-(length:--font-md) leading-[1.6] text-(--color-navy) placeholder:text-(--color-slate-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-leaf-dark)"
        />
        <p class="mb-0 mt-[var(--space-1)] text-right text-(length:--font-xs) text-(--color-slate-muted)">
          {{ content.length }} / {{ MAX_CONTENT_LENGTH }}
        </p>
      </div>

      <p
        v-if="errorMessage"
        class="mt-[var(--space-4)] mb-0 text-(length:--font-sm) text-(--color-danger-strong)"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <AppButton
        class="mt-[var(--space-6)]"
        type="submit"
        variant="primary"
        block
        :disabled="!canSubmit"
        :loading="diaryStore.isSubmitting"
      >
        기록 남기기
      </AppButton>
    </form>
  </div>
</template>
