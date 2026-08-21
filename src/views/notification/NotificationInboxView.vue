<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconNotificationBell from '@/components/common/icons/IconNotificationBell.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'

const store = useNotificationStore()
const router = useRouter()
const {
  notifications,
  unreadCount,
  hasNext,
  isLoading,
  isLoadingMore,
  isMarkingAll,
  error,
  actionError,
} = storeToRefs(store)

const formatTime = (value) => new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value))

const isSafeTargetPath = (path) => typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')

async function openNotification(item) {
  try {
    await store.markAsRead(item.notificationId)
  } catch {
    // store가 사용자에게 보여줄 오류 문구를 유지한다.
  }
  if (isSafeTargetPath(item.targetPath)) await router.push(item.targetPath)
}

async function markAllAsRead() {
  try {
    await store.markAllAsRead()
  } catch {
    // store가 사용자에게 보여줄 오류 문구를 유지한다.
  }
}

function fetchNotifications() {
  return store.fetchNotifications().catch(() => {})
}

function loadMoreNotifications() {
  return store.loadMore().catch(() => {})
}

onMounted(fetchNotifications)
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

    <LoadingSpinner
      v-if="isLoading"
      class="py-(--space-10)"
    />

    <EmptyState
      v-else-if="error"
      :icon="IconNotificationBell"
      :message="error"
      action-text="다시 시도"
      @action="fetchNotifications"
    />

    <template v-else>
      <div class="mb-(--space-4) flex items-center justify-between">
        <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
          읽지 않은 알림 {{ unreadCount }}개
        </p>
        <AppButton
          v-if="unreadCount"
          variant="ghost"
          size="sm"
          :loading="isMarkingAll"
          @click="markAllAsRead"
        >
          모두 읽음
        </AppButton>
      </div>

      <p
        v-if="actionError"
        role="alert"
        class="mb-(--space-3) rounded-(--radius-lg) bg-(--color-danger-soft) px-(--space-4) py-(--space-3) text-(length:--font-sm) text-(color:--color-danger-strong)"
      >
        {{ actionError }}
      </p>

      <div
        v-if="notifications.length"
        class="grid gap-(--space-3)"
      >
        <button
          v-for="item in notifications"
          :key="item.notificationId"
          type="button"
          class="flex w-full gap-(--space-3) rounded-[20px] bg-(--color-white) p-(--space-4) text-left shadow-(--shadow-sm)"
          @click="openNotification(item)"
        >
          <span class="relative shrink-0">
            <FeatureIconTile
              :icon="IconNotificationBell"
              tone="pink"
            />
            <i
              v-if="!item.read"
              class="absolute right-[1px] top-[1px] size-[8px] rounded-full bg-(--color-leaf)"
            />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block text-(length:--font-sm) text-(color:--color-navy)">{{ item.title }}</strong>
            <span class="mt-(--space-1) block text-(length:--font-xs) leading-relaxed text-(color:--color-slate-dark)">{{ item.message }}</span>
            <time class="mt-(--space-2) block text-[10px] text-(color:--color-slate-muted)">{{ formatTime(item.createdAt) }}</time>
          </span>
        </button>

        <AppButton
          v-if="hasNext"
          class="mx-auto mt-(--space-2)"
          variant="secondary"
          size="sm"
          :loading="isLoadingMore"
          @click="loadMoreNotifications"
        >
          알림 더 보기
        </AppButton>
      </div>

      <EmptyState
        v-else
        :icon="IconNotificationBell"
        message="아직 도착한 알림이 없어요"
      />
    </template>
  </div>
</template>
