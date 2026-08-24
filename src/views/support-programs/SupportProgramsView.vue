<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconClose from '@/components/common/icons/IconClose.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import { useSupportProgramsStore } from '@/stores/supportPrograms'
import { isSafeGovernmentApplyUrl } from '@/utils/governmentApplyUrl'

const route = useRoute()
const router = useRouter()
const supportProgramsStore = useSupportProgramsStore()

const isDetail = computed(() => Boolean(route.params.programId))
const selectedProgram = computed(() =>
  supportProgramsStore.programs.find(
    (program) => program.id === route.params.programId,
  ),
)
const hasPrograms = computed(() => supportProgramsStore.programs.length > 0)
const isApplied = computed(() =>
  selectedProgram.value
    ? supportProgramsStore.appliedProgramIds.includes(selectedProgram.value.id)
    : false,
)

// 서버 applyUrl이 오염돼 있어도 화면 안내와 실제 열기는 같은 검증 결과를 쓴다.
const safeApplyUrl = computed(() => {
  const url = selectedProgram.value?.applyUrl
  return isSafeGovernmentApplyUrl(url) ? url : null
})

// 한 번 눌렀다고 버튼을 잠그면, 팝업이 막혔거나 탭을 닫은 사람은 신청 페이지로
// 돌아갈 길이 없어진다. 신청 기록이 남았어도 안전한 링크가 있으면 계속 열 수 있게 둔다.
// 링크가 없거나 차단된 주소는 '관심 저장'이 전부라 그때만 잠근다.
const applyButtonLabel = computed(() => {
  if (!isApplied.value) return '신청하기'
  return safeApplyUrl.value ? '신청 페이지 다시 열기' : '관심 정책으로 저장됨'
})

const applyStatusMessage = computed(() => {
  if (!isApplied.value) return ''
  return safeApplyUrl.value
    ? '신청 페이지를 열었어요. 창이 닫혔다면 아래에서 다시 열 수 있어요.'
    : '관심 정책으로 저장했어요. 주관 기관에 신청 방법을 문의해 주세요.'
})

const isApplyLocked = computed(
  () => (isApplied.value && !safeApplyUrl.value) || supportProgramsStore.isApplying,
)

function loadPrograms() {
  supportProgramsStore.fetchPrograms()
}

function goToDetail(programId) {
  router.push({ name: 'SupportProgramDetail', params: { programId } })
}

function goToList() {
  router.push({ name: 'SupportPrograms' })
}

async function applyForProgram() {
  const program = selectedProgram.value
  if (!program?.eligible) return

  const applyUrl = safeApplyUrl.value
  // window.open은 클릭 핸들러 안에서 동기적으로 불러야 팝업 차단을 통과한다.
  // await 뒤로 미루면 사용자 제스처와의 연결이 끊긴다.
  const applyWindow = applyUrl ? window.open('about:blank', '_blank') : null
  if (applyWindow) applyWindow.opener = null

  // 이미 기록된 건이면 store가 요청 없이 false를 돌려준다. 그래도 신청 페이지는 연다.
  // 팝업이 막히거나 실수로 탭을 닫았을 때 다시 들어갈 길이 있어야 한다.
  await supportProgramsStore.applyForProgram(program.id)

  if (!applyUrl) return
  if (applyWindow) {
    applyWindow.location.replace(applyUrl)
  } else {
    window.location.assign(applyUrl)
  }
}

/**
 * 정부24 원본은 값이 여러 개일 때 `서비스(의료)||현금`처럼 이어 보낸다.
 * 그대로 두면 구분자가 화면에 그대로 노출된다.
 */
function formatList(value) {
  if (!value) return ''
  return value
    .split('||')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(' · ')
}

onMounted(loadPrograms)

watch(
  () => route.params.programId,
  () => {
    if (!hasPrograms.value) loadPrograms()
  },
)
</script>

<template>
  <div
    class="mx-auto box-border w-full max-w-(--content-max-width) bg-(--color-app-bg) px-(--space-4) text-(--color-navy)"
    :class="
      isDetail
        ? 'min-h-dvh pt-[var(--space-4)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))]'
        : 'min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] pt-[var(--space-4)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))]'
    "
  >
    <section
      v-if="supportProgramsStore.isLoading"
      class="grid min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] place-items-center"
      aria-live="polite"
    >
      <LoadingSpinner />
    </section>

    <section
      v-else-if="supportProgramsStore.error"
      class="flex min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] flex-col items-center justify-center text-center"
      role="alert"
    >
      <p class="m-0 text-[length:var(--font-md)] text-(--color-slate-dark)">
        {{ supportProgramsStore.error }}
      </p>
      <AppButton
        class="mt-[var(--space-4)]"
        variant="primary"
        size="sm"
        @click="loadPrograms"
      >
        다시 시도
      </AppButton>
    </section>

    <section
      v-else-if="!hasPrograms"
      class="grid min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] place-items-center"
    >
      <!--
        목록이 빈 이유는 둘 중 하나다. 반려동물이 없어 매칭 기준 자체가 없거나,
        지원사업 데이터가 아직 안 들어왔거나. 원인에 따라 다음 행동이 다르므로
        안내도 갈라 준다. (예전에는 지금 보고 있는 페이지로 이동하는 버튼이라
        눌러도 아무 일이 없었다.)
      -->
      <EmptyState
        v-if="!supportProgramsStore.petId"
        :icon="IconPaw"
        message="반려동물을 등록하면
맞춤 지원사업을 찾아드려요."
        action-text="반려동물 등록하기"
        action-route="/pets/register"
      />
      <EmptyState
        v-else
        :icon="IconPaw"
        message="현재 조건에 맞는 지원사업이 없어요."
        action-text="다시 불러오기"
        @action="loadPrograms"
      />
    </section>

    <template v-else-if="!isDetail">
      <header>
        <h1 class="m-0 text-[length:var(--font-2xl)] font-bold leading-[1.3]">
          {{ supportProgramsStore.petName || '반려동물' }} 맞춤 지원사업
        </h1>
      </header>

      <ul class="m-0 mt-[var(--space-5)] list-none space-y-[var(--space-3)] p-0">
        <li
          v-for="program in supportProgramsStore.programs"
          :key="program.id"
          class="flex items-center gap-[var(--space-3)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)] shadow-(--shadow-card)"
        >
          <div class="min-w-0 flex-1">
            <span
              class="inline-flex h-[20px] items-center rounded-full px-[var(--space-2)] text-(length:--font-xs) font-bold"
              :class="
                program.eligible
                  ? 'bg-(--color-leaf-soft) text-(--color-leaf-dark)'
                  : 'bg-(--color-danger-surface) text-(--color-danger-strong)'
              "
            >
              {{ program.eligible ? '신청 가능' : '조건 미충족' }}
            </span>
            <h2
              class="mb-0 mt-[var(--space-2)] text-[length:var(--font-md)] font-bold"
              :class="!program.eligible && 'text-(--color-slate-dark)'"
            >
              {{ program.title }}
            </h2>
            <p class="mb-0 mt-[var(--space-1)] text-(length:--font-sm) text-(--color-slate-muted)">
              {{ program.summary }}
            </p>
          </div>
          <AppButton
            class="shrink-0"
            :class="!program.eligible ? 'border-(--color-border)!' : ''"
            :variant="program.eligible ? 'primary' : 'secondary'"
            size="sm"
            @click="goToDetail(program.id)"
          >
            {{ program.eligible ? '신청하기' : '조건 보기' }}
          </AppButton>
        </li>
      </ul>
    </template>

    <template v-else-if="selectedProgram">
      <span
        class="mt-[var(--space-5)] inline-flex h-[20px] items-center rounded-full px-[var(--space-2)] text-(length:--font-xs) font-bold"
        :class="
          selectedProgram.eligible
            ? 'bg-(--color-leaf-soft) text-(--color-leaf-dark)'
            : 'bg-(--color-danger-surface) text-(--color-danger-strong)'
        "
      >
        {{ selectedProgram.eligible ? '신청 가능' : '조건 미충족' }}
      </span>
      <h1 class="mb-0 mt-[var(--space-2)] text-[length:var(--font-2xl)] font-bold">
        {{ selectedProgram.title }}
      </h1>
      <p class="mb-0 mt-[var(--space-1)] text-[length:var(--font-md)] text-(--color-slate-muted)">
        {{ selectedProgram.agency }} · {{ formatList(selectedProgram.benefit) }}
      </p>

      <section class="mt-[var(--space-7)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)] shadow-(--shadow-card)">
        <h2 class="m-0 text-(length:--font-sm) font-bold text-(--color-slate-dark)">
          신청 기간
        </h2>
        <p class="mb-0 mt-[var(--space-2)] text-(length:--font-md) font-bold">
          {{ formatList(selectedProgram.period) }}
        </p>
      </section>

      <section class="mt-[var(--space-4)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)">
        <h2 class="mb-[var(--space-4)] mt-0 text-[length:var(--font-md)] font-bold">
          신청 조건
        </h2>
        <ul class="m-0 list-none space-y-[var(--space-4)] p-0">
          <li
            v-for="condition in selectedProgram.conditions"
            :key="condition.title"
            class="flex items-start gap-[var(--space-3)]"
          >
            <span
              class="grid size-(--support-status-icon-size) shrink-0 place-items-center rounded-full"
              :class="
                condition.met
                  ? 'bg-(--color-leaf-soft) text-(--color-leaf-dark)'
                  : 'bg-(--color-danger-surface) text-(--color-danger-strong)'
              "
            >
              <IconCheck
                v-if="condition.met"
                :size="15"
              />
              <IconClose
                v-else
                :size="15"
              />
            </span>
            <span>
              <strong class="block text-(length:--font-md)">{{ condition.title }}</strong>
              <span class="mt-[var(--space-1)] block text-(length:--font-sm) text-(--color-slate-muted)">
                {{ condition.description }}
              </span>
            </span>
          </li>
        </ul>
      </section>

      <section
        v-if="!selectedProgram.eligible"
        class="mt-[var(--space-4)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)] shadow-(--shadow-card)"
      >
        <div class="flex items-start gap-[var(--space-2)] text-(length:--font-sm) leading-[1.4] text-(--color-slate-dark)">
          <IconInfo
            class="mt-[2px] shrink-0 text-(--color-gold-dark)"
            :size="16"
          />
          <div>
            <strong class="block">현재 조건으로는 지원사업을 신청할 수 없어요.</strong>
            <span class="mt-[var(--space-1)] block text-(length:--font-sm) text-(--color-slate-muted)">
              비슷한 조건의 다른 지원사업을 확인해 보세요.
            </span>
          </div>
        </div>
      </section>

      <p
        v-if="isApplied"
        class="mb-0 mt-[var(--space-4)] rounded-(--radius-xl) bg-(--color-leaf-soft) p-[var(--space-3)] text-center text-[length:var(--font-sm)] font-bold text-(--color-leaf-dark)"
        role="status"
      >
        {{ applyStatusMessage }}
      </p>

      <div class="mt-[var(--space-4)] space-y-[var(--space-3)]">
        <AppButton
          v-if="selectedProgram.eligible"
          block
          size="lg"
          variant="primary"
          :disabled="isApplyLocked"
          :loading="supportProgramsStore.isApplying"
          @click="applyForProgram"
        >
          {{ applyButtonLabel }}
        </AppButton>
        <AppButton
          v-else
          block
          size="lg"
          variant="primary"
          @click="goToList"
        >
          비슷한 지원사업 더 보기
        </AppButton>
        <AppButton
          block
          size="lg"
          variant="secondary"
          class="border-(--color-border)!"
          @click="goToList"
        >
          목록으로 돌아가기
        </AppButton>
      </div>
    </template>

    <section
      v-else
      class="grid min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] place-items-center"
    >
      <EmptyState
        :icon="IconInfo"
        message="지원사업을 찾을 수 없어요."
        action-text="지원사업 목록 보기"
        action-route="/support-programs"
      />
    </section>
  </div>
</template>
