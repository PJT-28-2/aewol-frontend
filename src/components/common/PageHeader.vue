<script setup>
import { useRouter } from 'vue-router'
import { useHeaderBackHandler } from '@/composables/useHeaderBack'
import IconArrowLeft from './icons/IconArrowLeft.vue'
import aewolWordmark from '@/assets/images/aewol-wordmark.png'

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
const backHandler = useHeaderBackHandler()

function goBack() {
  if (backHandler.value) {
    backHandler.value()
    return
  }
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
        <IconArrowLeft size="24" />
      </button>
      <img
        v-else
        :src="aewolWordmark"
        alt="애월"
        class="page-header__logo"
      />
    </div>

    <h1 v-if="title" class="page-header__title">{{ title }}</h1>

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
}

.page-header__left {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.page-header__right {
  flex: 0 0 48px;
  display: flex;
  align-items: center;
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

.page-header__logo {
  height: 28px;
  width: auto;
  object-fit: contain;
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
