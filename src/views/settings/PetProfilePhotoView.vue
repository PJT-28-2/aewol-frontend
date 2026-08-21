<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AewolLogo from '@/components/common/AewolLogo.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import { usePetStore } from '@/stores/pet'
import { withEulReul } from '@/utils/korean'
import { petApi } from '@/api/pet'

const router = useRouter()
const route = useRoute()
const petStore = usePetStore()
const isEditMode = computed(() => route.query.mode === 'edit')
const nextPath = computed(() => route.query.next || (isEditMode.value ? '/settings' : '/home'))
const requestedPetId = computed(() => route.query.petId ? String(route.query.petId) : null)
const targetPet = computed(() => {
  if (requestedPetId.value) {
    return petStore.pets.find(({ id }) => String(id) === requestedPetId.value)
  }
  return petStore.pets.find(({ id }) => id === petStore.representativePetId) ?? petStore.pets[0]
})
const petName = computed(() => targetPet.value?.name ?? '반려동물')

const step = ref(1)
const photoFile = ref(null)
const photoPreviewUrl = ref('')
const resultUrl = ref('')
const fitMode = ref('cover')
const autoBrightness = ref(true)
const progress = ref(0)
const fileInput = ref(null)
const errorMessage = ref('')
const remainingToday = ref(null)
const isShowingExistingCharacter = ref(false)
let progressTimer

const stepTitle = computed(() => ({
  1: '갤러리 사진 업로드',
  2: '사진 확인',
  4: '캐릭터 완성',
}[step.value] ?? ''))

function openGallery() {
  if (!targetPet.value) {
    errorMessage.value = '대상 반려동물 정보를 찾지 못했어요. 반려동물 목록에서 다시 시도해 주세요.'
    return
  }
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
  errorMessage.value = ''
  step.value = 2
}

function handleBack() {
  if (step.value === 1) {
    router.back()
    return
  }
  if (step.value === 4 && isShowingExistingCharacter.value) {
    router.back()
    return
  }
  step.value = step.value === 4 ? 2 : step.value - 1
}

/**
 * 서버 응답까지 20초 이상 걸린다(외부 LLM 2단계 호출). 진행률을 실제 진척도로
 * 알 방법이 없으므로, 대기 시간에 맞춰 92%까지 서서히 올려두고 응답이 오면
 * 100%로 닫는다. 끝까지 차오른 채로 멈춰 있으면 멈춘 것처럼 보이기 때문이다.
 */
function startProgress() {
  progress.value = 5
  progressTimer = window.setInterval(() => {
    progress.value = Math.min(progress.value + 1, 92)
  }, 300)
}

function stopProgress() {
  window.clearInterval(progressTimer)
  progressTimer = undefined
}

async function handleConvert() {
  const petId = targetPet.value?.id
  if (!petId) {
    errorMessage.value = '반려동물 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
    return
  }
  if (!photoFile.value) return

  errorMessage.value = ''
  step.value = 3
  startProgress()

  try {
    const { data } = await petApi.generateCharacter(petId, photoFile.value)
    const result = data.result ?? data
    // 정면 얼굴 생성만 실패하면 전신 이미지라도 내려온다.
    resultUrl.value = result.profileImg || result.characterImg || ''
    remainingToday.value = result.remainingToday ?? null

    const targetIndex = petStore.pets.findIndex(({ id }) => id === String(petId))
    if (targetIndex !== -1) {
      petStore.pets[targetIndex] = {
        ...petStore.pets[targetIndex],
        profileImg: result.profileImg ?? petStore.pets[targetIndex].profileImg,
        characterImg: result.characterImg ?? petStore.pets[targetIndex].characterImg,
      }
    }

    if (!resultUrl.value) {
      throw new Error('생성된 이미지가 없습니다.')
    }

    progress.value = 100
    isShowingExistingCharacter.value = false
    step.value = 4
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '캐릭터를 만들지 못했어요. 다른 사진으로 다시 시도해 주세요.'
    // 사진 확인 단계로 돌려보내 같은 사진으로 재시도하거나 다른 사진을 고르게 한다.
    step.value = 2
  } finally {
    stopProgress()
  }
}

function handleReset() {
  stopProgress()
  photoFile.value = null
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value)
  photoPreviewUrl.value = ''
  resultUrl.value = ''
  isShowingExistingCharacter.value = false
  errorMessage.value = ''
  progress.value = 0
  step.value = 1
}

/**
 * 생성 시점에 서버가 이미 pet.profile_img / character_img 를 갱신한다. 따로 저장할
 * 것이 없으므로 펫 목록만 다시 받아 홈·마이페이지가 새 이미지를 쓰게 한다.
 *
 * <p>응답의 서명 URL을 그대로 들고 있지 않는 이유는 만료되기 때문이다. 조회 때마다
 * 서버가 새 서명을 붙여주므로 저장하지 말고 매번 받은 값을 써야 한다.
 */
async function handleApply() {
  await petStore.fetchPets().catch(() => {})
  router.replace(nextPath.value)
}

/**
 * 사진 없이 넘어가면 생성 API를 부르지 않고 아무것도 저장하지 않는다. 홈·목록·
 * 마이페이지는 characterImg와 profileImg가 모두 비어 있을 때 종별 기본 캐릭터로
 * 폴백하므로(PetListView의 catHero/dogHero) 빈 상태 그대로 두는 것이 곧 기본
 * 캐릭터를 쓰는 것이다.
 */
function handleSkip() {
  router.replace(nextPath.value)
}

onMounted(async () => {
  // 등록 직후에는 스토어에 기존 반려동물만 남아 있을 수 있다. URL로 대상 petId를
  // 받았다면 목록 유무와 관계없이 다시 조회해야 새 반려동물을 정확히 찾을 수 있다.
  if (route.query.petId || isEditMode.value || !petStore.pets.length) {
    await petStore.fetchPets().catch(() => {})
  }

  if (requestedPetId.value && !targetPet.value) {
    errorMessage.value = '대상 반려동물 정보를 찾지 못했어요. 반려동물 목록에서 다시 시도해 주세요.'
    return
  }

  const existingCharacter = targetPet.value?.profileImg || targetPet.value?.characterImg
  if (isEditMode.value && existingCharacter) {
    resultUrl.value = existingCharacter
    isShowingExistingCharacter.value = true
    step.value = 4
  }
})

onBeforeUnmount(() => {
  stopProgress()
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

        <p
          v-if="errorMessage"
          class="mt-(--space-4) text-center text-(length:--font-sm) font-semibold text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ errorMessage }}
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
          <span class="inline-flex items-center gap-(--space-1) rounded-full bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-xs) text-(color:--color-leaf-dark)"><IconCheck :size="12" /> 몸통까지</span>
          <span class="inline-flex items-center gap-(--space-1) rounded-full bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-xs) text-(color:--color-leaf-dark)"><IconCheck :size="12" /> 밝은 사진</span>
          <span class="inline-flex items-center gap-(--space-1) rounded-full bg-(--color-leaf-soft) px-(--space-3) py-(--space-2) text-(length:--font-xs) text-(color:--color-leaf-dark)"><IconCheck :size="12" /> 한 마리</span>
        </div>

        <AppButton
          class="mt-auto"
          variant="navy"
          size="lg"
          block
          :disabled="!targetPet"
          @click="openGallery"
        >
          사진 한 장 업로드
        </AppButton>

        <AppButton
          class="mt-(--space-2)"
          variant="ghost"
          size="lg"
          block
          @click="handleSkip"
        >
          다음에 등록하기
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

        <p
          v-if="errorMessage"
          class="mt-(--space-4) text-center text-(length:--font-sm) font-semibold text-(color:--color-danger-strong)"
          role="alert"
        >
          {{ errorMessage }}
        </p>

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
          <template v-if="isShowingExistingCharacter">
            현재 적용된 {{ petName }}의<br>캐릭터예요
          </template>
          <template v-else>
            {{ withEulReul(petName) }} 닮은 모습이<br>완성됐어요!
          </template>
        </h2>
        <p class="mt-(--space-2) text-(length:--font-sm) text-(color:--color-slate-muted)">
          {{ isShowingExistingCharacter ? '새 사진으로 다시 만들 수도 있어요.' : '완성된 캐릭터는 홈 화면에 적용할 수 있어요.' }}
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
          {{ isShowingExistingCharacter ? '다른 사진으로 만들기' : '다시 만들기' }}
        </button>
        <p
          v-if="remainingToday !== null"
          class="mt-(--space-2) text-(length:--font-xs) text-(color:--color-slate-muted)"
        >
          오늘 {{ remainingToday }}번 더 만들 수 있어요.
        </p>

        <AppButton
          class="mt-auto"
          size="lg"
          block
          @click="handleApply"
        >
          {{ isShowingExistingCharacter ? '확인' : isEditMode ? '수정 이미지 적용' : '홈에 적용하기' }}
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

      <!--
        사진(가운데)은 고정하고 그 주위만 움직인다. 분석 대상이 흔들리면 결과가
        불안정해 보이고, 대기 시간 내내 시선이 사진에서 떨어지지 않는다.
      -->
      <div class="relative mx-auto mt-[70px] flex size-[250px] items-center justify-center">
        <span class="absolute inset-0 animate-ripple rounded-full border border-(--color-leaf)" />
        <span class="absolute inset-0 animate-pulse rounded-full border border-(--color-leaf) opacity-40" />
        <span class="absolute inset-[14px] animate-ring-spin rounded-full border-2 border-dashed border-(--color-leaf-dark) opacity-60" />
        <span class="absolute inset-[28px] overflow-hidden rounded-full bg-(--color-white) shadow-(--shadow-card)">
          <img
            :src="photoPreviewUrl"
            :alt="`${petName} 특징 분석 중`"
            class="size-full object-cover brightness-110"
          >
        </span>
        <span class="absolute right-[13px] bottom-[25px] flex size-[54px] animate-float items-center justify-center rounded-full border-[5px] border-(--color-leaf-soft) bg-(--color-leaf) text-(color:--color-navy) shadow-(--shadow-md)">
          <IconPaw
            size="25"
            filled
          />
        </span>
        <!-- 점 두 개는 각자 떠다니는 대신 원 둘레를 함께 돈다. 점선 링과 반대로
             돌려서 두 궤도가 겹쳐 보이지 않게 했다. -->
        <span class="pointer-events-none absolute inset-0 animate-ring-orbit">
          <span class="absolute top-[22px] left-[9px] size-[10px] rounded-full bg-(--color-chart-amber)" />
          <span class="absolute top-[70px] right-[2px] size-[7px] rounded-full bg-(--color-chart-teal)" />
        </span>
      </div>

      <div class="mt-(--space-10) text-center">
        <h1 class="text-[24px] leading-[1.4] font-bold text-(color:--color-navy)">
          {{ withEulReul(petName) }} 닮은 캐릭터를<br>만들고 있어요
        </h1>
        <p class="mt-(--space-2) text-(length:--font-sm) leading-[1.55] text-(color:--color-slate-muted)">
          사진 속 털색과 얼굴 특징을 살펴보고 있어요.<br>30초 정도 걸려요. 화면을 닫지 말아주세요.
        </p>
      </div>

      <div class="mt-auto pb-(--space-10)">
        <div class="relative h-[8px] overflow-hidden rounded-full bg-(--color-white)">
          <span
            class="block h-full rounded-full bg-(--color-leaf) transition-[width] duration-150"
            :style="{ width: `${progress}%` }"
          />
          <!-- 진행률이 한동안 같은 값에 머물러도 막대가 살아 있음을 보여준다. -->
          <span class="pointer-events-none absolute inset-y-0 left-0 w-[28%] animate-sheen rounded-full bg-(--color-white) opacity-45" />
        </div>
        <p class="mt-(--space-3) text-center text-(length:--font-sm) font-bold text-(color:--color-leaf-dark)">
          {{ progress }}%
        </p>
      </div>
    </section>
  </div>
</template>
