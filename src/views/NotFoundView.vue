<script setup>
import EmptyState from '@/components/common/EmptyState.vue';
import IconSearch from '@/components/common/icons/IconSearch.vue';
import { useAuthStore } from '@/stores/auth';

// 로그인 상태에 따라 돌아갈 곳이 다르다. 비로그인 사용자를 /home으로 보내면
// 인증 가드가 다시 /login으로 튕겨 이동이 두 번 일어난다.
const authStore = useAuthStore();
const actionRoute = authStore.isAuthenticated ? '/home' : '/login';
</script>

<template>
  <EmptyState
    :icon="IconSearch"
    message="찾을 수 없는 페이지예요."
    action-text="처음으로 돌아가기"
    :action-route="actionRoute"
  />
</template>
