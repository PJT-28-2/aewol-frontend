/**
 * "원래 있던 곳으로 돌아가기"(목록 → 상세를 push로 들어온 뒤, 액션 성공/뒤로가기 버튼으로
 * 그 목록에 복귀하는 흐름)를 구현할 때 쓴다.
 *
 * router.replace(target)만 쓰면, target이 마침 바로 아래 히스토리 항목과 같을 때(예: 목록
 * push → 상세, 상세에서 액션 성공 후 replace(목록)) 완전히 중복된 항목이 하나 더 쌓인다.
 * 그 상태로 브라우저/제스처 뒤로가기를 누르면 중복 항목으로 이동할 뿐이라 화면이 안 바뀐
 * 것처럼 보이고, 같은 흐름을 반복할수록 계속 쌓인다.
 *
 * 다만 "뒤로 갈 히스토리가 있다(history.state.back != null)"는 것만으로 무조건 router.back()을
 * 쓰면 안 된다 — 이 화면에 항상 target에서 push로 들어온다는 보장이 없으면(예: 다른 화면이
 * 자신을 이 화면으로 replace한 경우) back이 가리키는 곳이 target과 다른 엉뚱한 화면일 수 있다.
 * 그래서 history.state.back의 실제 경로(쿼리스트링 제외)가 target과 일치할 때만 back()을
 * 쓰고, 그 외에는(경로가 다르거나 back 자체가 없을 때) target으로 replace한다.
 *
 * @param {import('vue-router').Router} router
 * @param {string | object} target router.replace에 전달할 목적지(경로 일치 확인에도 사용)
 */
export function goBackOr(router, target) {
  const back = window.history.state?.back
  const targetPath = pathOnly(resolvePath(router, target))

  if (back != null && pathOnly(back) === targetPath) {
    router.back()
  } else {
    router.replace(target)
  }
}

function resolvePath(router, target) {
  return typeof target === 'string' ? target : router.resolve(target).fullPath
}

function pathOnly(fullPath) {
  return fullPath.split('?')[0]
}
