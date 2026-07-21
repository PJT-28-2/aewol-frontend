<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { path: '/home', label: '홈', icon: '\u{1F3E0}' },
  { path: '/pets', label: '반려동물', icon: '\u{1F43E}' },
  { path: '/wallet', label: '지갑', icon: '\u{1F4B0}' },
  { path: '/dashboard', label: '대시보드', icon: '\u{1F4CA}' },
  { path: '/settings', label: '설정', icon: '\u2699\uFE0F' },
]

function isActive(path) {
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="bottom-nav__tab"
      :class="{ 'bottom-nav__tab--active': isActive(tab.path) }"
    >
      <span class="bottom-nav__icon">{{ tab.icon }}</span>
      <span class="bottom-nav__label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: var(--bottom-nav-height);
  background-color: var(--color-white);
  border-top: 1px solid var(--color-gray-200);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-nav__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  gap: var(--space-1);
  color: var(--color-gray-500);
  transition: color 0.2s;
}

.bottom-nav__tab--active {
  color: var(--color-gold);
}

.bottom-nav__icon {
  font-size: var(--font-xl);
  line-height: 1;
}

.bottom-nav__label {
  font-size: var(--font-xs);
  font-weight: var(--font-medium);
}
</style>
