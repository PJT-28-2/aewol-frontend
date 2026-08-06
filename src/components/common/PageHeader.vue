<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHeaderBackHandler } from '@/composables/useHeaderBack'
import { useNotificationStore } from '@/stores/notification'
import IconArrowLeft from './icons/IconArrowLeft.vue'
import IconNotificationBell from './icons/IconNotificationBell.vue'
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
const route = useRoute()
const backHandler = useHeaderBackHandler()
const notificationStore = useNotificationStore()

const isHome = computed(() => route.name === 'Home')
// 회색 배경(--color-gray-100)을 쓰는 화면은 헤더도 같은 색으로 이어지게 한다
const mutedBgRoutes = ['Home', 'Wallet', 'Dashboard', 'TransactionDetail']
const isMutedHeader = computed(() => mutedBgRoutes.includes(route.name))

function goBack() {
  if (backHandler.value) {
    backHandler.value()
    return
  }
  router.back()
}
</script>

<template>
  <header
    class="page-header"
    :class="{ 'page-header--muted': isMutedHeader }"
  >
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
      <router-link
        v-if="isHome"
        to="/settings/notifications"
        class="page-header__bell"
        aria-label="알림"
      >
        <IconNotificationBell
          size="20"
          color="var(--color-navy)"
        />
        <span
          v-if="notificationStore.unreadCount > 0"
          class="page-header__bell-badge"
        />
      </router-link>
      <slot
        v-else
        name="right"
      />
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
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-4);
  background-color: var(--color-white);
}

.page-header--muted {
  background-color: var(--color-gray-100);
}

.page-header__bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  color: var(--color-navy);
}

.page-header__bell:active {
  background-color: var(--color-gray-100);
}

.page-header__bell-badge {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background-color: var(--color-danger);
  border: 1.5px solid var(--color-white);
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
