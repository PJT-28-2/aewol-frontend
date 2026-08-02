<script setup>
import signupCompleteImage from '@/assets/images/pet-success.png'
</script>

<template>
  <main
    class="min-h-svh w-full bg-(--color-white) px-(--auth-success-content-padding) pt-(--auth-signup-success-image-top)"
  >
    <img
      class="mx-auto size-(--auth-success-image-size) object-cover"
      :src="signupCompleteImage"
      alt=""
    >

    <section
      class="mt-(--auth-success-title-gap) text-center"
      aria-labelledby="signup-complete-title"
    >
      <h1
        id="signup-complete-title"
        class="text-(length:--font-2xl) leading-(--line-height-tight) font-(--font-bold) text-(color:--color-navy)"
      >
        회원가입이 완료됐어요
      </h1>
      <p class="mt-(--auth-signup-success-description-gap) text-(length:--font-md) leading-(--line-height-tight) text-(color:--color-slate-muted)">
        애월 회원이 되신 것을 환영해요
      </p>
    </section>

    <router-link
      class="mt-(--auth-signup-success-action-gap) flex h-(--control-height-lg) w-full items-center justify-center rounded-(--radius-xl) bg-(--color-gold) text-(length:--auth-font-button) font-(--font-bold) text-(color:--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
      to="/login"
    >
      로그인하러 가기
    </router-link>
  </main>
</template>
