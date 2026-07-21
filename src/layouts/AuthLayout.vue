<script setup>
</script>

<template>
  <div class="auth-layout">
    <header class="auth-layout__header">
      <div class="auth-layout__brand">
        <h1 class="auth-layout__title">애월</h1>
        <p class="auth-layout__subtitle">반려동물 지갑</p>
      </div>
    </header>

    <main class="auth-layout__content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg);
}

.auth-layout__header {
  background-color: var(--color-navy);
  padding: var(--space-10) var(--space-4) var(--space-8);
  text-align: center;
}

.auth-layout__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.auth-layout__title {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--color-gold);
  letter-spacing: 2px;
}

.auth-layout__subtitle {
  font-size: var(--font-md);
  color: var(--color-gray-300);
}

.auth-layout__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) var(--space-4);
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}
</style>
