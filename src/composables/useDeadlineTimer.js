import { computed, onUnmounted, ref, watch } from 'vue'
import { getDeadlineTimestamp } from '@/utils/date'

// setTimeout의 지연 시간은 32비트 정수 범위(약 24.8일)를 넘으면 즉시 실행돼버려서,
// 그보다 먼 마감은 여러 타이머로 나눠 재귀적으로 예약한다
const MAX_TIMEOUT_DELAY = 2147483647

/**
 * 주어진 마감 문자열(반응형 getter)이 실제로 지났는지를 실시간으로 추적한다.
 * 마감 시각에 정확히 맞춰 값이 갱신되고(날짜 단위가 아닌 초 단위 정확한 비교),
 * 컴포넌트 해제 시 타이머를 정리한다. 날짜만 있는 마감 문자열은 getDeadlineTimestamp를 통해
 * 해당 날짜 23:59:59.999까지 유효한 것으로 해석된다.
 *
 * @param {() => string | null | undefined} getDeadline 마감 문자열을 반환하는 반응형 getter
 * @returns {import('vue').ComputedRef<boolean>} 마감이 지났는지 여부
 */
export function useDeadlineTimer(getDeadline) {
  const nowTimestamp = ref(Date.now())
  let timerId = null

  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  function scheduleTimer() {
    clearTimer()
    const deadlineTime = getDeadlineTimestamp(getDeadline())
    if (!Number.isFinite(deadlineTime)) return

    const delay = deadlineTime - Date.now()
    if (delay <= 0) return // 이미 마감된 경우 타이머 없이도 아래 computed가 바로 true를 반환

    timerId = setTimeout(() => {
      nowTimestamp.value = Date.now()
      scheduleTimer()
    }, Math.min(delay, MAX_TIMEOUT_DELAY))
  }

  watch(getDeadline, scheduleTimer, { immediate: true })
  onUnmounted(clearTimer)

  return computed(() => {
    const deadlineTime = getDeadlineTimestamp(getDeadline())
    return Number.isFinite(deadlineTime) && nowTimestamp.value >= deadlineTime
  })
}
