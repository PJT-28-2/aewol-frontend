<script setup>
import { useRouter } from 'vue-router'
import IconArrowLeft from './icons/IconArrowLeft.vue'
import AewolLogo from './AewolLogo.vue'

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
  <header
    class="fixed top-0 left-0 right-0 z-100 flex h-[calc(var(--header-height)+env(safe-area-inset-top,0px))] items-center bg-(--color-app-bg) px-(--space-4) pt-[env(safe-area-inset-top,0px)]"
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
        class="flex items-center no-underline"
        aria-label="애월 홈"
      >
        <AewolLogo size="19" />
      </router-link>
    </div>

    <div class="ml-auto flex items-center justify-end">
      <slot name="right" />
    </div>
  </header>
</template>
