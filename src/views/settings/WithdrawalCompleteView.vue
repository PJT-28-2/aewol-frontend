<script setup>
import withdrawalCompleteImage from '@/assets/images/withdrawal-complete.png'
</script>

<template>
  <main
    class="flex min-h-svh w-full flex-col justify-center bg-(--color-white) px-[22px] py-12"
  >
    <img
      class="mx-auto size-[160px] object-contain object-center"
      :src="withdrawalCompleteImage"
      alt="노을을 바라보는 강아지와 고양이"
    >

    <section
      class="mt-[24px] text-center"
      aria-labelledby="complete-title"
    >
      <h1
        id="complete-title"
        class="text-(length:--font-2xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        그동안 함께해주셔서 감사해요
      </h1>
      <p class="mt-[12px] text-(length:--font-md) leading-[1.3] text-(color:--color-slate-muted)">
        회원 탈퇴가 완료됐어요
      </p>
    </section>

    <router-link
      class="mt-[42px] flex h-(--control-height-lg) w-full items-center justify-center rounded-(--radius-xl) bg-(--color-navy) text-[14.5px] font-(--font-bold) text-(color:--color-white)"
      to="/login"
    >
      로그인 화면으로
    </router-link>
  </main>
</template>
