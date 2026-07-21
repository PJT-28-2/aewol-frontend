<script setup>
import { ref, onMounted } from 'vue'

const wallet = ref({
  totalBalance: 0,
  availableBalance: 0,
})
const buckets = ref([])
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch wallet data from wallet store/API
  isLoading.value = false
})

const handleDeposit = () => {
  // TODO: implement deposit flow
}

const handleWithdraw = () => {
  // TODO: implement withdraw flow
}
</script>

<template>
  <div class="wallet-page">
    <header class="page-header">
      <h1>내 지갑</h1>
    </header>

    <!-- Balance Card -->
    <section class="balance-card card">
      <p class="balance-label">총 잔액</p>
      <p class="balance-amount">{{ wallet.totalBalance.toLocaleString() }}원</p>
      <p class="available-label">
        사용 가능: <strong>{{ wallet.availableBalance.toLocaleString() }}원</strong>
      </p>
      <div class="balance-actions">
        <button class="btn-deposit" @click="handleDeposit">입금</button>
        <button class="btn-withdraw" @click="handleWithdraw">출금</button>
      </div>
    </section>

    <!-- Bucket List -->
    <section class="bucket-section">
      <div class="section-header">
        <h2>버킷 목록</h2>
        <router-link to="/wallet/buckets" class="btn-manage">관리</router-link>
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>로딩 중...</p>
      </div>

      <div v-else-if="buckets.length === 0" class="empty-state">
        <p>생성된 버킷이 없습니다.</p>
        <router-link to="/wallet/buckets" class="btn-link">버킷 만들기</router-link>
      </div>

      <ul v-else class="bucket-list">
        <li v-for="bucket in buckets" :key="bucket.id" class="bucket-item card">
          <div class="bucket-info">
            <h3>{{ bucket.name }}</h3>
            <p class="bucket-pet">{{ bucket.petName }}</p>
          </div>
          <div class="bucket-balance">
            <p class="bucket-amount">{{ bucket.balance.toLocaleString() }}원</p>
            <!-- TODO: implement progress bar for goal -->
          </div>
        </li>
      </ul>
    </section>

    <!-- Transaction Link -->
    <router-link to="/wallet/transactions" class="transaction-link card">
      <span>거래 내역 보기</span>
      <span class="chevron">&rsaquo;</span>
    </router-link>
  </div>
</template>

<style scoped>
.wallet-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  margin-bottom: var(--space-5);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.balance-card {
  background: linear-gradient(135deg, var(--color-navy), var(--color-navy-light));
  color: var(--color-white);
  margin-bottom: var(--space-6);
}

.balance-label {
  font-size: var(--font-sm);
  opacity: 0.8;
}

.balance-amount {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  margin: var(--space-2) 0;
}

.available-label {
  font-size: var(--font-sm);
  opacity: 0.7;
}

.available-label strong {
  opacity: 1;
}

.balance-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.btn-deposit,
.btn-withdraw {
  flex: 1;
  padding: var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.btn-deposit {
  background-color: var(--color-gold);
  color: var(--color-white);
}

.btn-withdraw {
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--color-white);
}

.bucket-section {
  margin-bottom: var(--space-5);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-header h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
}

.btn-manage {
  font-size: var(--font-sm);
  color: var(--color-gold);
  font-weight: var(--font-semibold);
  text-decoration: none;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-6) 0;
  color: var(--color-gray-500);
}

.btn-link {
  display: inline-block;
  margin-top: var(--space-3);
  color: var(--color-navy);
  font-weight: var(--font-semibold);
  text-decoration: none;
  font-size: var(--font-sm);
}

.bucket-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bucket-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bucket-info h3 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.bucket-pet {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.bucket-amount {
  font-size: var(--font-base);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.transaction-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  color: var(--color-gray-700);
  font-size: var(--font-md);
  font-weight: var(--font-medium);
}

.chevron {
  font-size: var(--font-xl);
  color: var(--color-gray-400);
}
</style>
