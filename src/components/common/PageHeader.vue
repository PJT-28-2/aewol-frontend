<script setup>
import { useRouter } from 'vue-router'

defineProps({
  title: {
    type: String,
    default: '',
  },
  showBack: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <header class="page-header">
    <div class="page-header__left">
      <button
        v-if="showBack"
        class="page-header__back"
        aria-label="뒤로 가기"
        @click="goBack"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </div>

    <h1 class="page-header__title">{{ title }}</h1>

    <div class="page-header__right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0 var(--space-4);
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
}

.page-header__left,
.page-header__right {
  flex: 0 0 48px;
  display: flex;
  align-items: center;
}

.page-header__left {
  justify-content: flex-start;
}

.page-header__right {
  justify-content: flex-end;
}

.page-header__title {
  flex: 1;
  text-align: center;
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  color: var(--color-gray-900);
  transition: background-color 0.2s;
}

.page-header__back:hover {
  background-color: var(--color-gray-100);
}
</style>
