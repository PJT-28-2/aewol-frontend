<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import IconClose from '@/components/common/icons/IconClose.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import { shareApi } from '@/api/share'
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

// 수정 모드는 ?diaryId=로 들어온다. 화면 구조가 작성과 같아 별도 뷰를 만들지 않는다.
const diaryId = computed(() => route.query.diaryId ?? '')
const isEditMode = computed(() => Boolean(diaryId.value))
// 불러올 때 받은 버전. 저장 요청에 그대로 실어 보내 그 사이 다른 곳에서 저장됐는지
// 서버가 판정하게 한다.
const loadedVersion = ref(null)
// 수정 모드에서 기존 사진은 그대로 두고 바꿀 수 없다. 서버 PUT이 사진을 받지 않는다.
const existingImage = ref('')
const isLoadingDiary = ref(false)
const isStale = ref(false)

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
    && (content.value.trim().length > 0 || Boolean(imageFile.value) || Boolean(existingImage.value)),
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

/** 수정 화면에 기존 내용을 채워 넣는다. 실패하면 빈 화면 대신 이유를 보여준다. */
async function loadDiary() {
  isLoadingDiary.value = true
  try {
    const diary = (await shareApi.getDiary(diaryId.value)).data?.result
    if (!diary) throw new Error('empty')
    diaryDate.value = diary.diaryDate
    content.value = diary.content ?? ''
    loadedVersion.value = diary.version ?? null
    existingImage.value = diary.images?.[0] ?? ''
    if (diary.petId) petId.value = diary.petId
  } catch (error) {
    errorMessage.value = error.response?.data?.message
      || '일기를 불러오지 못했어요. 목록에서 다시 시도해 주세요.'
  } finally {
    isLoadingDiary.value = false
  }
}

async function submit() {
  if (!canSubmit.value || diaryStore.isSubmitting) return
  errorMessage.value = ''
  try {
    if (isEditMode.value) {
      await diaryStore.updateDiary(diaryId.value, {
        diaryDate: diaryDate.value,
        content: content.value.trim(),
        version: loadedVersion.value,
      })
    } else {
      await diaryStore.createDiary({
        petId: petId.value,
        diaryDate: diaryDate.value,
        content: content.value.trim(),
        image: imageFile.value,
      })
    }
    router.replace({ path: '/share/diary', query: { petId: petId.value } })
  } catch (error) {
    // 409는 그 사이 다른 곳에서 저장됐다는 뜻이다. 그냥 다시 누르면 남의 수정을 덮어쓰게
    // 되므로, 저장 버튼 대신 다시 불러오기를 내밀어 최신 내용을 보고 판단하게 한다.
    if (error.response?.status === 409) {
      isStale.value = true
      errorMessage.value = error.response?.data?.message
        || '다른 곳에서 이 일기를 먼저 수정했어요. 최신 내용을 불러온 뒤 다시 저장해 주세요.'
      return
    }
    errorMessage.value = error.response?.data?.message || '일기를 저장하지 못했어요. 다시 시도해 주세요.'
  }
}

/** 409 이후 최신 내용을 다시 받아온다. 사용자가 쓰던 글은 덮어쓰므로 확인 후 부른다. */
async function reloadLatest() {
  isStale.value = false
  errorMessage.value = ''
  await loadDiary()
}

onMounted(async () => {
  diaryDate.value = todayText
  const pets = shareStore.pets.length > 0 ? shareStore.pets : await shareStore.fetchPets()
  petId.value = route.query.petId ?? pets[0]?.id ?? ''
  if (isEditMode.value) await loadDiary()
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
              {{ isEditMode ? '남긴 일기를 고쳐요' : (petName ? `${petName}와 보낸 하루` : '오늘 하루를 남겨요') }}
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

          <!--
            수정 모드에서는 사진을 바꿀 수 없다. 서버 PUT이 날짜와 내용만 받기 때문이다.
            기존 사진은 그대로 보여주되 제거 버튼 없이 두고, 바꿀 수 없다는 것을 적는다.
          -->
          <div
            v-else-if="isEditMode && existingImage"
            class="mb-[var(--space-4)]"
          >
            <div class="rotate-[-1.2deg] rounded-[var(--radius-sm)] border border-(--color-card-border) bg-(--color-white) p-[var(--space-2)] shadow-(--shadow-card)">
              <img
                :src="existingImage"
                alt="이 일기에 붙인 사진"
                class="block max-h-[var(--diary-photo-max-height)] w-full rounded-[var(--radius-sm)] object-cover"
              >
            </div>
            <p class="mb-0 mt-[var(--space-2)] text-center text-(length:--font-xs) text-(--color-slate-muted)">
              사진은 바꿀 수 없어요. 날짜와 내용만 고칠 수 있어요.
            </p>
          </div>

          <label
            v-else-if="!isEditMode"
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

      <!--
        409를 받은 뒤에는 저장을 그대로 다시 누르게 두지 않는다. 다시 누르면 남이 먼저
        저장한 내용을 덮어쓰기 때문이다. 최신 내용을 받아보고 판단하도록 유도한다.
      -->
      <AppButton
        v-if="isStale"
        class="mt-[var(--space-5)]"
        type="button"
        variant="secondary"
        block
        size="lg"
        :loading="isLoadingDiary"
        @click="reloadLatest"
      >
        최신 내용 다시 불러오기
      </AppButton>

      <AppButton
        v-else
        class="mt-[var(--space-5)]"
        type="submit"
        variant="primary"
        block
        size="lg"
        :disabled="!canSubmit || isLoadingDiary"
        :loading="diaryStore.isSubmitting"
      >
        {{ isEditMode ? '일기 수정하기' : '일기 남기기' }}
      </AppButton>
    </form>
  </div>
</template>
