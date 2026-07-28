<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
<template>
  <main class="share-start screen">
    <h1>애월 시작하기</h1>
    <p class="sub">
      애월을 시작해보세요!
    </p>
    <button
      class="choice"
      type="button"
      @click="router.push('/pets/register')"
    >
      <span class="choice-icon blue">🐾</span>
      <strong>새로운 반려동물 등록</strong>
      <small>내 반려동물을 등록하고 애월을 시작해보세요</small>
    </button>
    <button
      class="choice"
      type="button"
      @click="router.push('/share/join')"
    >
      <span class="choice-icon gold">👪</span>
      <strong>초대링크로 참여</strong>
      <small>가족이나 친구로부터 받은 초대링크를 입력하세요</small>
    </button>
  </main>
</template>
<style scoped>
.screen {
  width: min(100%, var(--mobile-content-width));
  min-height: 100vh;
  margin: 0 auto;
  padding: calc(var(--header-height) + var(--space-8)) var(--space-5);
  box-sizing: border-box;
  background: var(--color-white);
  color: var(--color-navy);
}

.screen h1 {
  margin: 0;
  font-size: var(--font-2xl);
}

.sub {
  margin: var(--space-1) 0 var(--space-8);
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
}

.choice {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  min-height: calc(var(--space-10) * 3);
  margin-bottom: var(--space-6);
  padding: var(--space-7) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-white);
  color: var(--color-navy);
  cursor: pointer;
}

.choice-icon {
  display: grid;
  place-items: center;
  width: var(--share-icon-size);
  height: var(--share-icon-size);
  margin-bottom: var(--space-4);
  border-radius: var(--radius-xl);
  font-size: var(--font-2xl);
}

.blue {
  background: var(--color-info-surface);
}

.gold {
  background: var(--color-gold-surface);
}

.choice strong {
  font-size: var(--font-base);
}

.choice small {
  margin-top: var(--space-1);
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
}
</style>
