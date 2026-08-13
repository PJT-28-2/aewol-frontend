import { ref } from 'vue';

/**
 * 계좌 목록 로딩 상태(loadError)/loadAccounts 함수를 표준화한 컴포저블.
 * ChargeAccountSelectView.vue / TransferAccountSelectView.vue에 거의 동일하게
 * 복사돼 있던 로직을 하나로 모았어요 (PR #215 리뷰 지적, 2026-08-13) —
 * 나중에 한쪽만 고치고 다른 쪽을 놓치기 쉬운 중복을 방지해요.
 *
 * isLoadingAccounts로 재시도 버튼 연타 시 fetchFn이 동시에 여러 번
 * 호출되는 걸 막아요 — 클릭 핸들러 안에서 await 이전에 동기적으로 체크하기 때문에
 * Vue 렌더링 타이밍과 무관하게 즉시 가드돼요.
 */
export function useAccountsLoader(fetchFn) {
  const loadError = ref('');
  const isLoadingAccounts = ref(false);

  async function loadAccounts() {
    if (isLoadingAccounts.value) return;
    isLoadingAccounts.value = true;
    loadError.value = '';
    try {
      await fetchFn();
    } catch {
      loadError.value = '계좌 목록을 불러오지 못했어요. 다시 시도해주세요';
    } finally {
      isLoadingAccounts.value = false;
    }
  }

  return { loadError, isLoadingAccounts, loadAccounts };
}
