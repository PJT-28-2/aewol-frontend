<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
<template>
  <main class="share-start screen"><h1>애월 시작하기</h1><p class="sub">애월을 시작해보세요!</p>
    <button class="choice" type="button" @click="router.push('/pets/register')"><span class="choice-icon blue">🐾</span><strong>새로운 반려동물 등록</strong><small>내 반려동물을 등록하고 애월을 시작해보세요</small></button>
    <button class="choice" type="button" @click="router.push('/share/join')"><span class="choice-icon gold">👪</span><strong>초대링크로 참여</strong><small>가족이나 친구로부터 받은 초대링크를 입력하세요</small></button>
  </main>
</template>
<style scoped>
.screen { width: min(100%, 390px); min-height: 760px; margin: 0 auto; padding: 90px 22px; box-sizing: border-box; background: #fff; color: #1b2a49; }.screen h1 { margin: 0; font-size: 22px; }.sub { margin: 4px 0 40px; color: #8a93a6; font-size: 12.5px; }.choice { display: flex; align-items: center; flex-direction: column; width: 100%; height: 190px; margin-bottom: 24px; padding: 30px 16px; border: 1px solid #eaeae4; border-radius: 20px; background: #fff; color: #1b2a49; cursor: pointer; }.choice-icon { display: grid; place-items: center; width: 60px; height: 60px; margin-bottom: 17px; border-radius: 18px; font-size: 24px; }.blue { background: #dce6f5; }.gold { background: #fbe7c6; }.choice strong { font-size: 15px; }.choice small { margin-top: 5px; color: #8a93a6; font-size: 11.5px; }
</style>
