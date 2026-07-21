<script setup>
import { ref, onMounted } from 'vue'

const transactions = ref([])
const isLoading = ref(true)

const filters = ref({
  startDate: '',
  endDate: '',
  category: '',
  petId: '',
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
  // TODO: fetch transactions from wallet store/API
  isLoading.value = false
})

const handleFilter = async () => {
  // TODO: implement filtered transaction fetch
}
</script>

<template>
  <div class="transaction-page">
    <header class="page-header">
      <router-link to="/wallet" class="back-btn">&lsaquo; 지갑</router-link>
      <h1>거래 내역</h1>
    </header>

    <!-- Filters -->
    <section class="filters card">
      <div class="filter-row">
        <div class="filter-item">
          <label for="startDate">시작일</label>
          <input id="startDate" v-model="filters.startDate" type="date" />
        </div>
        <div class="filter-item">
          <label for="endDate">종료일</label>
          <input id="endDate" v-model="filters.endDate" type="date" />
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label for="category">카테고리</label>
          <select id="category" v-model="filters.category">
            <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <!-- TODO: implement pet filter dropdown -->
      </div>
      <button class="btn-filter" @click="handleFilter">필터 적용</button>
    </section>

    <!-- Transaction List -->
    <section class="transaction-section">
      <div v-if="isLoading" class="loading-state">
        <p>로딩 중...</p>
      </div>

      <div v-else-if="transactions.length === 0" class="empty-state">
        <p>거래 내역이 없습니다.</p>
      </div>

      <ul v-else class="transaction-list">
        <li v-for="tx in transactions" :key="tx.id" class="transaction-item card">
          <div class="tx-info">
            <h3>{{ tx.description }}</h3>
            <p class="tx-meta">
              <span class="tx-category">{{ tx.category }}</span>
              <span v-if="tx.petName"> &middot; {{ tx.petName }}</span>
            </p>
            <p class="tx-date">{{ tx.date }}</p>
          </div>
          <p class="tx-amount" :class="{ income: tx.amount > 0, expense: tx.amount < 0 }">
            {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount.toLocaleString() }}원
          </p>
        </li>
      </ul>
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

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.transaction-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tx-info {
  flex: 1;
}

.tx-info h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.tx-meta {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.tx-category {
  background-color: var(--color-gray-100);
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
}

.tx-date {
  font-size: var(--font-xs);
  color: var(--color-gray-400);
  margin-top: var(--space-1);
}

.tx-amount {
  font-size: var(--font-base);
  font-weight: var(--font-bold);
  white-space: nowrap;
  margin-left: var(--space-4);
}

.tx-amount.income {
  color: var(--color-success);
}

.tx-amount.expense {
  color: var(--color-danger);
}
</style>
