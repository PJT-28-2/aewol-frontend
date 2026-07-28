<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const INVITE_LINK = "https://aewol.app/invite/8f2c91";
const router = useRouter();
const recipient = ref("");
const copied = ref(false);
const copyError = ref("");
const inviteStatus = ref("");
const inviteError = ref("");
const trimmedRecipient = computed(() => recipient.value.trim());
const recipientType = computed(() => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRecipient.value)) {
    return "email";
  }

  if (/^(?:\+82|0)1[016789]\d{7,8}$/.test(trimmedRecipient.value.replace(/[-\s]/g, ""))) {
    return "phone";
  }

  return "";
});

function sendInvite() {
  if (!trimmedRecipient.value) return;

  inviteStatus.value = "";
  inviteError.value = "";

  const subject = encodeURIComponent("애월 가족 초대");
  const body = encodeURIComponent(`함께 반려동물을 돌봐요.\n${INVITE_LINK}`);

  if (recipientType.value === "email") {
    window.location.href = `mailto:${encodeURIComponent(trimmedRecipient.value)}?subject=${subject}&body=${body}`;
  } else if (recipientType.value === "phone") {
    const phoneNumber = trimmedRecipient.value.replace(/[-\s]/g, "");
    window.location.href = `sms:${encodeURIComponent(phoneNumber)}?body=${body}`;
  } else {
    inviteError.value = "올바른 이메일 또는 휴대전화 번호를 입력해주세요.";
    return;
  }

  inviteStatus.value = "초대 메시지를 보낼 앱을 열었어요.";
}

async function copyLink() {
  copied.value = false;
  copyError.value = "";

  if (!navigator.clipboard?.writeText) {
    copyError.value = "이 브라우저에서는 링크 복사를 지원하지 않아요.";
    return;
  }

  try {
    await navigator.clipboard.writeText(INVITE_LINK);
    copied.value = true;
  } catch {
    copyError.value = "링크를 복사하지 못했어요.";
  }
}
</script>
<template>
  <main class="invite screen">
    <div class="grabber" />
    <button
      class="back"
      type="button"
      @click="router.back()"
    >
      ‹
    </button>
    <h1>가족 초대하기</h1>
    <p class="sub">
      함께 돌보는 가족을 초대해 지갑을 공유해요
    </p>
    <label for="recipient">이메일 또는 전화번호</label><input
      id="recipient"
      v-model="recipient"
      placeholder="example@aewol.com"
      @input="
        inviteError = '';
        inviteStatus = '';
      "
    ><button
      class="primary"
      type="button"
      :disabled="!trimmedRecipient"
      @click="sendInvite"
    >
      초대 보내기
    </button>
    <p
      v-if="inviteStatus"
      class="feedback success"
      role="status"
    >
      {{ inviteStatus }}
    </p>
    <p
      v-if="inviteError"
      class="feedback error"
      role="alert"
    >
      {{ inviteError }}
    </p>
    <div class="or">
      또는 링크로 초대
    </div>
    <div class="link-row">
      <span>{{ INVITE_LINK }}</span><button
        type="button"
        @click="copyLink"
      >
        {{ copied ? "복사됨" : "복사" }}
      </button>
    </div>
    <p
      v-if="copyError"
      class="feedback error"
      role="alert"
    >
      {{ copyError }}
    </p>
  </main>
</template>
<style scoped>
.screen {
  position: relative;
  width: min(100%, var(--mobile-content-width));
  min-height: 460px;
  margin: 0 auto;
  padding: 44px 22px;
  box-sizing: border-box;
  color: var(--color-navy);
  background: var(--color-white);
  border-radius: var(--radius-sheet);
}
.grabber {
  position: absolute;
  top: 14px;
  left: calc(50% - 20px);
  width: 40px;
  height: 5px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
}
.back {
  position: absolute;
  top: 38px;
  left: 18px;
  border: 0;
  background: none;
  color: var(--color-navy);
  font-size: 30px;
  cursor: pointer;
}
.screen h1 {
  margin: 0;
  font-size: var(--font-lg);
}
.sub {
  margin: 7px 0 36px;
  color: var(--color-slate-muted);
  font-size: 12.5px;
}
.screen label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-slate-dark);
  font-size: 12.5px;
  font-weight: var(--font-bold);
}
.screen input {
  width: 100%;
  height: var(--control-height);
  padding: 0 14px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  font:
    13px var(--font-family);
}
.primary {
  width: 100%;
  height: var(--control-height-lg);
  margin-top: var(--space-4);
  border: 0;
  border-radius: var(--radius-xl);
  background: var(--color-navy);
  color: var(--color-white);
  font-weight: var(--font-bold);
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.or {
  position: relative;
  margin: 66px 0 26px;
  border-top: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-slate-muted);
  font-size: 11.5px;
}
.or::before {
  content: "또는 링크로 초대";
  position: relative;
  top: -9px;
  padding: 0 8px;
  background: var(--color-white);
}
.link-row {
  display: flex;
  gap: var(--space-4);
}
.link-row span {
  flex: 1;
  height: var(--control-height);
  padding: 14px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-slate-dark);
  font-size: 12.5px;
}
.link-row button {
  width: 80px;
  border: 0;
  border-radius: var(--radius-lg);
  background: var(--color-gold);
  color: var(--color-navy);
  font-weight: var(--font-bold);
  cursor: pointer;
}
.feedback {
  margin: var(--space-2) 0 0;
  font-size: var(--font-sm);
}
.feedback.success {
  color: var(--color-success);
}
.feedback.error {
  color: var(--color-danger);
}
</style>
