<script setup>
import { ref, computed } from 'vue'
import IconUser from '@/components/common/icons/IconUser.vue'

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
])

// 카테고리 필터 (백엔드 연동 예정, 현재는 선택 상태만 관리)
const categories = ['전체', '사료', '영양제', '장난감', '기타']
const selectedCategory = ref('전체')

function selectCategory(category) {
  selectedCategory.value = category
}

// 상태 드롭다운 필터: 전체/진행중/마감, 미선택 시 "상태"로 표시 (백엔드 연동 예정)
const statusOptions = ['전체', '진행중', '마감']
const selectedStatus = ref('')
const isStatusOpen = ref(false)

const statusLabel = computed(() => selectedStatus.value || '상태')

function toggleStatusDropdown() {
  isStatusOpen.value = !isStatusOpen.value
}

function selectStatus(status) {
  selectedStatus.value = status
  isStatusOpen.value = false
}

// 검색어 (백엔드 연동 예정)
const searchKeyword = ref('')
</script>

<template>
  <div class="gp-list-page">
    <!-- 헤더 -->
    <header class="gp-header">
      <div class="gp-header__text">
        <h1>반려동물 용품 공동구매</h1>
        <p>함께 사면 더 저렴해요</p>
      </div>
      <router-link to="/group-purchase/my" class="gp-my-btn">
        <IconUser :size="12" color="var(--color-white)" />
        MY
      </router-link>
    </header>

    <!-- 필터 영역 -->
    <section class="gp-filter-section">
      <div class="gp-filter-row">
        <span class="gp-filter-label">카테고리</span>

        <div class="gp-status-dropdown">
          <button
            type="button"
            class="gp-status-btn"
            @click="toggleStatusDropdown"
          >
            {{ statusLabel }}
            <span class="gp-status-arrow">▾</span>
          </button>
          <ul v-if="isStatusOpen" class="gp-status-menu">
            <li v-for="option in statusOptions" :key="option">
              <button type="button" @click="selectStatus(option)">
                {{ option }}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="gp-category-chips">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="gp-chip"
          :class="{ 'gp-chip--active': selectedCategory === category }"
          @click="selectCategory(category)"
        >
          {{ category }}
        </button>
      </div>

      <div class="gp-search">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="상품명으로 검색해보세요"
        />
      </div>
    </section>

    <!-- 공동구매 목록 -->
    <ul class="gp-list">
      <li v-for="gp in groupPurchases" :key="gp.id" class="gp-card">
        <div class="gp-card__info">
          <h3>{{ gp.title }}</h3>
          <p class="gp-card__meta">
            {{ gp.currentCount }}/{{ gp.targetCount }}명 참여 · {{ gp.dDay }}
          </p>
          <span class="gp-card__badge">{{ gp.badgeText }}</span>
        </div>
        <router-link :to="`/group-purchase/${gp.id}`" class="gp-card__join-btn">
          참여하기
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.gp-list-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.gp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.gp-header__text h1 {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.gp-header__text p {
  font-size: var(--font-sm);
  color: var(--color-slate-muted);
  margin-top: var(--space-1);
}

.gp-my-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-navy);
  color: var(--color-white);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  text-decoration: none;
}

.gp-filter-section {
  margin-bottom: var(--space-5);
}

.gp-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.gp-filter-label {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gray-700);
}

.gp-status-dropdown {
  position: relative;
}

.gp-status-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  cursor: pointer;
}

.gp-status-arrow {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
}

.gp-status-menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  z-index: 10;
  min-width: 96px;
  list-style: none;
  margin: 0;
  padding: var(--space-1);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.gp-status-menu li button {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  text-align: left;
  font-size: var(--font-sm);
  color: var(--color-gray-700);
  cursor: pointer;
}

.gp-status-menu li button:hover {
  background-color: var(--color-gray-100);
}

.gp-category-chips {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  margin-bottom: var(--space-3);
}

.gp-chip {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-600);
  cursor: pointer;
}

.gp-chip--active {
  background-color: var(--color-navy);
  border-color: var(--color-navy);
  color: var(--color-white);
}

.gp-search input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--color-gray-700);
}

.gp-search input::placeholder {
  color: var(--color-gray-500);
}

.gp-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.gp-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.gp-card__info h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-1);
}

.gp-card__meta {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  margin-bottom: var(--space-2);
}

.gp-card__badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background-color: var(--color-gold-light);
  color: var(--color-navy);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
}

.gp-card__join-btn {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-navy);
  color: var(--color-white);
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  text-decoration: none;
  white-space: nowrap;
}
</style>
