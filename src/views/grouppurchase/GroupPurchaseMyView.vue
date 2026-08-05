<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconGroupPurchase from '@/components/common/icons/IconGroupPurchase.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import AppButton from '@/components/common/AppButton.vue';
import { MOCK_MY_GROUP_PURCHASES } from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { groupPurchaseApi } from '@/api/groupPurchase';
import { memberApi } from '@/api/member';
import { formatDDayLabel } from '@/utils/date';
import { useMidnightTick } from '@/composables/useMidnightTick';

const isLoading = ref(true);
const isError = ref(false);

const myGroupPurchases = ref([]);

// 백엔드 상태 코드(OPEN/COMPLETED/CANCELLED) ↔ 화면 라벨 매핑
const STATUS_LABEL = {
  OPEN: '진행중',
  COMPLETED: '마감(성공)',
  CANCELLED: '마감(미달)',
};
const STATUS_CODE = {
  진행중: 'OPEN',
  '마감(성공)': 'COMPLETED',
  '마감(미달)': 'CANCELLED',
};

// 상태 필터: 마감 여부와 무관하게 전부 조회 가능
const statusOptions = ['전체', '진행중', '마감(성공)', '마감(미달)'];
const selectedStatus = ref('전체');
const isStatusSheetOpen = ref(false);

function selectStatus(option) {
  selectedStatus.value = option;
  isStatusSheetOpen.value = false;
}

// 상태 배지 색상: 진행중은 올리브, 마감(성공)은 중립 그레이, 마감(미달)은 danger 톤으로 구분
const STATUS_BADGE_CLASS = {
  진행중: 'bg-(--color-olive-surface) text-(color:--color-olive)',
  '마감(성공)': 'bg-(--color-gray-200) text-(color:--color-gray-600)',
  '마감(미달)': 'bg-(--color-danger-soft) text-(color:--color-danger-strong)',
};

// dDay는 목록 조회 시점의 문자열로 고정하지 않고 deadline 원본을 보관해뒀다가 렌더링 시점에
// 계산한다. midnightTick을 읽어서 자정이 지나면 다시 계산되도록 한다
const midnightTick = useMidnightTick();
function dDayLabel(deadline) {
  return formatDDayLabel(deadline, new Date(midnightTick.value));
}

// 상태 필터 + 최신순(createdAt desc) 정렬을 함께 적용
const filteredGroupPurchases = computed(() => {
  const list = myGroupPurchases.value.filter(
    (gp) => selectedStatus.value === '전체' || gp.status === selectedStatus.value,
  );

  return [...list].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
});

// 필터 때문에 안 보이는 것(선택한 상태만 없음)과 애초에 이력이 없는 것을 구분해서 안내
const emptyStateMessage = computed(() =>
  myGroupPurchases.value.length === 0
    ? '작성하거나 참여한 공동구매가 없어요'
    : '선택한 상태의 게시물이 없어요',
);
const emptyStateActionText = computed(() =>
  myGroupPurchases.value.length === 0 ? '공동구매 둘러보기' : '',
);

// 상태 필터를 빠르게 바꾸면 이전 요청이 나중에 응답할 수 있어, 가장 최근에 시작한 요청의
// 결과만 상태에 반영하도록 순번으로 구분한다
let latestRequestId = 0;

async function loadMyGroupPurchases() {
  const requestId = ++latestRequestId;
  isLoading.value = true;
  isError.value = false;

  try {
    if (USE_MOCK_DATA) {
      myGroupPurchases.value = MOCK_MY_GROUP_PURCHASES;
      return;
    }

    // 서버는 group_purchase_participant 레코드를 반환하고 role은 내려주지 않으므로,
    // 로그인한 회원의 memberId와 각 항목의 작성자 memberId를 비교해 '작성'/'참여'를 직접 구분한다
    const { data: profileData } = await memberApi.getProfile();
    const myMemberId = (profileData.result ?? profileData)?.memberId;

    // '전체'는 상태 필터 없이 조회, 그 외에는 백엔드 상태 코드로 변환해서 전달
    const params = selectedStatus.value === '전체' ? {} : { status: STATUS_CODE[selectedStatus.value] };
    const { data } = await groupPurchaseApi.getMyList(params);
    const items = data.result ?? [];

    if (requestId !== latestRequestId) return; // 그 사이 더 최신 요청이 시작됐으면 이 결과는 버린다

    myGroupPurchases.value = items.map((item) => ({
      gpId: item.gpId,
      productName: item.productName,
      role: item.memberId === myMemberId ? '작성' : '참여',
      status: STATUS_LABEL[item.status] ?? item.status,
      currentQuantity: item.currentQuantity,
      targetQuantity: item.targetQuantity,
      deadline: item.deadline,
      createdAt: item.createdAt,
    }));
  } catch {
    if (requestId === latestRequestId) isError.value = true;
  } finally {
    if (requestId === latestRequestId) isLoading.value = false;
  }
}

onMounted(loadMyGroupPurchases);
// 상태 필터가 바뀌면 서버 기준으로 다시 조회 (지금은 mock이라 클라이언트 필터로도 동작하지만, API 연동 후에도 이어지도록 연결)
watch(selectedStatus, loadMyGroupPurchases);
</script>

<template>
  <div class="p-(--space-4) pb-(--space-6) bg-(--color-bg) min-h-screen">
    <!-- 헤더 -->
    <header class="mb-(--space-5)">
      <div class="flex items-center justify-between gap-(--space-3) mb-(--space-1)">
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
          나의 공동구매
        </h1>
        <!-- 상태 선택: 드롭다운이 아니라 바텀시트로 목록을 띄움 -->
        <button
          type="button"
          class="inline-flex items-center shrink-0 gap-(--space-1) px-(--space-3) py-(--space-2) bg-(--color-white) border border-(--color-border) rounded-full text-(length:--font-sm) text-(color:--color-gray-700)"
          @click="isStatusSheetOpen = true"
        >
          {{ selectedStatus }}
          <IconChevronDown
            size="16"
            color="var(--color-gray-500)"
          />
        </button>
      </div>
      <p class="text-(length:--font-md) text-(color:--color-slate-muted)">
        내가 작성하거나 참여한 게시물을 확인해요
      </p>
    </header>

    <!-- 상태 선택 바텀시트 -->
    <BottomSheet
      v-model="isStatusSheetOpen"
      title="상태 선택"
    >
      <ul class="list-none p-0 m-0 flex flex-col">
        <li
          v-for="option in statusOptions"
          :key="option"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between px-(--space-2) py-(--space-3) text-(length:--font-base)"
            :class="
              selectedStatus === option
                ? 'font-semibold text-(color:--color-navy)'
                : 'text-(color:--color-gray-700)'
            "
            @click="selectStatus(option)"
          >
            {{ option }}
            <IconCheck
              v-if="selectedStatus === option"
              size="20"
              color="var(--color-navy)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>

    <!-- 로딩 상태 -->
    <div
      v-if="isLoading"
      class="flex justify-center py-(--space-9)"
    >
      <LoadingSpinner />
    </div>

    <!-- 에러 상태 -->
    <div
      v-else-if="isError"
      class="flex flex-col items-center justify-center gap-(--space-4) min-h-(--size-state-message-height) px-(--space-4) text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        공동구매 내역을 불러오지 못했어요
      </p>
      <AppButton
        variant="navy"
        @click="loadMyGroupPurchases"
      >
        다시 시도
      </AppButton>
    </div>

    <!-- 빈 상태 -->
    <EmptyState
      v-else-if="filteredGroupPurchases.length === 0"
      :icon="IconGroupPurchase"
      :message="emptyStateMessage"
      :action-text="emptyStateActionText"
      action-route="/group-purchase"
    />

    <!-- 목록: 최신순, 마감된 게시글도 카드를 눌러 상태 화면 확인 가능 -->
    <ul
      v-else
      class="list-none p-0 m-0 flex flex-col gap-(--space-3)"
    >
      <li
        v-for="gp in filteredGroupPurchases"
        :key="gp.gpId"
      >
        <router-link
          :to="`/group-purchase/${gp.gpId}/status?from=my`"
          class="flex items-center justify-between gap-(--space-3) p-(--space-4) bg-(--color-white) rounded-(--radius-xl) shadow-(--shadow-sm) no-underline"
        >
          <div class="min-w-0">
            <h3 class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
              {{ gp.productName }}
            </h3>
            <p class="text-(length:--font-xs) text-(color:--color-gray-500) mb-(--space-2)">
              {{ gp.role }} · {{ gp.currentQuantity }}/{{ gp.targetQuantity }}개 · {{ gp.status === '진행중' ? dDayLabel(gp.deadline) : '마감됨' }}
            </p>
            <span
              class="inline-block px-(--space-2) py-(--space-1) rounded-full text-(length:--font-xs) font-semibold"
              :class="STATUS_BADGE_CLASS[gp.status]"
            >
              {{ gp.status }}
            </span>
          </div>
          <IconChevronRight
            class="shrink-0"
            size="18"
            color="var(--color-gray-400)"
          />
        </router-link>
      </li>
    </ul>
  </div>
</template>
