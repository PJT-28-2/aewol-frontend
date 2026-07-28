<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const INVITE_LINK = 'https://aewol.app/invite/8f2c91'
const router = useRouter()
const recipient = ref('')
const copied = ref(false)
const isSending = ref(false)
const status = ref('')
const isEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.value.trim()))
const normalizedPhone = computed(() => recipient.value.replace(/\D/g, ''))
const isPhone = computed(() => /^01[016789]\d{7,8}$/.test(normalizedPhone.value))
const isValidRecipient = computed(() => isEmail.value || isPhone.value)

async function sendInvite() {
  status.value = ''

  if (!isValidRecipient.value) {
    status.value = '올바른 이메일 또는 휴대전화 번호를 입력해주세요.'
    return
  }

  isSending.value = true
  const body = encodeURIComponent(`애월 공유 지갑에 초대했어요. ${INVITE_LINK}`)
  const target = isEmail.value
    ? `mailto:${encodeURIComponent(recipient.value.trim())}?subject=${encodeURIComponent('애월 공유 지갑 초대')}&body=${body}`
    : `sms:${normalizedPhone.value}?body=${body}`
  window.location.href = target
  isSending.value = false
  status.value = '초대 메시지를 보낼 앱을 열었어요.'
}

async function copyLink() {
  copied.value = false
  status.value = ''

  if (!navigator.clipboard?.writeText) {
    status.value = '이 브라우저에서는 링크 복사를 지원하지 않아요.'
    return
  }

  try {
    await navigator.clipboard.writeText(INVITE_LINK)
    copied.value = true
    status.value = '초대링크를 복사했어요.'
  } catch {
    status.value = '링크를 복사하지 못했어요. 다시 시도해주세요.'
  }
}
</script>
<template><main class="invite screen"><div class="grabber"></div><button class="back" type="button" @click="router.back()">‹</button><h1>가족 초대하기</h1><p class="sub">함께 돌보는 가족을 초대해 지갑을 공유해요</p><label for="recipient">이메일 또는 전화번호</label><input id="recipient" v-model="recipient" placeholder="example@aewol.com" @input="status = ''"/><button class="primary" type="button" :disabled="!recipient.trim() || isSending" @click="sendInvite">{{ isSending ? '전송 준비 중...' : '초대 보내기' }}</button><div class="or">또는 링크로 초대</div><div class="link-row"><span>aewol.app/invite/8f2c91</span><button type="button" @click="copyLink">{{ copied ? '복사됨' : '복사' }}</button></div><p v-if="status" class="status" role="status">{{ status }}</p></main></template>
<style scoped>
.screen { position: relative; width: min(100%, var(--mobile-content-width)); min-height: 460px; margin: 0 auto; padding: 44px 22px; box-sizing: border-box; color: var(--color-navy); background: var(--color-white); border-radius: var(--radius-sheet); }.grabber { position: absolute; top: 14px; left: calc(50% - 20px); width: 40px; height: 5px; border-radius: var(--radius-sm); background: var(--color-border); }.back { position: absolute; top: 38px; left: 18px; border: 0; background: none; color: var(--color-navy); font-size: 30px; cursor: pointer; }.screen h1 { margin: 0; font-size: 18px; }.sub { margin: 7px 0 36px; color: var(--color-slate-muted); font-size: 12.5px; }.screen label { display: block; margin-bottom: 8px; color: var(--color-slate-dark); font-size: 12.5px; font-weight: var(--font-bold); }.screen input { width: 100%; height: var(--control-height); padding: 0 14px; box-sizing: border-box; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); font: 13px var(--font-family); }.primary { width: 100%; height: var(--control-height-lg); margin-top: 16px; border: 0; border-radius: var(--radius-xl); background: var(--color-navy); color: var(--color-white); font-weight: var(--font-bold); cursor: pointer; }.primary:disabled { opacity: .45; }.or { margin: 66px 0 26px; border-top: 1px solid var(--color-border); padding-top: 18px; text-align: center; color: var(--color-slate-muted); font-size: 11.5px; }.link-row { display: flex; gap: 16px; }.link-row span { flex: 1; height: var(--control-height); padding: 14px; box-sizing: border-box; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); color: var(--color-slate-dark); font-size: 12.5px; }.link-row button { width: 80px; border: 0; border-radius: var(--radius-lg); background: var(--color-gold); color: var(--color-navy); font-weight: var(--font-bold); cursor: pointer; }.status { margin: 14px 0 0; color: var(--color-slate-dark); font-size: var(--font-sm); }
</style>
