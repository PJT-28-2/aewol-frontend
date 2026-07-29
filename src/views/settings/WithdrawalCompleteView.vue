<script setup>
import withdrawalCompleteImage from '@/assets/images/withdrawal-complete.png'
</script>

<template>
  <main
    class="mx-auto min-h-[600px] w-full max-w-[390px] overflow-hidden rounded-[40px] bg-(--color-white) px-[22px] pt-[164px]"
  >
    <div class="mx-auto size-[120px] overflow-hidden">
      <img
        class="h-[200px] w-[200px] max-w-none -translate-x-[44px] -translate-y-[30px]"
        :src="withdrawalCompleteImage"
        alt="노을을 바라보는 강아지와 고양이"
      >
    </div>

    <section
      class="mt-[24px] text-center"
      aria-labelledby="complete-title"
    >
      <h1
        id="complete-title"
        class="text-[17px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        그동안 애월과 함께해주셔서 감사해요
      </h1>
      <p class="mt-[12px] text-[13px] leading-[1.3] text-(color:--color-slate-muted)">
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
