<script setup>
import { ref, onMounted } from 'vue'

const piggyBalance = ref(0)
const donationHistory = ref([])
const donationAmount = ref(null)
const isLoading = ref(true)
const isDonating = ref(false)

onMounted(async () => {
  // TODO: fetch piggy bank balance and donation history
  isLoading.value = false
})

const handleDonate = async () => {
  // TODO: implement donation
}
</script>

<template>
  <div class="donation-page">
    <header class="page-header">
      <h1>기부 저금통</h1>
    </header>

    <!-- Piggy Bank Balance -->
    <section class="piggy-card card">
      <div class="piggy-icon">
        <!-- TODO: piggy bank illustration -->
      </div>
      <p class="piggy-label">저금통 잔액</p>
      <p class="piggy-balance">{{ piggyBalance.toLocaleString() }}원</p>
    </section>

    <!-- Donate Form -->
    <section class="donate-section card">
      <h2>기부하기</h2>
      <div class="amount-input-group">
        <input
          v-model.number="donationAmount"
          type="number"
          placeholder="기부할 금액"
          min="100"
        />
        <span class="currency">원</span>
      </div>
      <div class="quick-amounts">
        <button @click="donationAmount = 1000">1,000원</button>
        <button @click="donationAmount = 5000">5,000원</button>
        <button @click="donationAmount = 10000">10,000원</button>
        <button @click="donationAmount = piggyBalance">전액</button>
      </div>
      <button
        class="btn-donate"
        :disabled="isDonating || !donationAmount || donationAmount <= 0"
        @click="handleDonate"
      >
        {{ isDonating ? '기부 중...' : '기부하기' }}
      </button>
    </section>

    <!-- Donation History -->
    <section class="history-section">
      <h2>기부 내역</h2>

      <div v-if="donationHistory.length === 0" class="empty-state">
        <p>아직 기부 내역이 없습니다.</p>
      </div>

      <ul v-else class="history-list">
        <li v-for="item in donationHistory" :key="item.id" class="history-item card">
          <div class="history-info">
            <h3>{{ item.organizationName }}</h3>
            <p class="history-date">{{ item.date }}</p>
          </div>
          <p class="history-amount">{{ item.amount?.toLocaleString() }}원</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.donation-page {
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

.piggy-card {
  text-align: center;
  margin-bottom: var(--space-5);
  background: linear-gradient(135deg, var(--color-gold), var(--color-gold-light));
  color: var(--color-white);
}

.piggy-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background-color: rgba(255, 255, 255, 0.3);
  margin: 0 auto var(--space-3);
}

.piggy-label {
  font-size: var(--font-sm);
  opacity: 0.9;
}

.piggy-balance {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  margin-top: var(--space-2);
}

.donate-section {
  margin-bottom: var(--space-6);
}

.donate-section h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

.amount-input-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.amount-input-group input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  text-align: right;
  box-sizing: border-box;
}

.currency {
  font-size: var(--font-lg);
  color: var(--color-gray-600);
}

.quick-amounts {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.quick-amounts button {
  flex: 1;
  padding: var(--space-2);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-sm);
  background: var(--color-white);
  font-size: var(--font-xs);
  color: var(--color-gray-600);
  cursor: pointer;
}

.btn-donate {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-gold);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: var(--font-bold);
  cursor: pointer;
}

.btn-donate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.history-section h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

.empty-state {
  text-align: center;
  padding: var(--space-5) 0;
  color: var(--color-gray-500);
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-info h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.history-date {
  font-size: var(--font-xs);
  color: var(--color-gray-400);
  margin-top: var(--space-1);
}

.history-amount {
  font-size: var(--font-md);
  font-weight: var(--font-bold);
  color: var(--color-gold);
}
</style>
