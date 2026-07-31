<script setup>
import signupCompleteImage from '@/assets/images/pet-success.png'
</script>

<template>
  <main
    class="mx-auto min-h-svh w-[min(100%,390px)] overflow-hidden bg-(--color-white) px-[22px] pt-[149px] min-[391px]:my-[max(0px,calc((100svh-600px)/2))] min-[391px]:min-h-[600px] min-[391px]:rounded-[40px] min-[391px]:shadow-(--shadow-lg)"
  >
    <img
      class="mx-auto size-(--auth-success-image-size) object-cover"
      :src="signupCompleteImage"
      alt=""
    >

    <section
      class="mt-[9px] text-center"
      aria-labelledby="signup-complete-title"
    >
      <h1
        id="signup-complete-title"
        class="text-[18px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        회원가입이 완료됐어요
      </h1>
      <p class="mt-[7px] text-[12.5px] leading-[1.3] text-(color:--color-slate-muted)">
        애월 회원이 되신 것을 환영해요
      </p>
    </section>

    <router-link
      class="mt-[44px] flex h-(--control-height-lg) w-full items-center justify-center rounded-(--radius-xl) bg-(--color-gold) text-[14.5px] font-(--font-bold) text-(color:--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
      to="/login"
    >
      로그인하러 가기
    </router-link>
  </main>
</template>
