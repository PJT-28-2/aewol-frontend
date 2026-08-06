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
    class="fixed top-0 left-0 right-0 z-100 flex items-center justify-between h-(--header-height) px-(--space-4)"
    :class="isMutedHeader ? 'bg-(--color-gray-100)' : 'bg-(--color-white)'"
  >
    <div class="flex-none flex items-center justify-start">
      <button
        v-if="showBack"
        class="flex items-center justify-center w-[40px] h-[40px] rounded-(--radius-full) text-(color:--color-gray-900) transition-colors hover:bg-(--color-gray-100)"
        aria-label="뒤로 가기"
        @click="goBack"
      >
        <IconArrowLeft size="24" />
      </button>
      <img
        v-else
        :src="aewolWordmark"
        alt="애월"
        class="h-[28px] w-auto object-contain"
      />
    </div>

    <h1
      v-if="title"
      class="flex-1 text-center text-(length:--font-lg) font-semibold text-(color:--color-gray-900) overflow-hidden text-ellipsis whitespace-nowrap"
    >
      {{ title }}
    </h1>

    <div class="flex-[0_0_48px] flex items-center justify-end">
      <router-link
        v-if="isHome"
        to="/settings/notifications"
        class="relative flex items-center justify-center w-[40px] h-[40px] rounded-(--radius-full) text-(color:--color-navy) active:bg-(--color-gray-100)"
        aria-label="알림"
      >
        <IconNotificationBell
          size="20"
          color="var(--color-navy)"
        />
        <span
          v-if="notificationStore.unreadCount > 0"
          class="absolute top-[9px] right-[10px] w-[7px] h-[7px] rounded-(--radius-full) bg-(--color-danger) border-[1.5px] border-(--color-white)"
        />
      </router-link>
      <slot
        v-else
        name="right"
      />
    </div>
  </header>
</template>
