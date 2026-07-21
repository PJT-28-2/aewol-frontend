<script setup>
import { ref, onMounted } from 'vue'

const user = ref({
  name: '',
  email: '',
  phone: '',
})
const notifications = ref({
  payment: true,
  insurance: true,
  groupPurchase: true,
  support: false,
})
const linkedAccounts = ref([])
const isLoading = ref(true)

onMounted(async () => {
  // TODO: fetch user profile and settings from store/API
  isLoading.value = false
})

const handleSaveNotifications = async () => {
  // TODO: implement notification settings update
}

const handleLogout = async () => {
  // TODO: implement logout
}
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <h1>설정</h1>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>로딩 중...</p>
    </div>

    <template v-else>
      <!-- Profile Section -->
      <section class="section card">
        <h2>프로필</h2>
        <div class="profile-info">
          <div class="profile-avatar">
            <!-- TODO: user avatar -->
          </div>
          <div class="profile-details">
            <p class="profile-name">{{ user.name || '이름 없음' }}</p>
            <p class="profile-email">{{ user.email }}</p>
            <p class="profile-phone">{{ user.phone }}</p>
          </div>
        </div>
        <!-- TODO: implement profile edit -->
      </section>

      <!-- Notification Settings -->
      <section class="section card">
        <h2>알림 설정</h2>
        <div class="toggle-list">
          <div class="toggle-item">
            <span>결제 알림</span>
            <label class="switch">
              <input type="checkbox" v-model="notifications.payment" @change="handleSaveNotifications" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <span>보험 알림</span>
            <label class="switch">
              <input type="checkbox" v-model="notifications.insurance" @change="handleSaveNotifications" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <span>공동구매 알림</span>
            <label class="switch">
              <input type="checkbox" v-model="notifications.groupPurchase" @change="handleSaveNotifications" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <span>지원 프로그램 알림</span>
            <label class="switch">
              <input type="checkbox" v-model="notifications.support" @change="handleSaveNotifications" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- Linked Accounts -->
      <section class="section card">
        <h2>연결된 계좌</h2>
        <div v-if="linkedAccounts.length === 0" class="empty-inline">
          <p>연결된 계좌가 없습니다.</p>
        </div>
        <ul v-else class="account-list">
          <li v-for="account in linkedAccounts" :key="account.id" class="account-item">
            <span>{{ account.bankName }}</span>
            <span class="account-number">{{ account.accountNumber }}</span>
          </li>
        </ul>
        <router-link to="/accounts" class="settings-link">계좌 관리 &rsaquo;</router-link>
      </section>

      <!-- Danger Zone -->
      <section class="section">
        <button class="btn-logout" @click="handleLogout">로그아웃</button>
        <router-link to="/settings/withdraw" class="withdraw-link">회원 탈퇴</router-link>
      </section>
    </template>
  </div>
</template>

<style scoped>
.settings-page {
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

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.section {
  margin-bottom: var(--space-5);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.section h2 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

.profile-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-200);
  flex-shrink: 0;
}

.profile-name {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.profile-email {
  font-size: var(--font-sm);
  color: var(--color-gray-600);
  margin-top: var(--space-1);
}

.profile-phone {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.toggle-list {
  display: flex;
  flex-direction: column;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: var(--font-md);
  color: var(--color-gray-700);
}

.toggle-item:last-child {
  border-bottom: none;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-gray-300);
  border-radius: var(--radius-full);
  transition: 0.3s;
}

.slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--color-white);
  border-radius: var(--radius-full);
  transition: 0.3s;
}

.switch input:checked + .slider {
  background-color: var(--color-navy);
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

.empty-inline {
  padding: var(--space-3) 0;
  color: var(--color-gray-500);
  font-size: var(--font-sm);
}

.account-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-3);
}

.account-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  font-size: var(--font-sm);
  color: var(--color-gray-700);
  border-bottom: 1px solid var(--color-gray-100);
}

.account-number {
  color: var(--color-gray-500);
}

.settings-link {
  display: block;
  font-size: var(--font-sm);
  color: var(--color-navy);
  text-decoration: none;
  font-weight: var(--font-medium);
  margin-top: var(--space-2);
}

.btn-logout {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  color: var(--color-gray-700);
  cursor: pointer;
  margin-bottom: var(--space-4);
}

.withdraw-link {
  display: block;
  text-align: center;
  font-size: var(--font-sm);
  color: var(--color-danger);
  text-decoration: none;
}
</style>
