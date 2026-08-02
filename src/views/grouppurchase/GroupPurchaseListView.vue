<script setup>
import { ref, computed } from 'vue';
import IconUser from '@/components/common/icons/IconUser.vue';

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const groupPurchases = ref([
  {
    id: 1,
    productName: '프리미엄 사료 15kg',
    category: '사료',
    status: '진행중',
    currentQuantity: 32,
    targetQuantity: 50,
    dDay: 'D-3',
    badgeText: '30% 할인',
  },
  {
    id: 2,
    productName: '강아지 관절 영양제 3개월분',
    category: '영양제',
    status: '진행중',
    currentQuantity: 8,
    targetQuantity: 30,
    dDay: 'D-7',
    badgeText: '20% 할인',
  },
  {
    id: 3,
    productName: '고양이 스크래처 장난감 세트',
    category: '장난감',
    status: '마감(성공)',
    currentQuantity: 20,
    targetQuantity: 20,
    dDay: 'D-0',
    badgeText: '15% 할인',
  },
  {
    id: 4,
    productName: '강아지 방한 조끼',
    category: '기타',
    status: '마감(미달)',
    currentQuantity: 12,
    targetQuantity: 30,
    dDay: 'D-0',
    badgeText: '25% 할인',
  },
]);

// 카테고리 필터: mock 데이터의 category 필드 기준으로 필터링 (현재는 클라이언트에서만 처리)
const categories = ['전체', '사료', '영양제', '장난감', '기타'];
const selectedCategory = ref('전체');

// 카테고리 칩 클릭 시 선택 상태 변경
function selectCategory(category) {
  selectedCategory.value = category;
}

// 상태 드롭다운 필터: mock 데이터의 status 필드 기준, 미선택 시 "상태"로 표시(전체 노출)
const statusOptions = ['전체', '진행중', '마감(성공)', '마감(미달)'];
const selectedStatus = ref('');
const isStatusOpen = ref(false);

const statusLabel = computed(() => selectedStatus.value || '상태');

// 상태 드롭다운 버튼 클릭 시 옵션 목록 열기/닫기
function toggleStatusDropdown() {
  isStatusOpen.value = !isStatusOpen.value;
}

// 상태 옵션 선택 후 드롭다운은 자동으로 닫음
function selectStatus(status) {
  selectedStatus.value = status;
  isStatusOpen.value = false;
}

// 검색어: productName에 검색어가 포함된 게시글만 노출
const searchKeyword = ref('');

// 카테고리 · 상태 · 검색어 세 조건을 모두 만족하는 게시글만 노출 (DB 연동 후 서버 필터링으로 대체 예정)
const filteredGroupPurchases = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return groupPurchases.value.filter((gp) => {
    const matchesCategory =
      selectedCategory.value === '전체' || gp.category === selectedCategory.value;
    const matchesStatus =
      !selectedStatus.value || selectedStatus.value === '전체' || gp.status === selectedStatus.value;
    const matchesKeyword =
      !keyword || gp.productName.toLowerCase().includes(keyword);

    return matchesCategory && matchesStatus && matchesKeyword;
  });
});
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+88px)] bg-(--color-bg) min-h-screen"
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
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-gray-100) no-underline"
      >
        <IconUser :size="24" color="var(--color-navy)" />
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
            ? 'bg-(--color-navy) border-(--color-navy) text-(color:--color-white)'
            : 'bg-(--color-white) border-(--color-border) text-(color:--color-gray-600)'
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
      />

      <div class="relative shrink-0">
        <button
          type="button"
          class="inline-flex items-center h-full gap-(--space-1) px-(--space-3) bg-(--color-white) border border-(--color-border) rounded-(--radius-md) text-(length:--font-sm) text-(color:--color-gray-700)"
          @click="toggleStatusDropdown"
        >
          {{ statusLabel }}
          <span class="text-(length:--font-xs) text-(color:--color-gray-500)">▾</span>
        </button>
        <ul
          v-if="isStatusOpen"
          class="absolute top-[calc(100%+var(--space-1))] right-0 z-10 min-w-[96px] list-none m-0 p-(--space-1) bg-(--color-white) border border-(--color-border) rounded-(--radius-md) shadow-(--shadow-md)"
        >
          <li v-for="option in statusOptions" :key="option">
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

    <!-- 공동구매 목록 -->
    <ul class="list-none p-0 m-0 flex flex-col gap-(--space-3)">
      <li
        v-for="gp in filteredGroupPurchases"
        :key="gp.id"
        class="flex items-center justify-between gap-(--space-3) p-(--space-4) bg-(--color-surface) border border-(--color-border) rounded-(--radius-lg)"
      >
        <div>
          <h3 class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
            {{ gp.productName }}
          </h3>
          <p class="text-(length:--font-xs) text-(color:--color-gray-500) mb-(--space-1)">
            {{ gp.currentQuantity }}/{{ gp.targetQuantity }}개 참여 · {{ gp.status === '진행중' ? gp.dDay : gp.status }}
          </p>
          <span class="text-(length:--font-xs) font-semibold text-(color:--color-gold)">
            {{ gp.badgeText }}
          </span>
        </div>
        <router-link
          v-if="gp.status === '진행중'"
          :to="`/group-purchase/${gp.id}`"
          class="shrink-0 px-(--space-4) py-(--space-2) bg-(--color-navy) text-(color:--color-white) rounded-full text-(length:--font-sm) font-semibold no-underline whitespace-nowrap"
        >
          참여하기
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

    <!-- 글쓰기 버튼 -->
    <router-link
      to="/group-purchase/create/step1"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) flex items-center justify-center p-(--space-4) bg-(--color-gold) text-(color:--color-navy) rounded-(--radius-xl) text-(length:--font-base) font-bold no-underline shadow-(--shadow-md)"
    >
      + 공동구매 글쓰기
    </router-link>
  </div>
</template>
