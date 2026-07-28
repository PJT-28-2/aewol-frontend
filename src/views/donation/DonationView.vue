<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import BottomNavBar from "@/components/common/BottomNavBar.vue";

const route = useRoute();
const router = useRouter();
const balance = ref(12400);
const amount = ref(3000);
const selectedCampaign = ref("행복한 유기동물보호소");
const autoDonate = ref(false);
const screen = computed(() => route.path.split("/").pop());
const campaigns = [
  {
    name: "행복한 유기동물보호소",
    title: "겨울나기, 유기견 난방비를 도와주세요",
    progress: 68,
  },
  {
    name: "동물권행동 카라",
    title: "구조된 아이들의 병원비를 모아주세요",
    progress: 42,
  },
  { name: "제주 유기견 쉼터", title: "임시보호 물품 지원", progress: 55 },
  { name: "한국동물구조관리협회", title: "유기묘 중성화 수술", progress: 77 },
];
const isMain = computed(() => route.path === "/donation");
const currentCampaign = computed(
  () =>
    campaigns.find((item) => item.name === selectedCampaign.value) ??
    campaigns[0],
);
const canDonate = computed(
  () => amount.value > 0 && amount.value <= balance.value,
);
function go(path) {
  router.push(path);
}
function donate() {
  if (!canDonate.value) return;

  balance.value -= amount.value;
  go("/donation/complete");
}
</script>

<template>
  <main class="impact-screen">
    <template v-if="isMain">
      <section class="piggy-header">
        <button
          type="button"
          @click="go('/donation/settings')"
        >
          ⚙
        </button><strong>짜투리 저금통</strong><span>결제할 때마다 잔돈이 자동으로 모여요</span>
      </section>
      <section class="balance-card">
        <b>누적 저금액</b><strong>{{ balance.toLocaleString() }}원</strong><span>이번 달 3,200원 모았어요</span>
        <div>
          <button
            type="button"
            @click="go('/donation/give')"
          >
            기부하기
          </button><button
            class="outline"
            type="button"
            @click="go('/wallet')"
          >
            지갑으로 출금
          </button>
        </div>
      </section>
      <section class="impact-note">
        <b>💚 지금까지 모은 잔돈으로</b><span>유기동물 3마리를 도울 수 있어요</span>
      </section>
    </template>

    <template v-else-if="screen === 'give'">
      <button
        class="back"
        type="button"
        @click="go('/donation')"
      >
        ‹
      </button>
      <h1>기부하기</h1>
      <section class="wallet-balance">
        <span>내 저금통 잔액</span><strong>₩{{ balance.toLocaleString() }}</strong><small>잔돈을 모아 좋은 곳에 전해보세요</small>
      </section>
      <h2>⭐ 선호 기부처</h2>
      <div class="chips">
        <button
          v-for="campaign in campaigns.slice(0, 2)"
          :key="campaign.name"
          type="button"
          @click="selectedCampaign = campaign.name"
        >
          ⭐ {{ campaign.name }}
        </button><button type="button">
          +
        </button>
      </div>
      <h2>이번주 추천 캠페인</h2>
      <article class="campaign">
        <div class="campaign-image">
          🐕
        </div>
        <b>{{ currentCampaign.name }}</b><strong>{{ currentCampaign.title }}</strong>
        <div class="progress">
          <i :style="{ width: `${currentCampaign.progress}%` }" />
        </div>
        <small>2,046,000원 모금 · 참여 312명
          <em>{{ currentCampaign.progress }}%</em></small>
      </article>
      <h3>기부 금액 선택</h3>
      <div class="amounts">
        <button
          v-for="value in [1000, 3000, 5000]"
          :key="value"
          :class="{ selected: amount === value }"
          type="button"
          :disabled="value > balance"
          @click="amount = value"
        >
          {{ value.toLocaleString() }}원
        </button><button
          type="button"
          :disabled="balance <= 0"
          @click="amount = balance"
        >
          전액
        </button>
      </div>
      <button
        class="explore-link"
        type="button"
        @click="go('/donation/explore')"
      >
        다른 기부처 둘러보기 ›
      </button><button
        class="primary"
        type="button"
        :disabled="!canDonate"
        @click="go('/donation/confirm')"
      >
        저금통에서 {{ amount.toLocaleString() }}원 기부하기
      </button>
    </template>

    <template v-else-if="screen === 'confirm'">
      <section class="sheet">
        <div class="grabber" />
        <h1>{{ amount.toLocaleString() }}원을 기부할까요?</h1>
        <p>기부는 완료 후 취소할 수 없어요</p>
        <div class="confirm-card">
          <b>{{ currentCampaign.name }}</b><span>{{ currentCampaign.title }}</span>
          <hr>
          <label>기부 금액 <strong>{{ amount.toLocaleString() }}원</strong></label>
        </div>
        <div class="after-balance">
          <span>기부 후 저금통 잔액</span><strong>{{ Math.max(balance - amount, 0).toLocaleString() }}원</strong>
        </div>
        <p
          v-if="!canDonate"
          class="error-message"
          role="alert"
        >
          저금통 잔액이 부족해요.
        </p>
        <div class="actions">
          <button
            type="button"
            @click="go('/donation/give')"
          >
            취소
          </button><button
            class="primary"
            type="button"
            :disabled="!canDonate"
            @click="donate"
          >
            기부하기
          </button>
        </div>
      </section>
    </template>

    <template v-else-if="screen === 'complete'">
      <section class="complete">
        <div class="success-icon">
          🐾
        </div>
        <h1>기부해주셔서 감사해요</h1>
        <p>
          {{ currentCampaign.name }}에 {{ amount.toLocaleString() }}원을
          전달했어요
        </p>
        <button
          class="primary"
          type="button"
          @click="go('/donation')"
        >
          저금통으로 돌아가기
        </button>
      </section>
    </template>

    <template v-else-if="screen === 'explore'">
      <button
        class="back"
        type="button"
        @click="go('/donation/give')"
      >
        ‹
      </button>
      <h1>기부처 둘러보기</h1>
      <p class="description">
        우리 아이들을 위한 캠페인을 만나보세요
      </p>
      <input
        class="search"
        placeholder="기부처 · 캠페인 검색"
      >
      <div class="filter">
        <button
          class="active"
          type="button"
        >
          전체
        </button><button type="button">
          유기동물
        </button><button type="button">
          환경
        </button><button type="button">
          기타
        </button>
      </div>
      <div class="campaign-grid">
        <button
          v-for="item in campaigns"
          :key="item.name"
          class="grid-card"
          type="button"
          @click="
            selectedCampaign = item.name;
            go('/donation/give');
          "
        >
          <span class="campaign-image">🐕</span><b>{{ item.name }}</b><strong>{{ item.title }}</strong><span class="progress"><i :style="{ width: `${item.progress}%` }" /></span><small>{{ item.progress }}% 달성</small>
        </button>
      </div>
    </template>

    <template v-else>
      <button
        class="back"
        type="button"
        @click="go('/donation')"
      >
        ‹
      </button>
      <h1>저금통 설정</h1>
      <p class="description">
        짜투리 저금 방식을 설정해요
      </p>
      <section class="setting">
        <b>짜투리 저금통 사용</b><span>결제할 때마다 잔돈을 자동으로 모아요</span><button
          class="toggle on"
          type="button"
        >
          ●
        </button>
      </section>
      <h3>저금 단위</h3>
      <div class="amounts">
        <button type="button">
          10원
        </button><button type="button">
          100원
        </button><button
          class="selected"
          type="button"
        >
          1,000원
        </button>
      </div>
      <section class="example">
        <b>예시</b><strong>31,275원 결제 시, 1,000원 미만 끝자리 275원이 자동으로 저금통에
          적립돼요</strong><span>결제 금액 자체는 그대로 나가고, 잔돈만 별도로 모여요</span>
      </section>
      <div class="divider">
        자동 기부
      </div>
      <section class="setting">
        <b>매달 자동으로 기부하기</b><span>매월 말일, 모인 잔돈을 선택한 기부처로 자동 전달해요</span><button
          class="toggle"
          :class="{ on: autoDonate }"
          type="button"
          @click="autoDonate = !autoDonate"
        >
          ●
        </button>
      </section>
      <button
        class="primary"
        type="button"
        @click="go('/donation')"
      >
        설정 저장하기
      </button>
    </template>
  </main>
  <BottomNavBar v-if="isMain" />
</template>

<style scoped>
.impact-screen {
  width: min(100%, var(--mobile-content-width));
  min-height: 620px;
  margin: 0 auto;
  padding: 76px 22px 92px;
  box-sizing: border-box;
  background: var(--color-white);
  color: var(--color-navy);
}
.piggy-header {
  position: relative;
  height: 100px;
  padding: 27px 16px;
  box-sizing: border-box;
  border-radius: 20px;
  background: var(--color-navy);
  color: var(--color-white);
}
.piggy-header strong,
.piggy-header span {
  display: block;
}
.piggy-header strong {
  font-size: 17px;
}
.piggy-header span {
  margin-top: var(--space-1);
  color: var(--color-slate-light);
  font-size: 11.5px;
}
.piggy-header button {
  position: absolute;
  top: 27px;
  right: 14px;
  border: 0;
  background: none;
  color: var(--color-white);
  font-size: var(--font-lg);
  cursor: pointer;
}
.balance-card {
  margin-top: 18px;
  padding: 22px 20px;
  border-radius: 20px;
  background: var(--color-olive-surface);
}
.balance-card b,
.balance-card span {
  display: block;
}
.balance-card b {
  color: var(--color-olive-dark);
  font-size: 12.5px;
}
.balance-card strong {
  display: block;
  margin: 5px 0 0;
  color: var(--color-olive);
  font-size: 28px;
}
.balance-card span {
  color: var(--color-olive-muted);
  font-size: 11px;
}
.balance-card div {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.balance-card button {
  flex: 1;
  height: 34px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-olive);
  color: var(--color-white);
  font-weight: var(--font-bold);
  cursor: pointer;
}
.balance-card .outline {
  border: 1px solid var(--color-olive);
  background: var(--color-white);
  color: var(--color-olive);
}
.impact-note {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--color-surface);
}
.impact-note b {
  color: var(--color-slate-dark);
  font-size: 11.5px;
}
.impact-note span,
.description {
  color: var(--color-slate-muted);
  font-size: 11px;
}
.back {
  border: 0;
  background: none;
  color: var(--color-navy);
  font-size: var(--font-3xl);
  cursor: pointer;
}
.impact-screen h1 {
  margin: 22px 0 30px;
  font-size: var(--font-xl);
}
.impact-screen h2 {
  margin: 28px 0 12px;
  font-size: var(--font-md);
}
.wallet-balance {
  padding: 12px 18px;
  border-radius: 18px;
  background: var(--color-navy);
  color: var(--color-white);
}
.wallet-balance span,
.wallet-balance small {
  display: block;
  color: var(--color-slate-light);
}
.wallet-balance strong {
  display: block;
  margin: 3px 0;
  font-size: 22px;
}
.wallet-balance small {
  font-size: 10.5px;
}
.chips,
.filter,
.amounts {
  display: flex;
  gap: var(--space-2);
}
.chips button,
.filter button,
.amounts button {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-slate-dark);
  font-weight: var(--font-bold);
  cursor: pointer;
}
.chips button:last-child {
  width: 36px;
  padding: 0;
}
.campaign {
  margin-top: 10px;
  padding-bottom: 12px;
  overflow: hidden;
  border-radius: 18px;
  background: var(--color-surface);
}
.campaign-image {
  display: grid;
  place-items: center;
  height: 101px;
  background: var(--color-border);
  font-size: 30px;
}
.campaign > b,
.campaign > strong,
.campaign > small {
  display: block;
  margin: 10px 16px 0;
}
.campaign > b {
  color: var(--color-gold-dark);
  font-size: 10.5px;
}
.campaign > strong {
  font-size: 13px;
}
.campaign small {
  color: var(--color-slate-muted);
  font-size: 10.5px;
}
.campaign em {
  float: right;
  color: var(--color-gold-dark);
  font-style: normal;
}
.progress {
  height: 6px;
  margin: 12px 16px 0;
  border-radius: 3px;
  background: var(--color-border);
}
.progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-gold);
}
.impact-screen h3 {
  margin: 24px 0 10px;
  color: var(--color-slate-dark);
  font-size: 12.5px;
}
.amounts button {
  flex: 1;
  border-radius: 10px;
}
.amounts .selected,
.filter .active {
  border-color: var(--color-navy);
  background: var(--color-navy);
  color: var(--color-white);
}
.primary {
  width: 100%;
  height: var(--control-height-lg);
  margin-top: 22px;
  border: 0;
  border-radius: var(--radius-xl);
  background: var(--color-navy);
  color: var(--color-white);
  font-weight: var(--font-bold);
  cursor: pointer;
}
.sheet {
  position: relative;
  padding-top: 8px;
  text-align: center;
}
.grabber {
  width: 40px;
  height: 5px;
  margin: -58px auto 25px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
}
.sheet h1 {
  margin: 0 0 7px;
}
.sheet p {
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
}
.confirm-card {
  margin-top: 30px;
  padding: 12px 16px;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  text-align: left;
}
.confirm-card b,
.confirm-card span {
  display: block;
}
.confirm-card span {
  margin-top: 7px;
  color: var(--color-slate-muted);
  font-size: 11px;
}
.confirm-card hr {
  border: 0;
  border-top: 1px solid var(--color-border);
}
.confirm-card label,
.after-balance {
  display: flex;
  justify-content: space-between;
  color: var(--color-slate-dark);
  font-size: 11.5px;
}
.after-balance {
  margin: 28px 10px;
}
.actions {
  display: flex;
  gap: var(--space-3);
}
.actions button {
  flex: 1;
  height: var(--control-height-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-white);
  color: var(--color-slate-dark);
  font-weight: var(--font-bold);
}
.actions .primary {
  margin: 0;
}
.complete {
  padding-top: 130px;
  text-align: center;
}
.success-icon {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  margin: 0 auto 25px;
  border-radius: 50%;
  background: var(--color-olive-surface);
  font-size: 30px;
}
.complete h1 {
  margin: 0 0 8px;
}
.complete p {
  color: var(--color-slate-muted);
  font-size: 12.5px;
}
.search {
  width: 100%;
  height: var(--control-height);
  margin: 20px 0;
  padding: 0 14px;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.filter button {
  height: 32px;
}
.campaign-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: 22px;
}
.grid-card {
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  color: var(--color-navy);
  font-family: var(--font-family);
  text-align: left;
  cursor: pointer;
}
.grid-card:focus-visible {
  outline: 3px solid var(--color-gold);
  outline-offset: var(--space-1);
}
.grid-card .campaign-image {
  height: 96px;
  font-size: var(--font-2xl);
}
.grid-card > b,
.grid-card > strong,
.grid-card > small {
  display: block;
  margin: 9px 12px 0;
}
.grid-card > b {
  color: var(--color-gold-dark);
  font-size: 10.5px;
}
.grid-card > strong {
  font-size: var(--font-sm);
}
.grid-card > small {
  margin-bottom: var(--space-3);
  color: var(--color-slate-muted);
  font-size: var(--font-xs);
}
.setting {
  position: relative;
  margin-top: 22px;
  padding: 15px 56px 15px 16px;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}
.setting b,
.setting span {
  display: block;
}
.setting span {
  margin-top: 6px;
  color: var(--color-slate-muted);
  font-size: 11px;
}
.toggle {
  position: absolute;
  top: 25px;
  right: 16px;
  width: 44px;
  height: 24px;
  border: 0;
  border-radius: var(--radius-lg);
  background: var(--color-border);
  color: var(--color-white);
  font-size: var(--font-xs);
  text-align: right;
}
.toggle.on {
  background: var(--color-olive);
}
.example {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--color-olive-surface);
  color: var(--color-olive-dark);
}
.example b,
.example strong,
.example span {
  display: block;
}
.example strong {
  margin-top: 6px;
  font-size: var(--font-sm);
  line-height: 1.35;
}
.example span {
  margin-top: 5px;
  color: var(--color-olive-muted);
  font-size: 10.5px;
}
.divider {
  margin: 34px 0 10px;
  border-top: 1px solid var(--color-border);
  padding-top: 0;
  text-align: center;
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
}
.explore-link {
  width: 100%;
  margin-top: var(--space-4);
  border: 0;
  background: none;
  color: var(--color-gold-dark);
  font-size: var(--font-sm);
  font-weight: var(--font-bold);
  text-align: right;
  cursor: pointer;
}
.amounts button:disabled,
.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.error-message {
  margin: calc(var(--space-3) * -1) 0 var(--space-4);
  color: var(--color-danger);
  font-size: var(--font-sm);
  text-align: center;
}
</style>
