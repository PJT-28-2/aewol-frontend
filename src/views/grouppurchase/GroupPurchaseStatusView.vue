<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconHourglass from '@/components/common/icons/IconHourglass.vue'

const route = useRoute()
const router = useRouter()

// TODO: onMounted에서 groupPurchaseApi.getStatus(route.params.gpId) 연동 예정, 현재는 응답 포맷과 동일한 mock 데이터
const status = ref({
  gpId: route.params.gpId,
  title: '프리미엄 사료 15kg',
  status: 'waiting',
  currentQuantity: 3,
  targetQuantity: 5,
  deadline: '2026-07-30T23:59:59',
  participantInfo: {
    participantId: 10523,
    paidAmount: 28000,
    paymentStatus: 'COMPLETED',
    paidAt: '2026-07-22T14:45:00',
  },
  noticeMessage: '목표 인원이 모두 모이면 공동구매가 최종 확정됩니다.',
})

// 현재는 waiting 상태만 정의, 이후 confirmed/cancelled 등 상태가 추가되면 매핑 확장
const STATUS_TITLE = {
  waiting: '구매가 보류 중이에요',
}
const statusTitle = computed(
  () => STATUS_TITLE[status.value.status] ?? '구매가 보류 중이에요',
)

const progressPercent = computed(() =>
  Math.min(
    (status.value.currentQuantity / status.value.targetQuantity) * 100,
    100,
  ),
)

// deadline까지 남은 일수를 D-day 라벨로 변환
const deadlineLabel = computed(() => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const deadlineDate = new Date(status.value.deadline)
  const startOfDeadline = new Date(
    deadlineDate.getFullYear(),
    deadlineDate.getMonth(),
    deadlineDate.getDate(),
  )
  const diffDays = Math.ceil((startOfDeadline - startOfToday) / (1000 * 60 * 60 * 24))

  return diffDays <= 0 ? '마감' : `D-${diffDays}`
})

function goToList() {
  router.push('/group-purchase')
}

// TODO: 참여 취소 API 연동 예정 (groupPurchaseApi.leave 활용 여부는 취소/환불 정책 확정 후 결정)
function cancelParticipation() {}
</script>

<template>
  <div class="p-(--space-4) pb-(--space-6) bg-(--color-bg) min-h-screen">
    <!-- 상태 아이콘 -->
    <div class="flex justify-center mt-(--space-6) mb-(--space-5)">
      <div
        class="flex items-center justify-center size-22 rounded-full bg-(--color-gold-surface)"
      >
        <IconHourglass :size="32" color="var(--color-gold-dark)" />
      </div>
    </div>

    <!-- 상태 안내 -->
    <h1
      class="text-(length:--font-lg) font-bold text-(color:--color-navy) text-center mb-(--space-2)"
    >
      {{ statusTitle }}
    </h1>
    <p
      class="text-(length:--font-sm) text-(color:--color-slate-muted) text-center mb-(--space-5)"
    >
      {{ status.noticeMessage }}
    </p>

    <!-- 상품 정보 -->
    <section
      class="flex items-center justify-between bg-(--color-surface) rounded-(--radius-xl) p-(--space-4) mb-(--space-5)"
    >
      <div class="min-w-0">
        <h2
          class="text-(length:--font-md) font-bold text-(color:--color-navy)"
        >
          {{ status.title }}
        </h2>
        <p
          class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
        >
          공동구매가 적용
        </p>
      </div>
      <p
        class="shrink-0 text-(length:--font-md) font-bold text-(color:--color-navy)"
      >
        {{ status.participantInfo.paidAmount.toLocaleString() }}원
      </p>
    </section>

    <!-- 참여 현황 -->
    <section class="mb-(--space-5)">
      <h2
        class="text-(length:--font-sm) font-bold text-(color:--color-slate-dark) mb-(--space-3)"
      >
        참여 현황
      </h2>
      <div class="h-(--size-progress-bar) rounded-full bg-(--color-border) overflow-hidden mb-(--space-2)">
        <div
          class="h-full rounded-full bg-(--color-gold)"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <div class="flex items-center justify-between">
        <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
          {{ status.currentQuantity }}/{{ status.targetQuantity }}개 구매 중
        </p>
        <p class="text-(length:--font-xs) font-bold text-(color:--color-gold-dark)">
          마감 {{ deadlineLabel }}
        </p>
      </div>
    </section>

    <!-- 안내 사항 -->
    <section
      class="bg-(--color-white) border border-(--color-border) rounded-(--radius-lg) p-(--space-4) mb-(--space-5)"
    >
      <ul class="flex flex-col gap-(--space-3)">
        <li class="flex items-start gap-(--space-2)">
          <span class="shrink-0 mt-[7px] size-[5px] rounded-(--radius-full) bg-(--color-slate-dark)" />
          <p class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed">
            결제는 미리 실행 되고, 실제 구매는 확정 시 이뤄져요
          </p>
        </li>
        <li class="flex items-start gap-(--space-2)">
          <span class="shrink-0 mt-[7px] size-[5px] rounded-(--radius-full) bg-(--color-slate-dark)" />
          <p class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed">
            목표 인원 미달 시 자동으로 취소 · 전액 환불돼요
          </p>
        </li>
        <li class="flex items-start gap-(--space-2)">
          <span class="shrink-0 mt-[7px] size-[5px] rounded-(--radius-full) bg-(--color-slate-dark)" />
          <p class="text-(length:--font-xs) text-(color:--color-slate-dark) leading-relaxed">
            결제 상태는 언제든 이 화면에서 다시 확인할 수 있어요
          </p>
        </li>
      </ul>
    </section>

    <!-- 리스트로 돌아가기 -->
    <button
      type="button"
      class="w-full h-13 rounded-(--radius-xl) bg-(--color-navy) text-(color:--color-white) text-(length:--font-md) font-bold mb-(--space-3)"
      @click="goToList"
    >
      리스트로 돌아가기
    </button>

    <!-- 참여 취소하기 -->
    <button
      type="button"
      class="w-full h-[50px] rounded-(--radius-lg) bg-(--color-white) border-[1.2px] border-(--color-danger-soft) text-(color:--color-danger-strong) text-(length:--font-sm) font-bold"
      @click="cancelParticipation"
    >
      참여 취소하기
    </button>
  </div>
</template>
