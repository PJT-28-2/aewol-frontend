/**
 * 간편 비밀번호(PIN) 취약 패턴 검사.
 *
 * 서버(MemberServiceImpl.isWeakPin/hasSequentialRun)와 동일한 규칙 — 둘 중 하나만 고치면
 * 프론트/서버 판정이 어긋나니 항상 같이 수정할 것. AccountPasswordSetupView.vue와
 * 간편 비밀번호 재설정 화면이 함께 이 유틸을 사용한다.
 *
 * @param {string} value 6자리 숫자 PIN
 * @returns {'sequential'|'weak'|null} 원인별로 다른 안내 문구를 보여주기 위해 구분해서 반환한다.
 * - sequential: 연속된 숫자 3자리 이상(123, 987) — PIN 전체가 아니라 중간에 섞여 있어도
 *   막는다(예: 451236은 뒤쪽 "123"이 걸림). 9 다음 0으로 넘어가는 890, 901 같은 순환 구간도 포함.
 * - weak: 전부 같은 숫자(111111) / 두 자리 반복(121212) / 세 자리 반복(123123) /
 *   두 자리씩 짝지어 오름차순·내림차순으로 이어지는 경우(112233, 998877)
 */
export function getPinWeaknessReason(value) {
  if (hasSequentialRun(value, 3)) return 'sequential';

  if (
    /^(\d)\1{5}$/.test(value) ||
    /^(\d{2})\1{2}$/.test(value) ||
    /^(\d{3})\1$/.test(value) ||
    hasAscendingOrDescendingPairs(value)
  ) {
    return 'weak';
  }

  return null;
}

// value 안에서 오름차순/내림차순으로 minLength자리 이상 이어지는 구간이 있으면 true.
// 0↔9 경계도 순환으로 취급한다(9 다음 0, 0 다음 9).
function hasSequentialRun(value, minLength) {
  let ascRun = 1;
  let descRun = 1;
  for (let i = 1; i < value.length; i++) {
    const prev = Number(value[i - 1]);
    const curr = Number(value[i]);

    ascRun = (prev + 1) % 10 === curr ? ascRun + 1 : 1;
    descRun = (prev - 1 + 10) % 10 === curr ? descRun + 1 : 1;

    if (ascRun >= minLength || descRun >= minLength) return true;
  }
  return false;
}

function hasAscendingOrDescendingPairs(value) {
  const pairDigits = [];
  for (let i = 0; i < value.length; i += 2) {
    if (value[i] !== value[i + 1]) return false;
    pairDigits.push(Number(value[i]));
  }
  if (pairDigits.length !== 3) return false;
  const step1 = pairDigits[1] - pairDigits[0];
  const step2 = pairDigits[2] - pairDigits[1];
  return step1 === step2 && Math.abs(step1) === 1;
}
