<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import EmptyState from '@/components/common/EmptyState.vue'
import IconNotificationBell from '@/components/common/icons/IconNotificationBell.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'

const store = useNotificationStore()
const { notifications, unreadCount } = storeToRefs(store)
const sortedNotifications = computed(() => [...notifications.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
const formatTime = (value) => new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) px-(--space-5) py-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-8))]">
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        알림함
      </h1>
      <p class="mt-(--space-1) text-(length:--font-md) text-(color:--color-slate-muted)">
        애월의 새로운 소식을 확인해요
      </p>
    </header>
    <div class="mb-(--space-4) flex items-center justify-between">
      <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
        읽지 않은 알림 {{ unreadCount }}개
      </p>
      <button
        v-if="unreadCount"
        class="text-(length:--font-sm) font-semibold text-(color:--color-leaf-dark)"
        @click="store.markAllAsRead()"
      >
        모두 읽음
      </button>
    </div>
    <div
      v-if="sortedNotifications.length"
      class="grid gap-(--space-3)"
    >
      <button
        v-for="item in sortedNotifications"
        :key="item.id"
        type="button"
        class="flex w-full gap-(--space-3) rounded-[20px] bg-(--color-white) p-(--space-4) text-left shadow-(--shadow-sm)"
        @click="store.markAsRead(item.id)"
      >
        <span class="relative shrink-0"><FeatureIconTile
          :icon="IconNotificationBell"
          tone="pink"
        /><i
          v-if="!item.read"
          class="absolute right-[1px] top-[1px] size-[8px] rounded-full bg-(--color-leaf)"
        /></span>
        <span class="min-w-0 flex-1"><strong class="block text-(length:--font-sm) text-(color:--color-navy)">{{ item.title }}</strong><span class="mt-(--space-1) block text-(length:--font-xs) leading-relaxed text-(color:--color-slate-dark)">{{ item.message }}</span><time class="mt-(--space-2) block text-[10px] text-(color:--color-slate-muted)">{{ formatTime(item.createdAt) }}</time></span>
      </button>
    </div>
    <EmptyState
      v-else
      :icon="IconNotificationBell"
      message="아직 도착한 알림이 없어요."
    />
  </div>
</template>
