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

// 일기장 머리글은 '2026년 8월 18일 월요일'처럼 읽는 형식으로 쓴다.
// 입력용 date 값(yyyy-MM-dd)은 그대로 두고 표시만 바꾼다.
const diaryDateLabel = computed(() => {
  if (!diaryDate.value) return ''
  const parsed = new Date(`${diaryDate.value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return diaryDate.value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(parsed)
})

const isToday = computed(() => diaryDate.value === todayText)

const petName = computed(
  () => shareStore.pets.find((pet) => pet.id === petId.value)?.name ?? '',
)

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
    class="mx-auto min-h-[calc(100dvh-var(--header-height))] w-full max-w-(--content-max-width) box-border bg-(--color-app-bg) px-[var(--space-5)] pt-[var(--space-4)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <form @submit.prevent="submit">
      <!--
        폼이 아니라 일기장으로 보이게 한다. 종이 한 장 위에 날짜 머리글, 붙인 사진,
        줄 쳐진 본문이 차례로 놓이는 구조다. 저장 규칙과 API는 그대로다.
      -->
      <article
        class="overflow-hidden rounded-[var(--radius-2xl)] border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-card)"
      >
        <header
          class="flex items-baseline justify-between gap-[var(--space-3)] border-b border-dashed border-(--color-border) px-[var(--space-5)] pb-[var(--space-3)] pt-[var(--space-5)]"
        >
          <div class="min-w-0">
            <h1 class="m-0 text-[length:var(--font-lg)] font-bold leading-[1.3]">
              {{ diaryDateLabel }}
            </h1>
            <p class="mb-0 mt-[var(--space-1)] truncate text-(length:--font-sm) text-(--color-slate-muted)">
              {{ petName ? `${petName}와 보낸 하루` : '오늘 하루를 남겨요' }}
            </p>
          </div>
          <!--
            날짜는 대부분 오늘 그대로다. 그래서 입력칸을 앞세우지 않고, 바꾸고 싶을 때만
            누르는 작은 장치로 둔다. label 안에 input을 넣어 클릭 영역을 합쳤다.
          -->
          <label
            class="shrink-0 cursor-pointer rounded-full bg-(--color-surface) px-[var(--space-3)] py-[var(--space-1)] text-(length:--font-xs) font-bold text-(--color-slate-dark) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-leaf-dark)"
          >
            {{ isToday ? '오늘' : '날짜 변경' }}
            <input
              v-model="diaryDate"
              type="date"
              :max="todayText"
              required
              aria-label="일기 날짜"
              class="sr-only"
            >
          </label>
        </header>

        <div class="px-[var(--space-5)] pb-[var(--space-5)] pt-[var(--space-4)]">
          <div
            v-if="imagePreview"
            class="relative mb-[var(--space-4)]"
          >
            <!-- 사진은 일기장에 붙인 것처럼 흰 여백을 두르고 살짝 기울인다. -->
            <div class="rotate-[-1.2deg] rounded-[var(--radius-sm)] border border-(--color-card-border) bg-(--color-white) p-[var(--space-2)] shadow-(--shadow-card)">
              <img
                :src="imagePreview"
                alt="선택한 사진 미리보기"
                class="block max-h-[var(--diary-photo-max-height)] w-full rounded-[var(--radius-sm)] object-cover"
              >
            </div>
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
            class="mb-[var(--space-4)] flex h-[var(--control-height-lg)] cursor-pointer items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-dashed border-(--color-border) bg-(--color-surface) text-(length:--font-sm) text-(--color-slate-muted) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-leaf-dark)"
          >
            <input
              type="file"
              accept="image/*"
              class="sr-only"
              @change="handleFileSelect"
            >
            <IconImage :size="20" />
            사진 한 장 붙이기
          </label>

          <!--
            줄선은 배경으로 그린다. 줄 간격과 textarea의 line-height가 같은 토큰을
            써야 글줄이 선 위에 앉는다. padding-top도 한 줄 높이에 맞춘다.
          -->
          <label
            for="diary-content"
            class="sr-only"
          >오늘의 기록</label>
          <textarea
            id="diary-content"
            v-model="content"
            :maxlength="MAX_CONTENT_LENGTH"
            placeholder="산책은 어땠나요? 밥은 잘 먹었나요?"
            class="block w-full resize-none border-0 bg-transparent p-0 text-(length:--font-md) text-(--color-navy) placeholder:text-(--color-slate-muted) focus-visible:outline-none [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(var(--diary-line-height)-1px),var(--color-border)_calc(var(--diary-line-height)-1px),var(--color-border)_var(--diary-line-height))] [line-height:var(--diary-line-height)] min-h-[var(--diary-paper-min-height)]"
          />

          <p class="mb-0 mt-[var(--space-2)] text-right text-(length:--font-xs) text-(--color-slate-muted)">
            {{ content.length }} / {{ MAX_CONTENT_LENGTH }}
          </p>
        </div>
      </article>

      <p
        v-if="errorMessage"
        class="mt-[var(--space-4)] mb-0 text-(length:--font-sm) text-(--color-danger-strong)"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <AppButton
        class="mt-[var(--space-5)]"
        type="submit"
        variant="primary"
        block
        size="lg"
        :disabled="!canSubmit"
        :loading="diaryStore.isSubmitting"
      >
        일기 남기기
      </AppButton>
    </form>
  </div>
</template>
