<script setup>
import { ref, onMounted } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconInsurance from '@/components/common/icons/IconInsurance.vue'

const claims = ref([])
const isLoading = ref(true)
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: '전체' },
  { value: 'DRAFT', label: '임시저장' },
  { value: 'SUBMITTED', label: '제출됨' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '거절' },
]

const statusLabels = {
  DRAFT: '임시저장',
  SUBMITTED: '제출됨',
  APPROVED: '승인',
  REJECTED: '거절',
}

onMounted(async () => {
  // TODO: fetch claims list from insurance store/API
  isLoading.value = false
})

const handleFilterChange = async () => {
  // TODO: re-fetch filtered claims
}
</script>

<template>
  <div class="claim-list-page">
    <header class="page-header">
      <h1>청구 내역</h1>
      <router-link
        to="/insurance/claim"
        class="btn-new"
      >
        + 새 청구
      </router-link>
    </header>

    <!-- Status Filter -->
    <div class="filter-bar">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        :class="['filter-chip', { active: statusFilter === opt.value }]"
        @click="statusFilter = opt.value; handleFilterChange()"
      >
        {{ opt.label }}
      </button>
    </div>

    <div
      v-if="isLoading"
      class="loading-state"
    >
      <LoadingSpinner />
    </div>

    <EmptyState
      v-else-if="claims.length === 0"
      :icon="IconInsurance"
      message="청구 내역이 없어요."
      action-text="보험 청구하기"
      action-route="/insurance/claim"
    />

    <ul
      v-else
      class="claim-list"
    >
      <li
        v-for="claim in claims"
        :key="claim.id"
        class="claim-item card"
      >
        <div class="claim-info">
          <div class="claim-header">
            <h3>{{ claim.merchantName }}</h3>
            <span :class="['status-badge', `status-${claim.status?.toLowerCase()}`]">
              {{ statusLabels[claim.status] || claim.status }}
            </span>
          </div>
          <p class="claim-amount">
            {{ claim.amount?.toLocaleString() }}원
          </p>
          <p class="claim-date">
            {{ claim.date }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.claim-list-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.btn-new {
  font-size: var(--font-sm);
  color: var(--color-gold);
  font-weight: var(--font-semibold);
  text-decoration: none;
}

.filter-bar {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  overflow-x: auto;
}

.filter-chip {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-full);
  background: var(--color-white);
  font-size: var(--font-sm);
  color: var(--color-gray-600);
  cursor: pointer;
  white-space: nowrap;
}

.filter-chip.active {
  background-color: var(--color-navy);
  color: var(--color-white);
  border-color: var(--color-navy);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.claim-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.claim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.claim-header h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.status-badge {
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}

.status-draft {
  background-color: var(--color-gray-200);
  color: var(--color-gray-600);
}

.status-submitted {
  background-color: var(--color-status-info-bg);
  color: var(--color-info);
}

.status-approved {
  background-color: var(--color-status-success-bg);
  color: var(--color-success);
}

.status-rejected {
  background-color: var(--color-status-danger-bg);
  color: var(--color-danger);
}

.claim-amount {
  font-size: var(--font-base);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.claim-date {
  font-size: var(--font-xs);
  color: var(--color-gray-400);
  margin-top: var(--space-1);
}
</style>
