<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import BottomNavBar from "@/components/common/BottomNavBar.vue";

const route = useRoute();
const router = useRouter();
const detail = computed(() => Boolean(route.params.programId));
const programs = [
  {
    id: "neuter",
    title: "서울시 반려동물 중성화 지원",
    description: "소득 조건 충족 · 최대 15만원",
    agency: "서울시 동물복지과",
    amount: "최대 15만원",
    period: "2026년 12월 31일까지",
    available: true,
    conditions: [
      {
        met: true,
        title: "반려동물 등록 완료",
        description: "국가동물보호정보시스템에 등록되어 있어요",
      },
      {
        met: true,
        title: "서울시 거주자",
        description: "프로필상 거주지 조건을 충족했어요",
      },
      {
        met: true,
        title: "소득 조건 충족",
        description: "지원 대상 소득 기준을 충족했어요",
      },
    ],
  },
  {
    id: "vaccine",
    title: "강아지 예방접종비 지원사업",
    description: "만 2세 이하 반려견 대상",
    agency: "서울시 동물복지과",
    amount: "최대 10만원",
    period: "예산 소진 시까지",
    available: true,
    conditions: [
      {
        met: true,
        title: "반려동물 등록 완료",
        description: "국가동물보호정보시스템에 등록되어 있어요",
      },
      {
        met: true,
        title: "서울시 거주자",
        description: "프로필상 거주지 조건을 충족했어요",
      },
      {
        met: true,
        title: "만 2세 이하 반려견",
        description: "프로필상 연령 조건을 충족했어요",
      },
    ],
  },
  {
    id: "adoption",
    title: "유기동물 입양비 지원",
    description: "입양 후 6개월 이내 신청",
    agency: "제주시 동물복지과",
    amount: "최대 20만원",
    period: "입양일로부터 6개월 이내",
    available: false,
    conditions: [
      {
        met: true,
        title: "반려동물 등록 완료",
        description: "국가동물보호정보시스템에 등록되어 있어요",
      },
      {
        met: true,
        title: "제주시 거주자",
        description: "프로필상 거주지 조건을 충족했어요",
      },
      {
        met: false,
        title: "입양 후 6개월 이내 신청",
        description: "입양일로부터 8개월이 지나 신청 기간이 지났어요",
      },
    ],
  },
];
const selected = computed(() =>
  programs.find((program) => program.id === route.params.programId),
);
</script>

<template>
  <main class="support-screen">
    <template v-if="!detail">
      <h1>우리 동네 지원사업</h1>
      <p class="description">
        프로필 조건에 맞는 지원사업을 모아봤어요
      </p>
      <article
        v-for="program in programs"
        :key="program.id"
        class="program-card"
        :class="{ unavailable: !program.available }"
      >
        <span
          class="status"
          :class="{ fail: !program.available }"
        >{{
          program.available ? "신청 가능" : "조건 미충족"
        }}</span>
        <h2>{{ program.title }}</h2>
        <p>{{ program.description }}</p>
        <button
          type="button"
          @click="router.push(`/support/${program.id}`)"
        >
          {{ program.available ? "신청 안내" : "조건 보기" }}
        </button>
      </article>
    </template>
    <template v-else-if="selected">
      <button
        class="back"
        type="button"
        @click="router.push('/support')"
      >
        ‹
      </button><span
        class="status"
        :class="{ fail: !selected.available }"
      >{{
        selected.available ? "신청 가능" : "조건 미충족"
      }}</span>
      <h1>{{ selected.title }}</h1>
      <p class="description">
        {{ selected.agency }} · {{ selected.amount }}
      </p>
      <section class="period">
        <b>신청 기간</b><strong>{{ selected.period }}</strong>
      </section>
      <h2 class="section-title">
        신청 조건
      </h2>
      <div
        v-for="condition in selected.conditions"
        :key="condition.title"
        class="condition"
        :class="{ 'fail-row': !condition.met }"
      >
        <b>{{ condition.met ? "✓" : "✕" }}</b><span><strong>{{ condition.title }}</strong><small>{{ condition.description }}</small></span>
      </div>
      <div
        v-if="!selected.available"
        class="notice"
      >
        💡 현재 조건으로는 이 지원사업을 신청할 수 없어요<br><small>비슷한 조건의 다른 지원사업을 확인해보세요</small>
      </div>
      <button
        v-if="selected.available"
        class="primary"
        type="button"
        disabled
      >
        온라인 신청은 API 연동 후 제공돼요
      </button><button
        v-else
        class="primary"
        type="button"
        @click="router.push('/support')"
      >
        비슷한 지원사업 더 보기
      </button><button
        class="secondary"
        type="button"
        @click="router.push('/support')"
      >
        목록으로 돌아가기
      </button>
    </template>
    <template v-else>
      <section
        class="not-found"
        role="alert"
      >
        <h1>지원사업을 찾을 수 없어요</h1>
        <p class="description">
          주소를 확인하거나 지원사업 목록에서 다시 선택해주세요.
        </p>
        <button
          class="primary"
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

<style scoped>
.support-screen {
  width: min(100%, var(--mobile-content-width));
  min-height: 780px;
  margin: 0 auto;
  padding: 62px 22px 100px;
  box-sizing: border-box;
  color: var(--color-navy);
  background: var(--color-white);
}
.support-screen h1 {
  margin: 0;
  font-size: var(--font-xl);
}
.description {
  margin: 4px 0 36px;
  color: var(--color-slate-muted);
  font-size: 12.5px;
}
.program-card {
  position: relative;
  height: 118px;
  margin-bottom: 14px;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: 18px;
}
.program-card.unavailable {
  background: var(--color-surface);
}
.status {
  display: inline-grid;
  place-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 10px;
  background: var(--color-olive-surface);
  color: var(--color-olive-dark);
  font-size: 10.5px;
  font-weight: var(--font-bold);
}
.status.fail {
  background: var(--color-danger-surface);
  color: var(--color-danger-dark);
}
.program-card h2 {
  margin: 7px 0 4px;
  font-size: var(--font-md);
}
.program-card p {
  margin: 0;
  color: var(--color-slate-muted);
  font-size: 11.5px;
}
.program-card button {
  position: absolute;
  right: 16px;
  bottom: 12px;
  width: 82px;
  height: 26px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-navy);
  color: var(--color-white);
  font-size: 11px;
  font-weight: var(--font-bold);
  cursor: pointer;
}
.unavailable button {
  border: 1px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-slate-dark);
}
.back {
  display: block;
  margin: -12px 0 22px -8px;
  border: 0;
  background: none;
  color: var(--color-navy);
  font-size: var(--font-3xl);
  cursor: pointer;
}
.support-screen > .status {
  margin-bottom: var(--space-3);
}
.period,
.notice {
  margin-top: 28px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--color-surface);
}
.period b,
.period strong {
  display: block;
}
.period b {
  color: var(--color-slate-dark);
  font-size: 11px;
}
.period strong {
  margin-top: 6px;
  font-size: 12.5px;
}
.section-title {
  margin: 28px 0 12px;
  font-size: 15px;
}
.condition {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  margin: 14px 0;
}
.condition > b {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-olive-surface);
  color: var(--color-olive-dark);
}
.condition.fail-row > b {
  background: var(--color-danger-surface);
  color: var(--color-danger-dark);
}
.condition span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.condition strong {
  font-size: 13px;
}
.condition small,
.notice {
  color: var(--color-slate-muted);
  font-size: 11px;
}
.notice {
  color: var(--color-slate-dark);
  line-height: 1.6;
}
.notice small {
  color: var(--color-slate-muted);
}
.primary,
.secondary {
  width: 100%;
  height: var(--control-height-lg);
  margin-top: var(--space-4);
  border: 0;
  border-radius: var(--radius-xl);
  background: var(--color-navy);
  color: var(--color-white);
  font-weight: var(--font-bold);
  cursor: pointer;
}
.secondary {
  height: 50px;
  border: 1px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-slate-dark);
}
.primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.not-found {
  padding-top: var(--space-10);
  text-align: center;
}
.not-found .description {
  margin-top: var(--space-3);
}
</style>
