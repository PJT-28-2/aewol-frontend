<script setup>
import { ref, computed } from 'vue';
import IconUserCircle from '@/components/common/icons/IconUserCircle.vue';

// TODO: 백엔드 API 연동 후 mock 데이터 제거하고 실제 fetch로 교체
const groupPurchases = ref([
  {
    id: 1,
    title: '프리미엄 사료 15kg',
    currentCount: 32,
    targetCount: 50,
    dDay: 'D-3',
    badgeText: '30% 할인',
  },
]);

// 카테고리 필터 (백엔드 연동 예정, 현재는 선택 상태만 관리)
const categories = ['전체', '사료', '영양제', '장난감', '기타'];
const selectedCategory = ref('전체');

function selectCategory(category) {
  selectedCategory.value = category;
}

// 상태 드롭다운 필터: 전체/진행중/마감, 미선택 시 "상태"로 표시 (백엔드 연동 예정)
const statusOptions = ['전체', '진행중', '마감'];
const selectedStatus = ref('');
const isStatusOpen = ref(false);

const statusLabel = computed(() => selectedStatus.value || '상태');

function toggleStatusDropdown() {
  isStatusOpen.value = !isStatusOpen.value;
}

function selectStatus(status) {
  selectedStatus.value = status;
  isStatusOpen.value = false;
}

// 검색어 (백엔드 연동 예정)
const searchKeyword = ref('');
</script>

<template>
  <div
    class="p-(--space-4) pb-[calc(var(--bottom-nav-height)+88px)] bg-(--color-bg) min-h-screen"
  >
    <!-- 헤더 -->
    <header class="flex items-start justify-between mb-(--space-5)">
      <div>
        <h1 class="text-(length:--font-xl) font-bold text-(color:--color-navy)">
          반려동물 용품 공동구매
        </h1>
        <p class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)">
          함께 사면 더 저렴해요
        </p>
      </div>
      <router-link
        to="/group-purchase/my"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-gray-100) no-underline"
      >
        <IconUserCircle :size="24" color="var(--color-navy)" />
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
        v-for="gp in groupPurchases"
        :key="gp.id"
        class="flex items-center justify-between gap-(--space-3) p-(--space-4) bg-(--color-surface) border border-(--color-border) rounded-(--radius-lg)"
      >
        <div>
          <h3 class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
            {{ gp.title }}
          </h3>
          <p class="text-(length:--font-xs) text-(color:--color-gray-500) mb-(--space-2)">
            {{ gp.currentCount }}/{{ gp.targetCount }}명 참여 · {{ gp.dDay }}
          </p>
          <span class="text-(length:--font-xs) font-semibold text-(color:--color-gold)">
            {{ gp.badgeText }}
          </span>
        </div>
        <router-link
          :to="`/group-purchase/${gp.id}`"
          class="shrink-0 px-(--space-4) py-(--space-2) bg-(--color-navy) text-(color:--color-white) rounded-full text-(length:--font-sm) font-semibold no-underline whitespace-nowrap"
        >
          참여하기
        </router-link>
      </li>
    </ul>

    <!-- 글쓰기 버튼 -->
    <router-link
      to="/group-purchase/create/step1"
      class="fixed bottom-[calc(var(--bottom-nav-height)+var(--space-4))] left-(--space-4) right-(--space-4) flex items-center justify-center p-(--space-4) bg-(--color-gold) text-(color:--color-navy) rounded-(--radius-md) text-(length:--font-base) font-bold no-underline shadow-(--shadow-md)"
    >
      + 공동구매 글쓰기
    </router-link>
  </div>
</template>
