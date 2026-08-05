import { onUnmounted, ref } from 'vue'

// 자정마다 갱신되는 공용 반응형 타임스탬프.
// D-day 라벨처럼 "날짜"가 바뀌는 순간에만 다시 계산되면 되는 표시용 computed의 의존성으로 사용한다.
// (초 단위로 정확한 마감 시각 비교가 필요하면 useDeadlineTimer를 사용할 것)
export function useMidnightTick() {
  const tick = ref(Date.now())
  let timerId = null

  function scheduleNextMidnight() {
    if (timerId !== null) clearTimeout(timerId)
    const now = new Date()
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    timerId = setTimeout(() => {
      tick.value = Date.now()
      scheduleNextMidnight()
    }, nextMidnight.getTime() - now.getTime())
  }

  scheduleNextMidnight()
  onUnmounted(() => {
    if (timerId !== null) clearTimeout(timerId)
  })

  return tick
}
