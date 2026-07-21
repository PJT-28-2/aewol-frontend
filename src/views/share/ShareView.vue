<script setup>
import { ref, onMounted } from 'vue'

const members = ref([])
const inviteEmail = ref('')
const contributionStats = ref([])
const isLoading = ref(true)
const isInviting = ref(false)

onMounted(async () => {
  // TODO: fetch shared wallet members and contribution stats
  isLoading.value = false
})

const handleInvite = async () => {
  // TODO: implement member invite
}

const handleRemoveMember = async (memberId) => {
  // TODO: implement member removal with confirmation
}
</script>

<template>
  <div class="share-page">
    <header class="page-header">
      <h1>공유 지갑</h1>
    </header>

    <!-- Invite Form -->
    <section class="invite-section card">
      <h2>멤버 초대</h2>
      <form class="invite-form" @submit.prevent="handleInvite">
        <input
          v-model="inviteEmail"
          type="email"
          placeholder="초대할 이메일 주소"
          required
        />
        <button type="submit" class="btn-invite" :disabled="isInviting">
          {{ isInviting ? '초대 중...' : '초대' }}
        </button>
      </form>
    </section>

    <!-- Members List -->
    <section class="members-section">
      <h2>멤버 목록</h2>

      <div v-if="isLoading" class="loading-state">
        <p>로딩 중...</p>
      </div>

      <div v-else-if="members.length === 0" class="empty-state">
        <p>아직 멤버가 없습니다.</p>
      </div>

      <ul v-else class="member-list">
        <li v-for="member in members" :key="member.id" class="member-item card">
          <div class="member-avatar">
            <!-- TODO: member avatar -->
          </div>
          <div class="member-info">
            <h3>{{ member.name }}</h3>
            <p class="member-email">{{ member.email }}</p>
          </div>
          <span class="member-role">{{ member.role === 'OWNER' ? '소유자' : '멤버' }}</span>
        </li>
      </ul>
    </section>

    <!-- Contribution Stats -->
    <section class="stats-section">
      <h2>기여 통계</h2>

      <div v-if="contributionStats.length === 0" class="empty-state">
        <p>기여 내역이 없습니다.</p>
      </div>

      <ul v-else class="stats-list">
        <li v-for="stat in contributionStats" :key="stat.memberId" class="stat-item card">
          <span class="stat-name">{{ stat.name }}</span>
          <div class="stat-bar-wrapper">
            <div class="stat-bar" :style="{ width: `${stat.percentage}%` }"></div>
          </div>
          <span class="stat-amount">{{ stat.amount?.toLocaleString() }}원</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.share-page {
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

.invite-section {
  margin-bottom: var(--space-6);
}

.invite-section h2 {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-3);
}

.invite-form {
  display: flex;
  gap: var(--space-3);
}

.invite-form input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  box-sizing: border-box;
}

.btn-invite {
  padding: var(--space-3) var(--space-5);
  background-color: var(--color-navy);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  cursor: pointer;
  white-space: nowrap;
}

.btn-invite:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.members-section,
.stats-section {
  margin-bottom: var(--space-6);
}

.members-section h2,
.stats-section h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-5) 0;
  color: var(--color-gray-500);
}

.member-list,
.stats-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.member-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: var(--color-gray-200);
  flex-shrink: 0;
}

.member-info {
  flex: 1;
}

.member-info h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.member-email {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.member-role {
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  color: var(--color-gold);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-name {
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  min-width: 60px;
}

.stat-bar-wrapper {
  flex: 1;
  height: 8px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.stat-bar {
  height: 100%;
  background-color: var(--color-gold);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.stat-amount {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gray-800);
  min-width: 80px;
  text-align: right;
}
</style>
