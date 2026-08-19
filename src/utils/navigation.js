/**
 * "원래 있던 곳으로 돌아가기"(목록 → 상세를 push로 들어온 뒤, 액션 성공/뒤로가기 버튼으로
 * 그 목록에 복귀하는 흐름)를 구현할 때 쓴다.
 *
 * router.replace(target)만 쓰면, target이 마침 바로 아래 히스토리 항목과 같을 때(예: 목록
 * push → 상세, 상세에서 액션 성공 후 replace(목록)) 완전히 중복된 항목이 하나 더 쌓인다.
 * 그 상태로 브라우저/제스처 뒤로가기를 누르면 중복 항목으로 이동할 뿐이라 화면이 안 바뀐
 * 것처럼 보이고, 같은 흐름을 반복할수록 계속 쌓인다.
 *
 * history.state.back(Vue Router가 채워주는 네이티브 히스토리 포인터)이 있으면 실제로 뒤로
 * 이동해서 이미 있는 항목을 재사용하고, 없는 경우(직접 URL 접속 등 되돌아갈 곳이 없을 때)에만
 * target으로 replace한다.
 *
 * @param {import('vue-router').Router} router
 * @param {string | object} target router.replace에 전달할 폴백 목적지
 */
export function goBackOr(router, target) {
  if (window.history.state?.back != null) {
    router.back()
  } else {
    router.replace(target)
  }
}
