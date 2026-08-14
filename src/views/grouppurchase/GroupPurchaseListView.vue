<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import IconUser from '@/components/common/icons/IconUser.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';
import IconGroupPurchase from '@/components/common/icons/IconGroupPurchase.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import AppButton from '@/components/common/AppButton.vue';
import { MOCK_GROUP_PURCHASE_LIST } from '@/mocks/groupPurchase';
import { USE_MOCK_DATA } from '@/mocks/config';
import { groupPurchaseApi } from '@/api/groupPurchase';
import { useAuthStore } from '@/stores/auth';
import { GROUP_PURCHASE_STATUS_CODE, getGroupPurchaseStatusLabel } from '@/utils/groupPurchaseStatus';

// 공동구매 게시글은 관리자(role=ADMIN)만 작성 가능 — 일반 유저에게는 글쓰기 버튼 자체를 숨긴다.
// 관리자는 작성자 여부와 무관하게 모든 게시글에 관리 권한을 가지므로(2026-08-10 정책 확정),
// 목록의 '확인하기' 버튼 분기에도 memberId 비교 대신 이 role만 그대로 사용한다.
// 실제 권한은 서버가 403으로 최종 판단하므로, 이건 어디까지나 UX용 방어일 뿐이다
const authStore = useAuthStore();

// 한 페이지에 몇 개씩 불러올지 — 스크롤이 바닥에 닿을 때마다 이 개수만큼 추가로 이어붙인다.
// 백엔드 페이지네이션 계약(GET /api/group-purchase?page&size)의 size 기본값과 맞춰둔 값이라 값만 바꾸면 조절된다.
const PAGE_SIZE = 10;

const groupPurchases = ref([]);
const page = ref(0);
const hasNext = ref(false);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const isError = ref(false);

// 카테고리 · 상태 · 검색어를 쿼리 파라미터로 함께 보내 서버가 필터링 + 페이지네이션을 함께 처리하도록 한다.
// '전체'/빈 값은 "필터 없음"을 의미하므로 파라미터 자체를 보내지 않는다
function buildFilterParams() {
  const params = {};
  if (selectedCategory.value !== '전체') params.category = selectedCategory.value;
  // selectedStatus는 드롭다운에 보여주는 한글 라벨이라, 백엔드로는 enum(OPEN/COMPLETED/...)으로 변환해서 보낸다
  if (selectedStatus.value && selectedStatus.value !== '전체') {
    params.status = GROUP_PURCHASE_STATUS_CODE[selectedStatus.value];
  }
  const keyword = searchKeyword.value.trim();
  if (keyword) params.keyword = keyword;
  return params;
}

async function fetchPage(pageToLoad) {
  if (USE_MOCK_DATA) {
    // mock 모드에서는 페이지네이션/필터를 흉내내기 위해 MOCK 목록을 직접 자르고 거른다
    let list = MOCK_GROUP_PURCHASE_LIST;
    if (selectedCategory.value !== '전체') {
      list = list.filter((gp) => gp.category === selectedCategory.value);
    }
    if (selectedStatus.value && selectedStatus.value !== '전체') {
      list = list.filter((gp) => gp.status === GROUP_PURCHASE_STATUS_CODE[selectedStatus.value]);
    }
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (keyword) {
      list = list.filter((gp) => gp.productName?.toLowerCase().includes(keyword));
    }
    const start = pageToLoad * PAGE_SIZE;
    return {
      items: list.slice(start, start + PAGE_SIZE),
      hasNext: start + PAGE_SIZE < list.length,
    };
  }

  const { data } = await groupPurchaseApi.getList({
    page: pageToLoad,
    size: PAGE_SIZE,
    ...buildFilterParams(),
  });
  const result = data.result ?? { items: [], hasNext: false };
  // 관리자면 진행중일 때 '참여하기' 대신 '확인하기'로 상태 화면 바로 이동
  // isParticipating(로그인 유저의 참여 여부)은 응답에 없을 수 있어 기본값 false로 방어
  // TODO: 백엔드 API 계약 변경(로그인 유저 기준 참여 여부 포함) 후 item.isParticipating으로 교체
  const items = (result.items ?? []).map((item) => ({
    ...item,
    isAdmin: authStore.isAdmin,
    isParticipating: item.isParticipating ?? false,
  }));
  return { items, hasNext: result.hasNext ?? false };
}

// 필터가 바뀔 때마다 새로 시작하는 요청을 구분하기 위한 세대(generation) 번호.
// 응답이 도착했을 때 그 사이 더 최신 요청이 시작됐으면(필터 변경 등) 이 결과는 버린다
let requestGeneration = 0;

// 최초 진입 또는 필터가 바뀌었을 때 — 첫 페이지부터 다시 조회
async function resetAndLoad() {
  const generation = ++requestGeneration;
  page.value = 0;
  hasNext.value = false;
  groupPurchases.value = [];
  isLoading.value = true;
  isLoadingMore.value = false;
  isError.value = false;
  try {
    const { items, hasNext: next } = await fetchPage(0);
    if (generation !== requestGeneration) return;
    groupPurchases.value = items;
    hasNext.value = next;
  } catch {
    if (generation === requestGeneration) isError.value = true;
  } finally {
    if (generation === requestGeneration) isLoading.value = false;
  }
}

// 스크롤이 바닥의 sentinel에 닿으면 다음 페이지를 이어붙인다
async function loadMore() {
  if (!hasNext.value || isLoadingMore.value || isLoading.value) return;
  const generation = requestGeneration;
  isLoadingMore.value = true;
  try {
    const nextPage = page.value + 1;
    const { items, hasNext: next } = await fetchPage(nextPage);
    if (generation !== requestGeneration) return;
    groupPurchases.value = [...groupPurchases.value, ...items];
    page.value = nextPage;
    hasNext.value = next;
  } catch {
    // 다음 페이지 로드 실패는 전체 화면 에러로 덮지 않고, 다시 스크롤하면 자동으로 재시도된다
  } finally {
    // isLoadingMore는 세대와 무관한 UI 플래그라 항상 해제한다 — generation으로 가드하면, 로딩 도중
    // 필터가 바뀌어 세대가 넘어간 경우 이 값이 true로 고정되어 이후 모든 추가 로드가 막힌다
    isLoadingMore.value = false;
  }
}

onMounted(resetAndLoad);

// 카테고리 필터 — 상품등록 화면(GroupPurchaseCreateStep1.vue)이 쓰는 백엔드 허용값과 동일하게 맞춤.
// 다른 값으로 필터링하면 실제로 그 카테고리로 등록된 상품이 없어 항상 빈 목록만 나온다
const categories = ['전체', '사료', '간식', '용품', '기타'];
const selectedCategory = ref('전체');

// 카테고리 칩 클릭 시 선택 상태를 바꾸고 첫 페이지부터 다시 조회
function selectCategory(category) {
  selectedCategory.value = category;
  resetAndLoad();
}

// 상태 드롭다운 필터: 미선택 시 "상태"로 표시(전체 노출)
// 공개 목록은 백엔드 쿼리(GroupPurchaseMapper.xml)가 최상단 WHERE절에서 status != 'CANCELLED'로
// 취소 건을 항상 제외하므로, 여기 '마감(취소)' 옵션을 추가하면 선택해도 항상 빈 목록만 나온다.
// 취소 건은 마이페이지(본인 글 전체 조회, GroupPurchaseMyView.vue)에서만 필터링 가능
const statusOptions = ['전체', '진행중', '달성', '마감(미달)'];
const selectedStatus = ref('');
const isStatusOpen = ref(false);

const statusLabel = computed(() => selectedStatus.value || '상태');

// 상태 드롭다운 버튼 클릭 시 옵션 목록 열기/닫기
function toggleStatusDropdown() {
  isStatusOpen.value = !isStatusOpen.value;
}

// 상태 옵션 선택 후 드롭다운은 자동으로 닫고 첫 페이지부터 다시 조회
function selectStatus(status) {
  selectedStatus.value = status;
  isStatusOpen.value = false;
  resetAndLoad();
}

// 검색어: productName에 검색어가 포함된 게시글만 노출. 타이핑마다 요청을 보내지 않도록 300ms 디바운스
const searchKeyword = ref('');
let searchDebounceTimer = null;
watch(searchKeyword, () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(resetAndLoad, 300);
});

// 필터가 하나라도 걸려 있는지 — 빈 상태 문구를 "아예 없음"과 "조건에 안 맞음"으로 구분하는 데 사용.
// 서버가 필터링까지 함께 처리하므로, 필터 전체 개수를 별도로 조회하지 않고 필터 활성 여부로 문구만 구분한다
const hasActiveFilter = computed(
  () =>
    selectedCategory.value !== '전체' ||
    (selectedStatus.value !== '' && selectedStatus.value !== '전체') ||
    searchKeyword.value.trim() !== '',
);
const emptyStateMessage = computed(() =>
  hasActiveFilter.value ? '조건에 맞는 공동구매가 없어요' : '등록된 공동구매가 없어요',
);

// 스크롤이 바닥의 sentinel(빈 div)에 닿으면 다음 페이지를 불러온다.
// sentinel은 hasNext일 때만 렌더링되므로, 나타나거나 사라질 때마다 관찰 대상을 다시 연결한다
const sentinelEl = ref(null);
let observer = null;
watch(sentinelEl, (el) => {
  observer?.disconnect();
  if (!el) return;
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore();
  });
  observer.observe(el);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  clearTimeout(searchDebounceTimer);
});
</script>

<template>
  <div
    class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+88px)]"
  >
    <!-- 헤더 -->
    <header class="flex items-start justify-between mb-(--space-5)">
      <div>
        <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
          반려동물 용품 공동구매
        </h1>
        <p class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)">
          함께 사면 더 저렴해요
        </p>
      </div>
      <!-- 마이페이지 진입 버튼: 텍스트 없이 프로필 아이콘만 표시 -->
      <router-link
        to="/group-purchase/my"
        aria-label="마이페이지"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-leaf-soft) no-underline"
      >
        <IconUser
          :size="24"
          color="var(--color-navy)"
        />
      </router-link>
    </header>

    <!-- 카테고리 필터 -->
    <div class="flex gap-(--space-2) overflow-x-auto mb-(--space-3)">
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        class="shrink-0 px-(--space-4) py-(--space-2) rounded-full border text-(length:--font-sm) font-medium"
        :class="
          selectedCategory === category
            ? 'bg-(--color-leaf-soft) border-(--color-leaf) text-(color:--color-navy)'
            : 'bg-(--color-white) border-(--color-card-border) text-(color:--color-gray-600)'
        "
        @click="selectCategory(category)"
      >
        {{ category }}
      </button>
    </div>

    <!-- 검색 + 상태 필터 -->
    <div class="flex gap-(--space-2) mb-(--space-5)">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="상품명으로 검색해보세요"
        class="flex-1 min-w-0 px-(--space-4) py-(--space-3) bg-(--color-surface) border border-(--color-border) rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-gray-700) placeholder:text-(color:--color-gray-500)"
      >

      <div class="relative shrink-0">
        <button
          type="button"
          class="inline-flex items-center h-full gap-(--space-1) px-(--space-3) bg-(--color-white) border border-(--color-border) rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-gray-700)"
          @click="toggleStatusDropdown"
        >
          {{ statusLabel }}
          <IconChevronDown
            size="14"
            color="var(--color-gray-500)"
          />
        </button>
        <ul
          v-if="isStatusOpen"
          class="absolute top-[calc(100%+var(--space-1))] right-0 z-10 min-w-[96px] list-none m-0 p-(--space-1) bg-(--color-white) border border-(--color-border) rounded-(--radius-md) shadow-(--shadow-md)"
        >
          <li
            v-for="option in statusOptions"
            :key="option"
          >
            <button
              type="button"
              class="w-full px-(--space-3) py-(--space-2) bg-transparent border-0 rounded-(--radius-sm) text-left text-(length:--font-sm) text-(color:--color-gray-700) hover:bg-(--color-gray-100)"
              @click="selectStatus(option)"
            >
              {{ option }}
            </button>
          </li>
        </ul>
      </div>
    </div>

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
      class="flex flex-col items-center justify-center gap-(--space-4) py-(--space-9) px-(--space-4) text-center"
    >
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        공동구매 목록을 불러오지 못했어요
      </p>
      <AppButton
        variant="primary"
        @click="resetAndLoad"
      >
        다시 시도
      </AppButton>
    </div>

    <!-- 빈 상태 -->
    <EmptyState
      v-else-if="groupPurchases.length === 0"
      :icon="IconGroupPurchase"
      :message="emptyStateMessage"
    />

    <!-- 공동구매 목록 -->
    <template v-else>
      <ul
        class="list-none p-0 m-0 flex flex-col gap-(--space-3)"
      >
        <li
          v-for="gp in groupPurchases"
          :key="gp.id"
          class="flex items-center justify-between gap-(--space-3) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
        >
          <div>
            <h3 class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
              {{ gp.productName }}
            </h3>
            <p class="text-(length:--font-xs) text-(color:--color-gray-500) mb-(--space-1)">
              {{ gp.currentQuantity }}/{{ gp.targetQuantity }}개 참여 · {{ gp.status === 'OPEN' ? gp.dDay : getGroupPurchaseStatusLabel(gp.status) }}
            </p>
            <div class="flex items-center gap-(--space-2) mb-(--space-1)">
              <p class="text-(length:--font-xs) font-bold text-(color:--color-navy)">
                {{ gp.groupPrice?.toLocaleString() }}원
              </p>
              <p class="text-(length:--font-xs) text-(color:--color-slate-muted) line-through">
                {{ gp.unitPrice?.toLocaleString() }}원
              </p>
            </div>
            <span class="text-(length:--font-xs) font-semibold text-(color:--color-gold)">
              {{ gp.badgeText }}
            </span>
          </div>
          <!-- 진행중: 관리자('확인하기')/이미 참여('참여중')는 상세 없이 상태 화면으로, 미참여('참여하기')는 참여 플로우로 이동 -->
          <router-link
            v-if="gp.status === 'OPEN'"
            :to="gp.isAdmin || gp.isParticipating ? `/group-purchase/${gp.id}/status` : `/group-purchase/${gp.id}`"
            class="shrink-0 whitespace-nowrap rounded-full bg-(--color-leaf) px-(--space-4) py-(--space-2) text-(length:--font-sm) font-semibold text-(color:--color-navy) no-underline"
          >
            {{ gp.isAdmin ? '확인하기' : gp.isParticipating ? '참여중' : '참여하기' }}
          </router-link>
          <!-- 마감된 게시글은 새로 참여할 수 없어 비활성화 표시만 함 -->
          <span
            v-else
            class="shrink-0 px-(--space-4) py-(--space-2) bg-(--color-gray-200) text-(color:--color-gray-500) rounded-full text-(length:--font-sm) font-semibold whitespace-nowrap"
          >
            마감
          </span>
        </li>
      </ul>

      <!-- 다음 페이지 로드 트리거: 화면에 보이면 스크롤로 더 불러온다 -->
      <div
        v-if="hasNext"
        ref="sentinelEl"
        class="flex justify-center py-(--space-4)"
      >
        <LoadingSpinner
          v-if="isLoadingMore"
          size="sm"
        />
      </div>
    </template>

    <!-- 글쓰기 버튼: 관리자만 노출 -->
    <router-link
      v-if="authStore.isAdmin"
      to="/group-purchase/create/step1"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-7))] left-(--space-4) right-(--space-4) flex items-center justify-center rounded-(--radius-xl) bg-(--color-leaf) p-(--space-4) text-(length:--font-base) font-bold text-(color:--color-navy) no-underline shadow-(--shadow-card)"
    >
      + 공동구매 글쓰기
    </router-link>
  </div>
</template>
