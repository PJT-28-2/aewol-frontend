<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue'
import IconClose from '@/components/common/icons/IconClose.vue'
import IconInfo from '@/components/common/icons/IconInfo.vue'

const route = useRoute()
const router = useRouter()
const detail = computed(() => Boolean(route.params.programId))
const programs = [
  {
    id: 'neuter',
    title: '서울시 반려동물 중성화 지원',
    description: '소득 조건 충족 · 최대 15만원',
    agency: '서울시 동물복지과',
    amount: '최대 15만원',
    period: '2026년 12월 31일까지',
    available: true,
    conditions: [
      {
        met: true,
        title: '반려동물 등록 완료',
        description: '국가동물보호정보시스템에 등록되어 있어요',
      },
      {
        met: true,
        title: '서울시 거주자',
        description: '프로필상 거주지 조건을 충족했어요',
      },
      {
        met: true,
        title: '소득 조건 충족',
        description: '지원 대상 소득 기준을 충족했어요',
      },
    ],
  },
  {
    id: 'vaccine',
    title: '강아지 예방접종비 지원사업',
    description: '만 2세 이하 반려견 대상',
    agency: '서울시 동물복지과',
    amount: '최대 10만원',
    period: '예산 소진 시까지',
    available: true,
    conditions: [
      {
        met: true,
        title: '반려동물 등록 완료',
        description: '국가동물보호정보시스템에 등록되어 있어요',
      },
      {
        met: true,
        title: '서울시 거주자',
        description: '프로필상 거주지 조건을 충족했어요',
      },
      {
        met: true,
        title: '만 2세 이하 반려견',
        description: '프로필상 연령 조건을 충족했어요',
      },
    ],
  },
  {
    id: 'adoption',
    title: '유기동물 입양비 지원',
    description: '입양 후 6개월 이내 신청',
    agency: '제주시 동물복지과',
    amount: '최대 20만원',
    period: '입양일로부터 6개월 이내',
    available: false,
    conditions: [
      {
        met: true,
        title: '반려동물 등록 완료',
        description: '국가동물보호정보시스템에 등록되어 있어요',
      },
      {
        met: true,
        title: '제주시 거주자',
        description: '프로필상 거주지 조건을 충족했어요',
      },
      {
        met: false,
        title: '입양 후 6개월 이내 신청',
        description: '입양일로부터 8개월이 지나 신청 기간이 지났어요',
      },
    ],
  },
]
const selected = computed(() =>
  programs.find((program) => program.id === route.params.programId),
)
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[var(--mobile-content-width)] box-border bg-(--color-white) px-[var(--space-5)] pb-[calc(var(--bottom-nav-height)+var(--space-8))] pt-[var(--space-10)] text-(--color-navy)"
  >
    <template v-if="!detail">
      <h1 class="m-0 text-[length:var(--font-xl)] font-bold">
        우리 동네 지원사업
      </h1>
      <p
        class="mb-[var(--space-8)] mt-[var(--space-1)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
      >
        프로필 조건에 맞는 지원사업을 모아봤어요
      </p>
      <article
        v-for="program in programs"
        :key="program.id"
        class="relative mb-[var(--space-4)] min-h-[var(--support-card-min-height)] box-border rounded-[var(--radius-xl)] border border-(--color-border) p-[var(--space-4)]"
        :class="{ 'bg-(--color-surface)': !program.available }"
      >
        <span
          class="inline-grid h-[var(--space-5)] place-items-center rounded-[var(--radius-lg)] bg-(--color-olive-surface) px-[var(--space-2)] text-[length:var(--font-xs)] font-bold text-(--color-olive-dark)"
          :class="{
            'bg-(--color-danger-surface) text-(--color-danger-dark)':
              !program.available,
          }"
        >
          {{ program.available ? '신청 가능' : '조건 미충족' }}
        </span>
        <h2
          class="mb-[var(--space-1)] mt-[var(--space-2)] text-[length:var(--font-md)] font-bold"
        >
          {{ program.title }}
        </h2>
        <p
          class="m-0 text-[length:var(--font-sm)] text-(--color-slate-muted)"
        >
          {{ program.description }}
        </p>
        <button
          type="button"
          class="absolute bottom-[var(--space-3)] right-[var(--space-4)] h-[var(--support-action-height)] w-[var(--support-action-width)] cursor-pointer rounded-[var(--radius-md)] border-0 bg-(--color-navy) text-[length:var(--font-xs)] font-bold text-(--color-white)"
          :class="{
            'border border-(--color-border) bg-(--color-white) text-(--color-slate-dark)':
              !program.available,
          }"
          @click="router.push(`/support/${program.id}`)"
        >
          {{ program.available ? '신청 안내' : '조건 보기' }}
        </button>
      </article>
    </template>

    <template v-else-if="selected">
      <button
        class="-ml-[var(--space-2)] -mt-[var(--space-3)] mb-[var(--space-6)] block cursor-pointer border-0 bg-transparent text-[length:var(--font-3xl)] text-(--color-navy)"
        type="button"
        @click="router.push('/support')"
      >
        <IconArrowLeft :size="28" />
      </button>
      <span
        class="mb-[var(--space-3)] inline-grid h-[var(--space-5)] place-items-center rounded-[var(--radius-lg)] bg-(--color-olive-surface) px-[var(--space-2)] text-[length:var(--font-xs)] font-bold text-(--color-olive-dark)"
        :class="{
          'bg-(--color-danger-surface) text-(--color-danger-dark)':
            !selected.available,
        }"
      >
        {{ selected.available ? '신청 가능' : '조건 미충족' }}
      </span>
      <h1 class="m-0 text-[length:var(--font-xl)] font-bold">
        {{ selected.title }}
      </h1>
      <p
        class="mb-[var(--space-8)] mt-[var(--space-1)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
      >
        {{ selected.agency }} · {{ selected.amount }}
      </p>

      <section
        class="mt-[var(--space-7)] rounded-[var(--radius-lg)] bg-(--color-surface) px-[var(--space-4)] py-[var(--space-3)]"
      >
        <b
          class="block text-[length:var(--font-xs)] text-(--color-slate-dark)"
        >신청 기간</b>
        <strong
          class="mt-[var(--space-2)] block text-[length:var(--font-sm)]"
        >{{ selected.period }}</strong>
      </section>

      <h2
        class="mb-[var(--space-3)] mt-[var(--space-7)] text-[length:var(--font-base)]"
      >
        신청 조건
      </h2>
      <div
        v-for="condition in selected.conditions"
        :key="condition.title"
        class="my-[var(--space-4)] flex items-start gap-[var(--space-3)]"
      >
        <b
          class="grid size-[var(--support-status-icon-size)] shrink-0 place-items-center rounded-full bg-(--color-olive-surface) text-(--color-olive-dark)"
          :class="{
            'bg-(--color-danger-surface) text-(--color-danger-dark)':
              !condition.met,
          }"
        >
          <IconCheck
            v-if="condition.met"
            size="var(--icon-size-xs)"
          />
          <IconClose
            v-else
            size="var(--icon-size-xs)"
          />
        </b>
        <span class="flex flex-col gap-[var(--space-1)]">
          <strong class="text-[length:var(--font-md)]">{{ condition.title }}</strong>
          <small
            class="text-[length:var(--font-xs)] text-(--color-slate-muted)"
          >{{ condition.description }}</small>
        </span>
      </div>

      <div
        v-if="!selected.available"
        class="mt-[var(--space-7)] rounded-[var(--radius-lg)] bg-(--color-surface) px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-xs)] leading-relaxed text-(--color-slate-dark)"
      >
        <div class="flex items-start gap-[var(--space-2)]">
          <IconInfo
            class="mt-[var(--support-info-icon-offset)] shrink-0 text-(--color-gold-dark)"
            size="var(--icon-size-sm)"
          />
          <span>
            현재 조건으로는 이 지원사업을 신청할 수 없어요<br>
            <small class="text-(--color-slate-muted)">
              비슷한 조건의 다른 지원사업을 확인해보세요
            </small>
          </span>
        </div>
      </div>

      <button
        v-if="selected.available"
        class="mt-[var(--space-4)] h-[var(--control-height-lg)] w-full cursor-not-allowed rounded-[var(--radius-xl)] border-0 bg-(--color-navy) font-bold text-(--color-white) opacity-55"
        type="button"
        disabled
      >
        온라인 신청은 API 연동 후 제공돼요
      </button>
      <button
        v-else
        class="mt-[var(--space-4)] h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-(--color-navy) font-bold text-(--color-white)"
        type="button"
        @click="router.push('/support')"
      >
        비슷한 지원사업 더 보기
      </button>
      <button
        class="mt-[var(--space-4)] h-[var(--control-height)] w-full cursor-pointer rounded-[var(--radius-xl)] border border-(--color-border) bg-(--color-white) font-bold text-(--color-slate-dark)"
        type="button"
        @click="router.push('/support')"
      >
        목록으로 돌아가기
      </button>
    </template>

    <template v-else>
      <section
        class="pt-[var(--space-10)] text-center"
        role="alert"
      >
        <h1 class="m-0 text-[length:var(--font-xl)] font-bold">
          지원사업을 찾을 수 없어요
        </h1>
        <p
          class="mb-[var(--space-8)] mt-[var(--space-3)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
        >
          주소를 확인하거나 지원사업 목록에서 다시 선택해주세요.
        </p>
        <button
          class="mt-[var(--space-4)] h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-(--color-navy) font-bold text-(--color-white)"
          type="button"
          @click="router.push('/support')"
        >
          지원사업 목록 보기
        </button>
      </section>
    </template>
  </main>
  <BottomNavBar v-if="!detail" />
</template>
