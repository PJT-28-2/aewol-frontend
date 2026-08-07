<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHeaderBackHandler } from '@/composables/useHeaderBack'
import { useNotificationStore } from '@/stores/notification'
import IconArrowLeft from './icons/IconArrowLeft.vue'
import IconNotificationBell from './icons/IconNotificationBell.vue'

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
const mutedBgRoutes = [
  'Home',
  'Wallet',
  'Dashboard',
  'TransactionDetail',
  'InsuranceHome',
  'PetList',
  'Simulator',
  'Claim',
  'ClaimPdfDraft',
  'Settings',
  'PetProfilePhoto',
]
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
    :class="isMutedHeader ? 'bg-(--color-app-bg)' : 'bg-(--color-white)'"
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
      <router-link
        v-else
        to="/home"
        class="flex items-end text-[19px] leading-none font-bold tracking-[-0.045em] text-(color:--color-gray-900) no-underline"
        aria-label="애월 홈"
      >
        AEWOL
      </router-link>
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
        class="relative flex size-[40px] items-center justify-center text-(color:--color-gray-900)"
        aria-label="알림"
      >
        <IconNotificationBell
          size="22"
          color="var(--color-gray-900)"
        />
        <span
          v-if="notificationStore.unreadCount > 0"
          class="absolute right-[7px] top-[6px] size-[7px] rounded-(--radius-full) border-[1.5px] border-(--color-app-bg) bg-(--color-danger)"
        />
      </router-link>
      <slot
        v-else
        name="right"
      />
    </div>
  </header>
</template>
