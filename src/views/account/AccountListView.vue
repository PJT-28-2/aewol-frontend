<script setup>
import { ref, onMounted } from 'vue'

const accounts = ref([])
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch connected accounts from account store/API
  isLoading.value = false
})
</script>

<template>
  <div class="account-list-page">
    <header class="page-header">
      <h1>연결 계좌</h1>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <div v-else-if="accounts.length === 0" class="empty-state">
      <div class="empty-icon"><!-- TODO: bank icon --></div>
      <p>연결된 계좌가 없습니다.</p>
      <p class="empty-sub">계좌를 연결하고 자동 관리를 시작하세요.</p>
    </div>

    <ul v-else class="account-list">
      <li v-for="account in accounts" :key="account.id" class="account-item card">
        <div class="bank-logo">
          <!-- TODO: implement bank logo by bankCode -->
        </div>
        <div class="account-info">
          <h3>{{ account.bankName }}</h3>
          <p class="account-number">{{ account.accountNumber }}</p>
        </div>
        <p class="account-balance">{{ account.balance?.toLocaleString() }}원</p>
      </li>
    </ul>

    <router-link to="/accounts/connect" class="btn-connect card">
      <span class="plus-icon">+</span>
      <span>계좌 연결하기</span>
    </router-link>
  </div>
</template>

<style scoped>
.account-list-page {
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
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-200);
  margin: 0 auto var(--space-4);
}

.empty-sub {
  font-size: var(--font-sm);
  color: var(--color-gray-400);
  margin-top: var(--space-2);
}

.account-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.account-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.bank-logo {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: var(--color-gray-200);
  flex-shrink: 0;
}

.account-info {
  flex: 1;
}

.account-info h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.account-number {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.account-balance {
  font-size: var(--font-md);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.btn-connect {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--color-navy);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  border: 2px dashed var(--color-gray-300);
  background-color: transparent;
}

.plus-icon {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-gold);
}
</style>
