<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter(); const link = ref('')
</script>
<template><main class="join screen"><button class="back" type="button" @click="router.back()">‹</button><h1>초대링크 입력</h1><p class="sub">가족이나 친구가 보낸 초대링크를 입력해주세요</p><label for="invite-link">초대링크 *</label><input id="invite-link" v-model="link" placeholder="aewol.link/share/abc123..."/><div class="hint">💡 초대링크는 이메일, 카카오톡, 문자 등으로 받을 수 있습니다. 링크를 복사해 입력해주세요.</div><button class="primary" type="button" :disabled="!link.trim()">참여하기</button></main></template>
<style scoped>
.screen { position: relative; width: min(100%, 390px); min-height: 620px; margin: 0 auto; padding: 62px 22px; box-sizing: border-box; color: #1b2a49; background: #fff; }.back { position: absolute; top: 57px; left: 20px; border: 0; background: none; color: #1b2a49; font-size: 32px; line-height: 1; cursor: pointer; }.screen h1 { margin: 28px 0 4px; font-size: 20px; }.sub { margin: 0 0 40px; color: #8a93a6; font-size: 12.5px; }.screen label { display: block; margin-bottom: 8px; color: #4a5a7d; font-size: 12.5px; font-weight: 700; }.screen input { width: 100%; height: 46px; padding: 0 14px; box-sizing: border-box; border: 1px solid #eaeae4; border-radius: 12px; background: #fafaf8; font: 13px Inter, sans-serif; }.hint { margin-top: 16px; padding: 14px 16px; border-radius: 14px; background: #fafaf8; color: #4a5a7d; font-size: 11.5px; line-height: 1.45; }.primary { width: 100%; height: 52px; margin-top: 218px; border: 0; border-radius: 16px; background: #1b2a49; color: #fff; font-weight: 700; cursor: pointer; }.primary:disabled { opacity: .45; cursor: not-allowed; }
</style>
