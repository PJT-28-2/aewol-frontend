<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const MOCK_INVITE_CODE = "8f2c91";
const router = useRouter();
const link = ref("");
const errorMessage = ref("");
const joined = ref(false);

function getInviteCode(value) {
  const normalized = value.trim().match(/^https?:\/\//i)
    ? value.trim()
    : `https://${value.trim()}`;

  try {
    const url = new URL(normalized);
    const match = url.pathname.match(/^\/invite\/([a-z0-9]+)\/?$/i);
    return url.hostname === "aewol.app" ? (match?.[1] ?? "") : "";
  } catch {
    return "";
  }
}

function joinShare() {
  const inviteCode = getInviteCode(link.value);

  if (!inviteCode) {
    errorMessage.value = "aewol.app의 올바른 초대 링크를 입력해주세요.";
    return;
  }

  if (inviteCode !== MOCK_INVITE_CODE) {
    errorMessage.value = "유효하지 않거나 만료된 초대 링크예요.";
    return;
  }

  errorMessage.value = "";
  joined.value = true;
}
</script>
<template>
  <main class="join screen">
    <button
      class="back"
      type="button"
      @click="router.back()"
    >
      ‹
    </button><template v-if="joined">
      <section
        class="joined"
        role="status"
      >
        <span class="success-icon">✓</span>
        <h1>공유 지갑에 참여했어요</h1>
        <p class="sub">
          이제 가족과 함께 반려동물을 돌볼 수 있어요.
        </p>
        <button
          class="primary"
          type="button"
          @click="router.push('/share')"
        >
          공유 지갑 보기
        </button>
      </section>
    </template><template v-else>
      <h1>초대링크 입력</h1>
      <p class="sub">
        가족이나 친구가 보낸 초대링크를 입력해주세요
      </p>
      <label for="invite-link">초대링크 *</label><input
        id="invite-link"
        v-model="link"
        placeholder="aewol.app/invite/8f2c91"
        aria-describedby="invite-hint invite-error"
        @input="errorMessage = ''"
      >
      <div
        id="invite-hint"
        class="hint"
      >
        💡 초대링크는 이메일, 카카오톡, 문자 등으로 받을 수 있습니다. 링크를
        복사해 입력해주세요.
      </div>
      <p
        v-if="errorMessage"
        id="invite-error"
        class="error-message"
        role="alert"
      >
        {{ errorMessage }}
      </p>
      <button
        class="primary"
        type="button"
        :disabled="!link.trim()"
        @click="joinShare"
      >
        참여하기
      </button>
    </template>
  </main>
</template>
<style scoped>
.screen {
  position: relative;
  width: min(100%, var(--mobile-content-width));
  min-height: 620px;
  margin: 0 auto;
  padding: 62px 22px;
  box-sizing: border-box;
  color: var(--color-navy);
  background: var(--color-white);
}
.back {
  position: absolute;
  top: 57px;
  left: 20px;
  border: 0;
  background: none;
  color: var(--color-navy);
  font-size: var(--font-3xl);
  line-height: 1;
  cursor: pointer;
}
.screen h1 {
  margin: 28px 0 4px;
  font-size: var(--font-xl);
}
.sub {
  margin: 0 0 40px;
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
.hint {
  margin-top: var(--space-4);
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-slate-dark);
  font-size: 11.5px;
  line-height: 1.45;
}
.primary {
  width: 100%;
  height: var(--control-height-lg);
  margin-top: 218px;
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
.error-message {
  margin: var(--space-3) 0 0;
  color: var(--color-danger);
  font-size: var(--font-sm);
}
.joined {
  padding-top: var(--space-10);
  text-align: center;
}
.joined .sub {
  margin-top: var(--space-2);
}
.joined .primary {
  margin-top: var(--space-8);
}
.success-icon {
  display: grid;
  place-items: center;
  width: var(--space-10);
  height: var(--space-10);
  margin: 0 auto var(--space-6);
  border-radius: var(--radius-full);
  background: var(--color-olive-surface);
  color: var(--color-olive-dark);
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
}
</style>
