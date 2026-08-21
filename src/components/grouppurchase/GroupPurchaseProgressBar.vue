<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  // 0~100 사이로 정규화된 진행률. 클램핑은 호출부(progressPercent computed)에서 이미 처리한다.
  percent: { type: Number, required: true },
})

// 화면 진입 시 0%에서 시작해 실제 값까지 차오르는 게이지 애니메이션을 위한 표시용 상태.
// 처음부터 최종값으로 그리면 width가 바뀐 적이 없어 CSS transition이 재생되지 않으므로,
// 0으로 한 번 그린 뒤 mount 직후(다음 프레임)에 목표값으로 바꿔 transition을 발생시킨다.
// 이후 percent가 바뀌면(수량 선택 등) 그 값을 그대로 따라가며 자연스럽게 트랜지션된다.
const displayPercent = ref(0)

let rafId1 = null
let rafId2 = null

onMounted(() => {
  // rAF를 한 번만 걸면, 0%로 그린 화면이 실제로 페인트되기 전에 목표값으로 바뀌어버려
  // (같은 프레임 안에서 값이 두 번 바뀌는 것으로 처리돼) 브라우저가 transition 없이 바로
  // 최종 값을 그려버리는 경우가 있다. rAF를 두 번 걸어 0%가 한 프레임 확실히 페인트된
  // 뒤에 목표값으로 바꿔야 새로고침 때마다 안정적으로 채워지는 애니메이션이 재생된다.
  rafId1 = requestAnimationFrame(() => {
    rafId2 = requestAnimationFrame(() => {
      displayPercent.value = props.percent
    })
  })
})

// rAF가 아직 안 끝난 상태로 화면을 벗어나면(빠른 이탈 등) 예약된 콜백이 언마운트 이후에도
// 실행되며 불필요하게 남아있을 수 있어 정리한다
onUnmounted(() => {
  if (rafId1) cancelAnimationFrame(rafId1)
  if (rafId2) cancelAnimationFrame(rafId2)
})

watch(() => props.percent, (next) => {
  displayPercent.value = next
})
</script>

<template>
  <div
    class="h-(--size-progress-bar) rounded-full bg-(--color-border) overflow-hidden mb-(--space-2)"
    role="progressbar"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full rounded-full bg-(--color-gold) transition-[width] duration-1000 ease-out"
      :style="{ width: `${displayPercent}%` }"
    />
  </div>
</template>
