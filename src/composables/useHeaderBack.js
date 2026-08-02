import { onUnmounted, ref } from 'vue'

// PageHeader의 뒤로가기 버튼은 기본적으로 router.back()을 호출한다.
// 위저드처럼 "이전 단계로"가 페이지 이동이 아닌 화면 전용 화면에서는
// registerHeaderBack으로 헤더 뒤로가기 동작을 그 화면에서만 덮어쓸 수 있다.
const backHandler = ref(null)

export function useHeaderBackHandler() {
  return backHandler
}

export function registerHeaderBack(handler) {
  backHandler.value = handler

  onUnmounted(() => {
    if (backHandler.value === handler) backHandler.value = null
  })
}
