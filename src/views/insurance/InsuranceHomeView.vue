<script setup>
import IconCalculator from '@/components/common/icons/IconCalculator.vue'
import IconCertificate from '@/components/common/icons/IconCertificate.vue'

const menus = [
  {
    to: '/insurance/simulator',
    icon: IconCalculator,
    tone: 'gold',
    title: '손익분기 시뮬레이터',
    description: '가입이 유리한지 미리 계산해보세요',
  },
  {
    to: '/insurance/claim',
    icon: IconCertificate,
    tone: 'navy',
    title: '보험금 청구 서류 작성',
    description: '영수증으로 청구서 초안을 만들어보세요',
  },
]
</script>

<template>
  <div class="insurance-page">
    <header class="page-header">
      <h1>보험</h1>
      <p class="page-description">
        필요한 메뉴를 선택하세요
      </p>
    </header>

    <ul class="menu-list">
      <li
        v-for="menu in menus"
        :key="menu.to"
      >
        <router-link
          :to="menu.to"
          class="menu-card"
        >
          <span
            class="menu-icon"
            aria-hidden="true"
            :class="`menu-icon--${menu.tone}`"
          >
            <component
              :is="menu.icon"
              :size="22"
            />
          </span>

          <span class="menu-text">
            <strong class="menu-title">{{ menu.title }}</strong>
            <span class="menu-description">{{ menu.description }}</span>
          </span>

          <span
            class="chevron"
            aria-hidden="true"
          >&rsaquo;</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.insurance-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.page-description {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  margin-top: var(--space-2);
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.menu-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
}

.menu-icon {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon--gold {
  background-color: rgba(217, 154, 43, 0.15);
  color: var(--color-gold);
}

.menu-icon--navy {
  background-color: rgba(27, 42, 73, 0.08);
  color: var(--color-navy);
}

.menu-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.menu-title {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.menu-description {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
}

.chevron {
  flex: 0 0 auto;
  font-size: var(--font-xl);
  color: var(--color-gray-400);
}
</style>
