<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import BankBadge from '@/components/common/BankBadge.vue';
import IconClose from '@/components/common/icons/IconClose.vue';
import { getBankName } from '@/utils/bankMeta';

/**
 * 1원 인증 입금자명을 은행 앱 푸시 알림처럼 보여주는 시연용 카드(#366).
 *
 * CODEF 데모 서버는 실제 이체를 하지 않아서 은행 앱 알림이 오지 않는다. 그래서 시연
 * 환경에서는 백엔드가 verify-deposit 응답에 입금자명을 실어 보내고(#290), 이 컴포넌트가
 * 실서비스의 푸시 알림 화면을 대신 재현한다.
 *
 * 두 가지는 의도적으로 이렇게 뒀다.
 *  - '시연용 모의 알림' 라벨은 항상 표시한다. 실제 은행 알림과 구분되지 않으면 보는 사람이
 *    실제 은행 연동이 동작하는 것으로 오해할 수 있다.
 *  - 카드를 눌러도 입금자명이 자동 입력되지 않는다. 사용자가 알림을 보고 직접 입력하는 게
 *    실제 사용 흐름이고, 자동 입력은 시연에서 "값을 그냥 넘긴 것"으로 보인다.
 *
 * 노출 여부(빌드 플래그 + 백엔드 응답 유무)는 호출하는 쪽에서 판단한다 —
 * 이 컴포넌트는 depositorName이 들어오면 보여주기만 한다.
 */
const props = defineProps({
  bankCode: { type: String, default: '' },
  // 백엔드가 내려준 입금자명. null이면 카드를 띄우지 않는다.
  depositorName: { type: String, default: null },
  // 요청 직후 곧바로 뜨면 "응답 값을 그대로 찍은 것"처럼 보여서, 실제 푸시처럼
  // 약간의 지연을 준다.
  delayMs: { type: Number, default: 1200 },
});

const isVisible = ref(false);
const receivedAt = ref('');
let showTimer = null;

const bankName = computed(() => getBankName(props.bankCode) || '은행');

function clearShowTimer() {
  if (showTimer !== null) {
    clearTimeout(showTimer);
    showTimer = null;
  }
}

function formatReceivedAt(date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hours < 12 ? '오전' : '오후';
  // 0시는 12시로, 13시 이후는 12를 빼서 12시간제로 표기한다.
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${meridiem} ${hour12}:${minutes}`;
}

function dismiss() {
  clearShowTimer();
  isVisible.value = false;
}

// 재전송하면 새 입금자명이 내려오므로, 이전 카드를 내리고 새로 띄운다.
watch(
  () => props.depositorName,
  (name) => {
    clearShowTimer();
    isVisible.value = false;
    if (!name) return;
    showTimer = setTimeout(() => {
      receivedAt.value = formatReceivedAt(new Date());
      isVisible.value = true;
      showTimer = null;
    }, props.delayMs);
  },
  { immediate: true },
);

onBeforeUnmount(clearShowTimer);
</script>

<template>
  <!-- 전환 효과는 BottomSheet.vue/AppModal.vue와 동일하게 Transition의 *-class prop에
       Tailwind 유틸리티를 직접 넘기는 방식으로 맞춘다(프로젝트 규칙상 scoped CSS를 새로
       작성하지 않는다). 실제 푸시처럼 화면 위에서 미끄러져 내려오되, 모션을 줄이도록
       설정한 사용자에게는 motion-reduce로 이동 없이 페이드만 준다. -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="-translate-y-full opacity-0 motion-reduce:translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="-translate-y-full opacity-0 motion-reduce:translate-y-0"
  >
    <div
      v-if="isVisible"
      class="fixed left-(--space-3) right-(--space-3) top-[calc(var(--space-3)+env(safe-area-inset-top,0px))] z-100 mx-auto max-w-[calc(var(--layout-max-width)-var(--space-6))] rounded-(--radius-xl) bg-(--color-white) p-(--space-3) shadow-[0_12px_32px_color-mix(in_srgb,var(--color-navy)_24%,transparent)]"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-center gap-(--space-2)">
        <BankBadge
          :bank-code="bankCode"
          :size="36"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-(--space-1)">
            <span class="truncate text-(length:--font-sm) font-(--font-semibold) text-(color:--color-navy)">
              {{ bankName }}
            </span>
            <span class="shrink-0 rounded-(--radius-full) bg-(--color-gray-200) px-(--space-2) py-[2px] text-(length:--font-xs) text-(color:--color-gray-700)">
              시연용 모의 알림
            </span>
            <span class="ml-auto shrink-0 text-(length:--font-xs) text-(color:--color-gray-600)">
              {{ receivedAt }}
            </span>
          </div>
          <p class="mt-[2px] truncate text-(length:--font-md) text-(color:--color-navy)">
            입금 <strong class="font-(--font-bold)">1원</strong>
            <span class="text-(color:--color-gray-600)"> · </span>
            <strong class="font-(--font-bold)">{{ depositorName }}</strong>
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 self-start p-(--space-1) text-(color:--color-gray-500)"
          aria-label="알림 닫기"
          @click="dismiss"
        >
          <IconClose size="16" />
        </button>
      </div>
    </div>
  </Transition>
</template>
