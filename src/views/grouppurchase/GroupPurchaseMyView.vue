<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconGroupPurchase from '@/components/common/icons/IconGroupPurchase.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import AppButton from '@/components/common/AppButton.vue';

const isLoading = ref(true);
const isError = ref(false);

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 groupPurchaseApi.getMyList()로 교체
// role: group_purchase_participant에 로그인 유저 member_id의 참여 row가 있으면 '참여',
// 없이 group_purchase 작성자 member_id만 일치하면 '작성'으로 판정
// '참여'는 GroupPurchaseStatusView(결제/취소)로, '작성'은 GroupPurchaseDetailView(읽기 전용)로 이동
const myGroupPurchases = ref([
  {
    gpId: 1,
    productName: '프리미엄 사료 15kg',
    role: '참여',
    status: '진행중',
    currentQuantity: 32,
    targetQuantity: 50,
    dDay: 'D-3',
    createdAt: '2026-07-27T10:00:00',
  },
  {
    gpId: 2,
    productName: '강아지 사료 정기배송',
    role: '작성',
    status: '진행중',
    currentQuantity: 18,
    targetQuantity: 20,
    dDay: 'D-2',
    createdAt: '2026-07-26T09:30:00',
  },
  {
    gpId: 3,
    productName: '고양이 화장실 모래 대용량',
    role: '참여',
    status: '마감(성공)',
    currentQuantity: 15,
    targetQuantity: 15,
    dDay: 'D-0',
    createdAt: '2026-07-18T09:30:00',
  },
  {
    gpId: 4,
    productName: '강아지 간식 세트',
    role: '작성',
    status: '마감(미달)',
    currentQuantity: 8,
    targetQuantity: 10,
    dDay: 'D-0',
    createdAt: '2026-07-15T18:20:00',
  },
]);

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
  진행중: 'bg-(--color-olive-surface) text-(color:--color-olive-dark)',
  '마감(성공)': 'bg-(--color-gray-200) text-(color:--color-gray-600)',
  '마감(미달)': 'bg-(--color-danger-soft) text-(color:--color-danger-strong)',
};

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

async function loadMyGroupPurchases() {
  isLoading.value = true;
  isError.value = false;

  try {
    // TODO: const { data } = await groupPurchaseApi.getMyList({ status: selectedStatus.value })
    // myGroupPurchases.value = data
  } catch {
    isError.value = true;
  } finally {
    isLoading.value = false;
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
      <router-link
        to="/group-purchase"
        aria-label="뒤로 가기"
        class="inline-flex items-center mb-(--space-3) text-(color:--color-navy)"
      >
        <IconArrowLeft size="24" />
      </router-link>
      <div class="flex items-center justify-between gap-(--space-3) mb-(--space-1)">
        <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy)">
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
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
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
          :to="gp.role === '참여' ? `/group-purchase/${gp.gpId}/status` : `/group-purchase/${gp.gpId}?owner=1`"
          class="flex items-center justify-between gap-(--space-3) p-(--space-4) bg-(--color-white) rounded-(--radius-xl) shadow-(--shadow-sm) no-underline"
        >
          <div class="min-w-0">
            <h3 class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
              {{ gp.productName }}
            </h3>
            <p class="text-(length:--font-xs) text-(color:--color-gray-500) mb-(--space-2)">
              {{ gp.role }} · {{ gp.currentQuantity }}/{{ gp.targetQuantity }}개 · {{ gp.status === '진행중' ? gp.dDay : '마감됨' }}
            </p>
            <span
              class="inline-block px-(--space-2) py-(--space-1) rounded-full text-(length:--font-xs) font-semibold"
              :class="STATUS_BADGE_CLASS[gp.status]"
            >
              {{ gp.status }}
            </span>
          </div>
          <IconChevronRight
            size="20"
            color="var(--color-gray-400)"
            class="shrink-0"
          />
        </router-link>
      </li>
    </ul>
  </div>
</template>
