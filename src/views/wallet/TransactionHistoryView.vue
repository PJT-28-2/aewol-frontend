<script setup>
import { computed, ref, onMounted } from 'vue'
import TransactionList from '@/components/common/TransactionList.vue'

const transactions = ref([])
const isLoading = ref(true)
const isError = ref(false)

const filters = ref({
  startDate: '',
  endDate: '',
  category: '',
  petId: '',
})

// 필터 적용 버튼을 눌렀을 때만 반영되는 실제 필터 조건
const appliedFilters = ref({ ...filters.value })

const filteredTransactions = computed(() => {
  return transactions.value.filter((tx) => {
    const matchesStart =
      !appliedFilters.value.startDate ||
      tx.date >= appliedFilters.value.startDate
    const matchesEnd =
      !appliedFilters.value.endDate ||
      tx.date <= appliedFilters.value.endDate
    const matchesCategory =
      !appliedFilters.value.category ||
      tx.category === appliedFilters.value.category
    return matchesStart && matchesEnd && matchesCategory
  })
})

const categoryOptions = [
  { value: '', label: '전체' },
  { value: 'FOOD', label: '사료/간식' },
  { value: 'MEDICAL', label: '의료' },
  { value: 'GROOMING', label: '미용' },
  { value: 'SUPPLIES', label: '용품' },
  { value: 'INSURANCE', label: '보험' },
  { value: 'ETC', label: '기타' },
]

onMounted(async () => {
  try {
    // TODO: fetch transactions from wallet store/API
  } catch {
    isError.value = true
  } finally {
    isLoading.value = false
  }
})

function handleFilter() {
  appliedFilters.value = { ...filters.value }
}
</script>

<template>
  <div class="transaction-page">
    <header class="page-header">
      <router-link
        to="/wallet"
        class="back-btn"
      >
        &lsaquo; 지갑
      </router-link>
      <h1>거래 내역</h1>
    </header>

    <!-- Filters -->
    <section class="filters card">
      <div class="filter-row">
        <div class="filter-item">
          <label for="startDate">시작일</label>
          <input
            id="startDate"
            v-model="filters.startDate"
            type="date"
          >
        </div>
        <div class="filter-item">
          <label for="endDate">종료일</label>
          <input
            id="endDate"
            v-model="filters.endDate"
            type="date"
          >
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label for="category">카테고리</label>
          <select
            id="category"
            v-model="filters.category"
          >
            <option
              v-for="opt in categoryOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
        <!-- TODO: implement pet filter dropdown -->
      </div>
      <button
        class="btn-filter"
        @click="handleFilter"
      >
        필터 적용
      </button>
    </section>

    <!-- Transaction List -->
    <section class="transaction-section">
      <div
        v-if="isLoading"
        class="loading-state"
      >
        <p>로딩 중...</p>
      </div>

      <div
        v-else-if="isError"
        class="loading-state"
      >
        <p>거래 내역을 불러오지 못했습니다.</p>
      </div>

      <TransactionList
        v-else
        :transactions="filteredTransactions"
      />
    </section>
  </div>
</template>

<style scoped>
.transaction-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.back-btn {
  font-size: var(--font-md);
  color: var(--color-navy);
  text-decoration: none;
  font-weight: var(--font-medium);
}

.page-header h1 {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.filters {
  margin-bottom: var(--space-5);
}

.filter-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.filter-item {
  flex: 1;
}

.filter-item label {
  display: block;
  font-size: var(--font-xs);
  font-weight: var(--font-medium);
  color: var(--color-gray-600);
  margin-bottom: var(--space-1);
}

.filter-item input,
.filter-item select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  box-sizing: border-box;
}

.btn-filter {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}
</style>
