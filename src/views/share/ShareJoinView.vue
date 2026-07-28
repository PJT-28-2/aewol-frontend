<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const link = ref('')
const isJoining = ref(false)
const status = ref('')
const isValidLink = computed(() => /^https?:\/\/aewol\.app\/invite\/[\w-]+$/i.test(link.value.trim()) || /^aewol\.app\/invite\/[\w-]+$/i.test(link.value.trim()))

async function joinShare() {
  status.value = ''

  if (!isValidLink.value) {
    status.value = '올바른 애월 초대링크를 입력해주세요.'
    return
  }

  isJoining.value = true
  await Promise.resolve()
  isJoining.value = false

  if (!link.value.trim().endsWith('/8f2c91')) {
    status.value = '유효하지 않거나 만료된 초대링크예요.'
    return
  }

  status.value = '공유 지갑에 참여했어요.'
}
</script>
<template><main class="join screen"><button class="back" type="button" @click="router.back()">‹</button><h1>초대링크 입력</h1><p class="sub">가족이나 친구가 보낸 초대링크를 입력해주세요</p><label for="invite-link">초대링크 *</label><input id="invite-link" v-model="link" placeholder="aewol.app/invite/8f2c91" @input="status = ''"/><div class="hint">💡 초대링크는 이메일, 카카오톡, 문자 등으로 받을 수 있습니다. 링크를 복사해 입력해주세요.</div><p v-if="status" class="status" role="status">{{ status }}</p><button v-if="status === '공유 지갑에 참여했어요.'" class="primary" type="button" @click="router.push('/share')">함께 돌보기로 이동</button><button v-else class="primary" type="button" :disabled="!link.trim() || isJoining" @click="joinShare">{{ isJoining ? '참여 중...' : '참여하기' }}</button></main></template>
<style scoped>
.screen { position: relative; display: flex; flex-direction: column; width: min(100%, var(--mobile-content-width)); min-height: 620px; margin: 0 auto; padding: 62px 22px; box-sizing: border-box; color: var(--color-navy); background: var(--color-white); }.back { position: absolute; top: 57px; left: 20px; border: 0; background: none; color: var(--color-navy); font-size: 32px; line-height: 1; cursor: pointer; }.screen h1 { margin: 28px 0 4px; font-size: 20px; }.sub { margin: 0 0 40px; color: var(--color-slate-muted); font-size: 12.5px; }.screen label { display: block; margin-bottom: 8px; color: var(--color-slate-dark); font-size: 12.5px; font-weight: var(--font-bold); }.screen input { width: 100%; height: var(--control-height); padding: 0 14px; box-sizing: border-box; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); font: 13px var(--font-family); }.hint { margin-top: 16px; padding: 14px 16px; border-radius: 14px; background: var(--color-surface); color: var(--color-slate-dark); font-size: 11.5px; line-height: 1.45; }.status { margin: 16px 0 0; color: var(--color-slate-dark); font-size: var(--font-sm); }.primary { width: 100%; height: var(--control-height-lg); margin-top: auto; border: 0; border-radius: var(--radius-xl); background: var(--color-navy); color: var(--color-white); font-weight: var(--font-bold); cursor: pointer; }.primary:disabled { opacity: .45; cursor: not-allowed; }
</style>
