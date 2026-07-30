<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconClose from '@/components/common/icons/IconClose.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import { useSupportProgramsStore } from '@/stores/supportPrograms'

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

function loadPrograms() {
  supportProgramsStore.fetchPrograms()
}

function goToDetail(programId) {
  router.push({ name: 'SupportProgramDetail', params: { programId } })
}

function goToList() {
  router.push({ name: 'SupportPrograms' })
}

function applyForProgram() {
  if (selectedProgram.value?.eligible) {
    supportProgramsStore.applyForProgram(selectedProgram.value.id)
  }
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
  <main
    class="mx-auto min-h-dvh w-full max-w-[var(--mobile-content-width)] box-border bg-(--color-white) px-[22px] pb-[calc(var(--bottom-nav-height)+var(--space-6)+env(safe-area-inset-bottom))] pt-[calc(var(--header-height)+var(--space-1))] text-(--color-navy)"
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
        variant="navy"
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
      <EmptyState
        :icon="IconPaw"
        message="현재 조건에 맞는 지원사업이 없어요."
        action-text="목록 새로고침"
        action-route="/support-programs"
      />
    </section>

    <template v-else-if="!isDetail">
      <header>
        <h1 class="m-0 text-[length:var(--font-xl)] font-bold leading-[1.3]">
          보리 맞춤 지원사업
        </h1>
        <p
          class="mb-0 mt-[var(--space-1)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
        >
          보리의 조건에 맞는 지원사업을 모아봤어요
        </p>
      </header>

      <ul class="m-0 mt-[var(--space-7)] list-none space-y-[var(--space-3)] p-0">
        <li
          v-for="program in supportProgramsStore.programs"
          :key="program.id"
          class="min-h-(--support-card-min-height) rounded-[18px] border border-(--color-border) p-[var(--space-4)]"
          :class="program.eligible ? 'bg-(--color-white)' : 'bg-(--color-surface)'"
        >
          <span
            class="inline-flex h-[20px] items-center rounded-full px-[var(--space-2)] text-[10.5px] font-bold"
            :class="
              program.eligible
                ? 'bg-(--color-olive-surface) text-(--color-olive-dark)'
                : 'bg-(--color-danger-surface) text-(--color-danger-dark)'
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
          <p class="mb-0 mt-[var(--space-1)] text-[11.5px] text-(--color-slate-muted)">
            {{ program.summary }}
          </p>
          <AppButton
            class="float-right -mt-[2px]"
            :variant="program.eligible ? 'navy' : 'secondary'"
            size="xs"
            @click="goToDetail(program.id)"
          >
            {{ program.eligible ? '신청하기' : '조건 보기' }}
          </AppButton>
        </li>
      </ul>
    </template>

    <template v-else-if="selectedProgram">
      <button
        class="-ml-[var(--space-1)] -mt-[var(--space-2)] grid size-[var(--control-height-sm)] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        type="button"
        aria-label="목록으로 돌아가기"
        @click="goToList"
      >
        <IconArrowLeft :size="16" />
      </button>

      <span
        class="mt-[var(--space-5)] inline-flex h-[20px] items-center rounded-full px-[var(--space-2)] text-[10.5px] font-bold"
        :class="
          selectedProgram.eligible
            ? 'bg-(--color-olive-surface) text-(--color-olive-dark)'
            : 'bg-(--color-danger-surface) text-(--color-danger-dark)'
        "
      >
        {{ selectedProgram.eligible ? '신청 가능' : '조건 미충족' }}
      </span>
      <h1 class="mb-0 mt-[var(--space-2)] text-[length:var(--font-xl)] font-bold">
        {{ selectedProgram.title }}
      </h1>
      <p class="mb-0 mt-[var(--space-1)] text-[length:var(--font-sm)] text-(--color-slate-muted)">
        {{ selectedProgram.agency }} · {{ selectedProgram.benefit }}
      </p>

      <section class="mt-[var(--space-7)] rounded-[14px] bg-(--color-surface) p-[var(--space-4)]">
        <h2 class="m-0 text-[11px] font-bold text-(--color-slate-dark)">
          신청 기간
        </h2>
        <p class="mb-0 mt-[var(--space-2)] text-[12.5px] font-bold">
          {{ selectedProgram.period }}
        </p>
      </section>

      <section class="mt-[var(--space-4)]">
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
                  ? 'bg-(--color-olive-surface) text-(--color-olive-dark)'
                  : 'bg-(--color-danger-surface) text-(--color-danger-dark)'
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
              <strong class="block text-[13px]">{{ condition.title }}</strong>
              <span class="mt-[var(--space-1)] block text-[11px] text-(--color-slate-muted)">
                {{ condition.description }}
              </span>
            </span>
          </li>
        </ul>
      </section>

      <section
        v-if="!selectedProgram.eligible"
        class="mt-[var(--space-7)] rounded-[14px] bg-(--color-surface) p-[var(--space-4)]"
      >
        <div class="flex items-start gap-[var(--space-2)] text-[11.5px] leading-[1.4] text-(--color-slate-dark)">
          <IconInfo
            class="mt-[2px] shrink-0 text-(--color-gold-dark)"
            :size="16"
          />
          <div>
            <strong class="block">현재 조건으로는 지원사업을 신청할 수 없어요.</strong>
            <span class="mt-[var(--space-1)] block text-[11px] text-(--color-slate-muted)">
              비슷한 조건의 다른 지원사업을 확인해 보세요.
            </span>
          </div>
        </div>
      </section>

      <p
        v-if="isApplied"
        class="mb-0 mt-[var(--space-4)] rounded-[var(--radius-lg)] bg-(--color-olive-surface) p-[var(--space-3)] text-center text-[length:var(--font-sm)] font-bold text-(--color-olive-dark)"
        role="status"
      >
        신청 준비가 완료됐어요. 안내에 따라 서류를 제출해 주세요.
      </p>

      <div class="mt-[var(--space-4)] space-y-[var(--space-3)]">
        <AppButton
          v-if="selectedProgram.eligible"
          block
          variant="navy"
          :disabled="isApplied"
          @click="applyForProgram"
        >
          {{ isApplied ? '신청 준비 완료' : '신청하기' }}
        </AppButton>
        <AppButton
          v-else
          block
          variant="navy"
          @click="goToList"
        >
          비슷한 지원사업 더 보기
        </AppButton>
        <AppButton
          block
          variant="secondary"
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
  </main>
  <BottomNavBar v-if="!isDetail" />
</template>
