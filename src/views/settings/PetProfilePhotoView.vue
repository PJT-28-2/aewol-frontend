<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AewolLogo from '@/components/common/AewolLogo.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import { useMemberStore } from '@/stores/member'
import { usePetStore } from '@/stores/pet'
import profileMascot from '@/assets/images/pet-poodle-profile-mascot.png'

const router = useRouter()
const route = useRoute()
const memberStore = useMemberStore()
const petStore = usePetStore()
const isEditMode = computed(() => route.query.mode === 'edit')
const nextPath = computed(() => route.query.next || (isEditMode.value ? '/settings' : '/home'))
const representativePet = computed(() =>
  petStore.pets.find(({ id }) => id === petStore.representativePetId) ?? petStore.pets[0],
)
const petName = computed(() => representativePet.value?.name ?? '포리')

const step = ref(1)
const photoFile = ref(null)
const photoPreviewUrl = ref('')
const resultUrl = ref('')
const fitMode = ref('cover')
const autoBrightness = ref(true)
const progress = ref(0)
const fileInput = ref(null)
let progressTimer
let completionTimer

const stepTitle = computed(() => ({
  1: '갤러리 사진 업로드',
  2: '사진 확인',
  4: '캐릭터 완성',
}[step.value] ?? ''))

function openGallery() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]
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

  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
  photoFile.value = file
  photoPreviewUrl.value = URL.createObjectURL(file)
  resultUrl.value = ''
  step.value = 2
}

function handleBack() {
  if (step.value === 1) {
    router.back()
    return
  }
  step.value = step.value === 4 ? 2 : step.value - 1
}

function handleConvert() {
  step.value = 3
  progress.value = 12
  progressTimer = window.setInterval(() => {
    progress.value = Math.min(progress.value + 6, 92)
  }, 110)
  completionTimer = window.setTimeout(() => {
    window.clearInterval(progressTimer)
    progress.value = 100
    resultUrl.value = profileMascot
    step.value = 4
  }, 1650)
}

function handleReset() {
  window.clearInterval(progressTimer)
  window.clearTimeout(completionTimer)
  photoFile.value = null
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
  photoPreviewUrl.value = ''
  resultUrl.value = ''
  progress.value = 0
  step.value = 1
}

function handleApply() {
  memberStore.setPetProfilePhoto(resultUrl.value)
  router.replace(nextPath.value)
}

onMounted(async () => {
  if (!petStore.pets.length) await petStore.fetchPets().catch(() => {})
})

onBeforeUnmount(() => {
  window.clearInterval(progressTimer)
  window.clearTimeout(completionTimer)
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
})
</script>

<template>
  <div
    class="mx-auto flex min-h-svh w-full max-w-[390px] flex-col bg-(--color-app-bg) px-(--space-5) pt-(--space-4) pb-[calc(var(--space-5)+env(safe-area-inset-bottom))]"
    :class="step === 3 ? 'bg-(--color-leaf-soft)' : 'bg-(--color-app-bg)'"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    >

    <template v-if="step !== 3">
      <header class="relative flex h-[44px] items-center justify-between">
        <button
          type="button"
          class="flex size-[40px] items-center justify-center text-(color:--color-navy)"
          aria-label="이전 단계"
          @click="handleBack"
        >
          <IconArrowLeft size="22" />
        </button>
        <h1 class="absolute left-1/2 -translate-x-1/2 text-(length:--font-sm) font-bold whitespace-nowrap text-(color:--color-navy)">
          {{ stepTitle }}
        </h1>
        <span class="rounded-full bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)">
          {{ step }} / 4
        </span>
      </header>

      <section
        v-if="step === 1"
        class="flex flex-1 flex-col pt-(--space-6)"
      >
        <h2 class="text-[25px] leading-[1.35] font-bold text-(color:--color-navy)">
          갤러리에서 사진 한 장을<br>업로드해주세요
        </h2>
        <p class="mt-(--space-2) text-(length:--font-sm) leading-[1.6] text-(color:--color-slate-muted)">
          저장된 사진 중 얼굴과 몸통이 함께 나온 사진을 골라<br>{{ petName }}만의 홈 캐릭터를 만들어요.
        </p>

        <button
          type="button"
          class="mt-(--space-7) flex h-[296px] w-full flex-col items-center justify-center rounded-[26px] bg-(--color-white) px-(--space-4)"
          @click="openGallery"
        >
          <span class="flex h-[210px] w-full flex-col items-center justify-center rounded-[20px] bg-(--color-info-surface) text-(color:--color-leaf-dark)">
            <span class="flex size-[72px] items-center justify-center rounded-full bg-(--color-white)">
              <IconImage size="28" />
            </span>
          </span>
          <strong class="mt-(--space-4) text-(length:--font-sm) text-(color:--color-navy)">갤러리 열기</strong>
          <span class="mt-(--space-1) text-(length:--font-xs) text-(color:--color-slate-muted)">JPG·PNG 사진 한 장만 선택할 수 있어요</span>
        </button>

        <div class="mt-(--space-5) flex flex-wrap gap-(--space-2)">
          <span class="rounded-full bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-xs) text-(color:--color-leaf-dark)">✓ 몸통까지</span>
          <span class="rounded-full bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-xs) text-(color:--color-leaf-dark)">✓ 밝은 사진</span>
          <span class="rounded-full bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-xs) text-(color:--color-leaf-dark)">✓ 한 마리</span>
        </div>

        <AppButton
          class="mt-auto"
          variant="navy"
          size="lg"
          block
          @click="openGallery"
        >
          사진 한 장 업로드
        </AppButton>
      </section>

      <section
        v-else-if="step === 2"
        class="flex flex-1 flex-col pt-(--space-6)"
      >
        <h2 class="text-[25px] leading-[1.35] font-bold text-(color:--color-navy)">
          {{ petName }}의 특징이<br>잘 보이도록 맞춰주세요
        </h2>
        <p class="mt-(--space-2) text-(length:--font-sm) text-(color:--color-slate-muted)">
          선 안에 얼굴과 몸통이 모두 들어오게 조절해요.
        </p>

        <div class="relative mt-(--space-6) flex h-[310px] items-center justify-center">
          <div class="size-[270px] overflow-hidden rounded-full border-[3px] border-(--color-leaf) bg-(--color-white)">
            <img
              :src="photoPreviewUrl"
              :alt="`${petName} 업로드 사진`"
              class="size-full"
              :class="[
                fitMode === 'contain' ? 'object-contain' : 'object-cover',
                autoBrightness ? 'brightness-110' : '',
              ]"
            >
          </div>
          <span class="pointer-events-none absolute size-[286px] rounded-full border-2 border-dashed border-(--color-leaf-dark)" />
        </div>

        <div class="mt-(--space-4) flex justify-center gap-(--space-2)">
          <button
            type="button"
            class="rounded-full px-(--space-4) py-(--space-2) text-(length:--font-xs) font-semibold"
            :class="fitMode === 'contain' ? 'bg-(--color-navy) text-(color:--color-white)' : 'bg-(--color-white) text-(color:--color-navy)'"
            @click="fitMode = fitMode === 'contain' ? 'cover' : 'contain'"
          >
            전체 몸
          </button>
          <button
            type="button"
            class="rounded-full px-(--space-4) py-(--space-2) text-(length:--font-xs) font-semibold"
            :class="autoBrightness ? 'bg-(--color-leaf-soft) text-(color:--color-leaf-dark)' : 'bg-(--color-white) text-(color:--color-slate-dark)'"
            @click="autoBrightness = !autoBrightness"
          >
            밝기 자동 보정
          </button>
        </div>

        <AppButton
          class="mt-auto"
          size="lg"
          block
          @click="handleConvert"
        >
          이 사진으로 만들기
        </AppButton>
      </section>

      <section
        v-else
        class="flex flex-1 flex-col pt-(--space-6) text-center"
      >
        <h2 class="text-[25px] leading-[1.35] font-bold text-(color:--color-navy)">
          {{ petName }}를 닮은 모습이<br>완성됐어요!
        </h2>
        <p class="mt-(--space-2) text-(length:--font-sm) text-(color:--color-slate-muted)">
          완성된 캐릭터는 홈 화면에 적용할 수 있어요.
        </p>

        <div class="mt-(--space-7) flex h-[305px] items-center justify-center">
          <span class="size-[270px] overflow-hidden rounded-full bg-(--color-leaf-soft)">
            <img
              :src="resultUrl"
              :alt="`${petName} AI 캐릭터`"
              class="size-full scale-[1.08] object-cover"
            >
          </span>
        </div>
        <span class="mx-auto mt-(--space-4) rounded-full bg-(--color-white) px-(--space-4) py-(--space-2) text-(length:--font-xs) font-semibold text-(color:--color-leaf-dark)">
          {{ petName }} 전용 캐릭터
        </span>
        <button
          type="button"
          class="mx-auto mt-(--space-5) text-(length:--font-sm) text-(color:--color-slate-muted)"
          @click="handleReset"
        >
          다시 만들기
        </button>

        <AppButton
          class="mt-auto"
          size="lg"
          block
          @click="handleApply"
        >
          {{ isEditMode ? '수정 이미지 적용' : '홈에 적용하기' }}
        </AppButton>
      </section>
    </template>

    <section
      v-else
      class="flex flex-1 flex-col"
      aria-live="polite"
    >
      <div class="flex h-[44px] items-center">
        <AewolLogo size="18" />
        <span class="ml-(--space-2) text-(length:--font-xs) font-bold text-(color:--color-leaf-dark)">AI</span>
      </div>

      <div class="relative mx-auto mt-[70px] flex size-[250px] items-center justify-center">
        <span class="absolute inset-0 animate-pulse rounded-full border border-(--color-leaf) opacity-40" />
        <span class="absolute inset-[14px] rounded-full border-2 border-dashed border-(--color-leaf-dark) opacity-60" />
        <span class="absolute inset-[28px] overflow-hidden rounded-full bg-(--color-white) shadow-(--shadow-card)">
          <img
            :src="photoPreviewUrl"
            :alt="`${petName} 특징 분석 중`"
            class="size-full object-cover brightness-110"
          >
        </span>
        <span class="absolute right-[13px] bottom-[25px] flex size-[54px] items-center justify-center rounded-full border-[5px] border-(--color-leaf-soft) bg-(--color-leaf) text-(color:--color-navy) shadow-(--shadow-md)">
          <IconPaw
            size="25"
            filled
          />
        </span>
        <span class="absolute top-[22px] left-[9px] size-[10px] rounded-full bg-(--color-chart-amber)" />
        <span class="absolute top-[70px] right-[2px] size-[7px] rounded-full bg-(--color-chart-teal)" />
      </div>

      <div class="mt-(--space-10) text-center">
        <h1 class="text-[24px] leading-[1.4] font-bold text-(color:--color-navy)">
          {{ petName }}를 닮은 캐릭터를<br>만들고 있어요
        </h1>
        <p class="mt-(--space-2) text-(length:--font-sm) leading-[1.55] text-(color:--color-slate-muted)">
          사진 속 털색과 얼굴 특징을 살펴보고 있어요.<br>잠시만 기다려주세요.
        </p>
      </div>

      <div class="mt-auto pb-(--space-10)">
        <div class="h-[8px] overflow-hidden rounded-full bg-(--color-white)">
          <span
            class="block h-full rounded-full bg-(--color-leaf) transition-[width] duration-150"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <p class="mt-(--space-3) text-center text-(length:--font-sm) font-bold text-(color:--color-leaf-dark)">
          {{ progress }}%
        </p>
      </div>
    </section>
  </div>
</template>
