<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import { useDonationStore } from '@/stores/donation'

const route = useRoute()
const router = useRouter()
const donationStore = useDonationStore()
const {
  amount,
  autoDonate,
  balance,
  canDonate,
  piggyBankEnabled,
  selectedCampaign,
} = storeToRefs(donationStore)
const screen = computed(() => route.meta.step)
const campaigns = [
  {
    name: '행복한 유기동물보호소',
    title: '겨울나기, 유기견 난방비를 도와주세요',
    progress: 68,
  },
  {
    name: '동물권행동 카라',
    title: '구조된 아이들의 병원비를 모아주세요',
    progress: 42,
  },
  {
    name: '제주 유기견 쉼터',
    title: '임시보호 물품 지원',
    progress: 55,
  },
  {
    name: '한국동물구조관리협회',
    title: '유기묘 중성화 수술',
    progress: 77,
  },
]
const isMain = computed(() => route.name === 'Donation')
const currentCampaign = computed(
  () =>
    campaigns.find((item) => item.name === selectedCampaign.value) ??
    campaigns[0],
)

function go(path) {
  router.push(path)
}

function donate() {
  if (donationStore.donate()) go('/donation/complete')
}

function saveSettings() {
  donationStore.saveSettings()
  go('/donation')
}
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[var(--mobile-content-width)] box-border bg-[var(--color-white)] px-[var(--space-5)] pb-[calc(var(--bottom-nav-height)+var(--space-8))] pt-[calc(var(--header-height)+var(--space-5))] text-[var(--color-navy)]"
  >
    <template v-if="isMain">
      <section
        class="relative min-h-24 box-border rounded-[var(--radius-xl)] bg-[var(--color-navy)] p-[var(--space-6)] text-[var(--color-white)]"
      >
        <button
          class="absolute right-[var(--space-4)] top-[var(--space-6)] cursor-pointer border-0 bg-transparent text-[length:var(--font-lg)] text-[var(--color-white)]"
          type="button"
          aria-label="저금통 설정"
          @click="go('/donation/settings')"
        >
          ⚙
        </button>
        <strong class="block text-[length:var(--font-lg)]">짜투리 저금통</strong>
        <span
          class="mt-[var(--space-1)] block text-[length:var(--font-sm)] text-[var(--color-slate-light)]"
        >결제할 때마다 잔돈이 자동으로 모여요</span>
      </section>

      <section
        class="mt-[var(--space-5)] rounded-[var(--radius-xl)] bg-[var(--color-olive-surface)] p-[var(--space-5)]"
      >
        <b
          class="block text-[length:var(--font-sm)] text-[var(--color-olive-dark)]"
        >누적 저금액</b>
        <strong
          class="mt-[var(--space-1)] block text-[length:var(--font-3xl)] text-[var(--color-olive)]"
        >{{ balance.toLocaleString() }}원</strong>
        <span
          class="block text-[length:var(--font-xs)] text-[var(--color-olive-muted)]"
        >이번 달 3,200원 모았어요</span>
        <div class="mt-[var(--space-3)] flex gap-[var(--space-3)]">
          <button
            class="h-[var(--control-height-sm)] flex-1 cursor-pointer rounded-full border-0 bg-[var(--color-olive)] font-bold text-[var(--color-white)]"
            type="button"
            @click="go('/donation/give')"
          >
            기부하기
          </button>
          <button
            class="h-[var(--control-height-sm)] flex-1 cursor-pointer rounded-full border border-[var(--color-olive)] bg-[var(--color-white)] font-bold text-[var(--color-olive)]"
            type="button"
            @click="go('/wallet')"
          >
            지갑으로 출금
          </button>
        </div>
      </section>

      <section
        class="mt-[var(--space-5)] flex flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-[var(--space-4)]"
      >
        <b
          class="text-[length:var(--font-sm)] text-[var(--color-slate-dark)]"
        >💚 지금까지 모은 잔돈으로</b>
        <span
          class="text-[length:var(--font-xs)] text-[var(--color-slate-muted)]"
        >유기동물 3마리를 도울 수 있어요</span>
      </section>
    </template>

    <template v-else-if="screen === 'give'">
      <button
        class="cursor-pointer border-0 bg-transparent text-[length:var(--font-3xl)] text-[var(--color-navy)]"
        type="button"
        @click="go('/donation')"
      >
        ‹
      </button>
      <h1
        class="mb-[var(--space-7)] mt-[var(--space-5)] text-[length:var(--font-xl)]"
      >
        기부하기
      </h1>

      <section
        class="rounded-[var(--radius-xl)] bg-[var(--color-navy)] px-[var(--space-5)] py-[var(--space-3)] text-[var(--color-white)]"
      >
        <span
          class="block text-[length:var(--font-sm)] text-[var(--color-slate-light)]"
        >내 저금통 잔액</span>
        <strong class="block text-[length:var(--font-2xl)]">
          ₩{{ balance.toLocaleString() }}
        </strong>
        <small
          class="block text-[length:var(--font-xs)] text-[var(--color-slate-light)]"
        >잔돈을 모아 좋은 곳에 전해보세요</small>
      </section>

      <h2
        class="mb-[var(--space-3)] mt-[var(--space-7)] text-[length:var(--font-md)]"
      >
        ⭐ 선호 기부처
      </h2>
      <div class="flex flex-wrap gap-[var(--space-2)]">
        <button
          v-for="campaign in campaigns.slice(0, 2)"
          :key="campaign.name"
          class="h-[var(--control-height-sm)] cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] font-bold text-[var(--color-slate-dark)]"
          :class="{
            'border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-white)]':
              selectedCampaign === campaign.name,
          }"
          type="button"
          @click="selectedCampaign = campaign.name"
        >
          ⭐ {{ campaign.name }}
        </button>
        <button
          class="size-[var(--control-height-sm)] cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] font-bold text-[var(--color-slate-dark)]"
          type="button"
          aria-label="선호 기부처 추가"
        >
          +
        </button>
      </div>

      <h2
        class="mb-[var(--space-3)] mt-[var(--space-7)] text-[length:var(--font-md)]"
      >
        이번주 추천 캠페인
      </h2>
      <article
        class="mt-[var(--space-3)] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface)] pb-[var(--space-3)]"
      >
        <div
          class="grid h-28 place-items-center bg-[var(--color-border)] text-[length:var(--font-3xl)]"
        >
          🐕
        </div>
        <b
          class="mx-[var(--space-4)] mt-[var(--space-3)] block text-[length:var(--font-xs)] text-[var(--color-gold-dark)]"
        >{{ currentCampaign.name }}</b>
        <strong
          class="mx-[var(--space-4)] mt-[var(--space-2)] block text-[length:var(--font-md)]"
        >{{ currentCampaign.title }}</strong>
        <div
          class="mx-[var(--space-4)] mt-[var(--space-3)] h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]"
        >
          <i
            class="block h-full rounded-full bg-[var(--color-gold)]"
            :style="{ width: `${currentCampaign.progress}%` }"
          />
        </div>
        <small
          class="mx-[var(--space-4)] mt-[var(--space-3)] block text-[length:var(--font-xs)] text-[var(--color-slate-muted)]"
        >
          2,046,000원 모금 · 참여 312명
          <em
            class="float-right not-italic text-[var(--color-gold-dark)]"
          >{{ currentCampaign.progress }}%</em>
        </small>
      </article>

      <h3
        class="mb-[var(--space-3)] mt-[var(--space-6)] text-[length:var(--font-sm)] text-[var(--color-slate-dark)]"
      >
        기부 금액 선택
      </h3>
      <div class="flex gap-[var(--space-2)]">
        <button
          v-for="value in [1000, 3000, 5000]"
          :key="value"
          class="h-[var(--control-height-sm)] flex-1 cursor-pointer rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-2)] font-bold text-[var(--color-slate-dark)] disabled:cursor-not-allowed disabled:opacity-45"
          :class="{
            'border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-white)]':
              amount === value,
          }"
          type="button"
          :disabled="value > balance"
          @click="amount = value"
        >
          {{ value.toLocaleString() }}원
        </button>
        <button
          class="h-[var(--control-height-sm)] flex-1 cursor-pointer rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-2)] font-bold text-[var(--color-slate-dark)] disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          :disabled="balance <= 0"
          @click="amount = balance"
        >
          전액
        </button>
      </div>
      <p
        v-if="!canDonate"
        class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-[var(--color-danger)]"
      >
        잔액 안에서 기부 금액을 선택해주세요.
      </p>
      <button
        class="mt-[var(--space-4)] w-full cursor-pointer border-0 bg-transparent text-right text-[length:var(--font-sm)] font-bold text-[var(--color-gold-dark)]"
        type="button"
        @click="go('/donation/explore')"
      >
        다른 기부처 둘러보기 ›
      </button>
      <button
        class="mt-[var(--space-5)] h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-[var(--color-navy)] font-bold text-[var(--color-white)] disabled:cursor-not-allowed disabled:opacity-45"
        type="button"
        :disabled="!canDonate"
        @click="go('/donation/confirm')"
      >
        저금통에서 {{ amount.toLocaleString() }}원 기부하기
      </button>
    </template>

    <template v-else-if="screen === 'confirm'">
      <section class="pt-[var(--space-2)] text-center">
        <div
          class="mx-auto mb-[var(--space-6)] h-[var(--space-1)] w-[var(--space-8)] rounded-full bg-[var(--color-border)]"
        />
        <h1 class="m-0 text-[length:var(--font-xl)]">
          {{ amount.toLocaleString() }}원을 기부할까요?
        </h1>
        <p
          class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-[var(--color-slate-muted)]"
        >
          기부는 완료 후 취소할 수 없어요
        </p>

        <div
          class="mt-[var(--space-7)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-[var(--space-4)] text-left"
        >
          <b class="block">{{ currentCampaign.name }}</b>
          <span
            class="mt-[var(--space-2)] block text-[length:var(--font-xs)] text-[var(--color-slate-muted)]"
          >{{ currentCampaign.title }}</span>
          <hr class="my-[var(--space-3)] border-0 border-t border-[var(--color-border)]">
          <div
            class="flex justify-between text-[length:var(--font-sm)] text-[var(--color-slate-dark)]"
          >
            <span>기부 금액</span>
            <strong>{{ amount.toLocaleString() }}원</strong>
          </div>
        </div>

        <div
          class="mx-[var(--space-3)] my-[var(--space-7)] flex justify-between text-[length:var(--font-sm)] text-[var(--color-slate-dark)]"
        >
          <span>기부 후 저금통 잔액</span>
          <strong>{{ Math.max(balance - amount, 0).toLocaleString() }}원</strong>
        </div>
        <p
          v-if="!canDonate"
          class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-[var(--color-danger)]"
        >
          잔액이 부족해 기부할 수 없어요.
        </p>
        <div class="flex gap-[var(--space-3)]">
          <button
            class="h-[var(--control-height-lg)] flex-1 cursor-pointer rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-white)] font-bold text-[var(--color-slate-dark)]"
            type="button"
            @click="go('/donation/give')"
          >
            취소
          </button>
          <button
            class="h-[var(--control-height-lg)] flex-1 cursor-pointer rounded-[var(--radius-xl)] border-0 bg-[var(--color-navy)] font-bold text-[var(--color-white)] disabled:cursor-not-allowed disabled:opacity-45"
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
      <section class="pt-32 text-center">
        <div
          class="mx-auto mb-[var(--space-6)] grid size-24 place-items-center rounded-full bg-[var(--color-olive-surface)] text-[length:var(--font-3xl)]"
        >
          🐾
        </div>
        <h1 class="m-0 text-[length:var(--font-xl)]">
          기부해주셔서 감사해요
        </h1>
        <p
          class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-[var(--color-slate-muted)]"
        >
          {{ currentCampaign.name }}에 {{ amount.toLocaleString() }}원을
          전달했어요
        </p>
        <button
          class="mt-[var(--space-5)] h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-[var(--color-navy)] font-bold text-[var(--color-white)]"
          type="button"
          @click="go('/donation')"
        >
          저금통으로 돌아가기
        </button>
      </section>
    </template>

    <template v-else-if="screen === 'explore'">
      <button
        class="cursor-pointer border-0 bg-transparent text-[length:var(--font-3xl)] text-[var(--color-navy)]"
        type="button"
        @click="go('/donation/give')"
      >
        ‹
      </button>
      <h1
        class="mb-[var(--space-2)] mt-[var(--space-5)] text-[length:var(--font-xl)]"
      >
        기부처 둘러보기
      </h1>
      <p
        class="m-0 text-[length:var(--font-sm)] text-[var(--color-slate-muted)]"
      >
        우리 아이들을 위한 캠페인을 만나보세요
      </p>
      <input
        class="my-[var(--space-5)] h-[var(--control-height)] w-full box-border rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-4)]"
        placeholder="기부처 · 캠페인 검색"
      >
      <div class="flex flex-wrap gap-[var(--space-2)]">
        <button
          class="h-[var(--control-height-sm)] cursor-pointer rounded-full border border-[var(--color-navy)] bg-[var(--color-navy)] px-[var(--space-3)] font-bold text-[var(--color-white)]"
          type="button"
        >
          전체
        </button>
        <button
          v-for="filter in ['유기동물', '환경', '기타']"
          :key="filter"
          class="h-[var(--control-height-sm)] cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] font-bold text-[var(--color-slate-dark)]"
          type="button"
        >
          {{ filter }}
        </button>
      </div>
      <div
        class="mt-[var(--space-5)] grid grid-cols-2 gap-[var(--space-3)]"
      >
        <button
          v-for="item in campaigns"
          :key="item.name"
          class="overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--color-surface)] p-0 text-left text-[var(--color-navy)]"
          type="button"
          @click="selectedCampaign = item.name; go('/donation/give')"
        >
          <span
            class="grid h-24 place-items-center bg-[var(--color-border)] text-[length:var(--font-2xl)]"
          >🐕</span>
          <b
            class="mx-[var(--space-3)] mt-[var(--space-2)] block text-[length:var(--font-xs)] text-[var(--color-gold-dark)]"
          >{{ item.name }}</b>
          <strong
            class="mx-[var(--space-3)] mt-[var(--space-2)] block text-[length:var(--font-sm)]"
          >{{ item.title }}</strong>
          <span
            class="mx-[var(--space-3)] mt-[var(--space-3)] block h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]"
          >
            <i
              class="block h-full rounded-full bg-[var(--color-gold)]"
              :style="{ width: `${item.progress}%` }"
            />
          </span>
          <small
            class="mx-[var(--space-3)] mb-[var(--space-3)] mt-[var(--space-2)] block text-[length:var(--font-xs)] text-[var(--color-slate-muted)]"
          >{{ item.progress }}% 달성</small>
        </button>
      </div>
    </template>

    <template v-else>
      <button
        class="cursor-pointer border-0 bg-transparent text-[length:var(--font-3xl)] text-[var(--color-navy)]"
        type="button"
        @click="go('/donation')"
      >
        ‹
      </button>
      <h1
        class="mb-[var(--space-2)] mt-[var(--space-5)] text-[length:var(--font-xl)]"
      >
        저금통 설정
      </h1>
      <p
        class="m-0 text-[length:var(--font-sm)] text-[var(--color-slate-muted)]"
      >
        짜투리 저금 방식을 설정해요
      </p>

      <section
        class="relative mt-[var(--space-5)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] py-[var(--space-4)] pl-[var(--space-4)] pr-[calc(var(--header-height)+var(--space-4))]"
      >
        <b class="block">짜투리 저금통 사용</b>
        <span
          class="mt-[var(--space-2)] block text-[length:var(--font-xs)] text-[var(--color-slate-muted)]"
        >결제할 때마다 잔돈을 자동으로 모아요</span>
        <button
          class="absolute right-[var(--space-4)] top-[var(--space-5)] h-6 w-11 cursor-pointer rounded-full border-0 bg-[var(--color-border)] px-1 text-right text-[length:var(--font-xs)] text-[var(--color-white)]"
          :class="{
            'bg-[var(--color-olive)] text-left': piggyBankEnabled,
          }"
          type="button"
          :aria-pressed="piggyBankEnabled"
          @click="piggyBankEnabled = !piggyBankEnabled"
        >
          ●
        </button>
      </section>

      <h3
        class="mb-[var(--space-3)] mt-[var(--space-6)] text-[length:var(--font-sm)] text-[var(--color-slate-dark)]"
      >
        저금 단위
      </h3>
      <div class="flex gap-[var(--space-2)]">
        <button
          v-for="unit in ['10원', '100원']"
          :key="unit"
          class="h-[var(--control-height-sm)] flex-1 cursor-pointer rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] font-bold text-[var(--color-slate-dark)]"
          type="button"
        >
          {{ unit }}
        </button>
        <button
          class="h-[var(--control-height-sm)] flex-1 cursor-pointer rounded-[var(--radius-lg)] border border-[var(--color-navy)] bg-[var(--color-navy)] font-bold text-[var(--color-white)]"
          type="button"
        >
          1,000원
        </button>
      </div>

      <section
        class="mt-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-olive-surface)] p-[var(--space-4)] text-[var(--color-olive-dark)]"
      >
        <b class="block">예시</b>
        <strong
          class="mt-[var(--space-2)] block text-[length:var(--font-sm)] leading-snug"
        >
          31,275원 결제 시, 1,000원 미만 끝자리 275원이 자동으로 저금통에
          적립돼요
        </strong>
        <span
          class="mt-[var(--space-1)] block text-[length:var(--font-xs)] text-[var(--color-olive-muted)]"
        >결제 금액 자체는 그대로 나가고, 잔돈만 별도로 모여요</span>
      </section>

      <div
        class="mb-[var(--space-3)] mt-[var(--space-7)] border-t border-[var(--color-border)] pt-[var(--space-3)] text-center text-[length:var(--font-sm)] text-[var(--color-slate-muted)]"
      >
        자동 기부
      </div>
      <section
        class="relative rounded-[var(--radius-xl)] bg-[var(--color-surface)] py-[var(--space-4)] pl-[var(--space-4)] pr-[calc(var(--header-height)+var(--space-4))]"
      >
        <b class="block">매달 자동으로 기부하기</b>
        <span
          class="mt-[var(--space-2)] block text-[length:var(--font-xs)] text-[var(--color-slate-muted)]"
        >매월 말일, 모인 잔돈을 선택한 기부처로 자동 전달해요</span>
        <button
          class="absolute right-[var(--space-4)] top-[var(--space-5)] h-6 w-11 cursor-pointer rounded-full border-0 bg-[var(--color-border)] px-1 text-right text-[length:var(--font-xs)] text-[var(--color-white)]"
          :class="{ 'bg-[var(--color-olive)] text-left': autoDonate }"
          type="button"
          :aria-pressed="autoDonate"
          @click="autoDonate = !autoDonate"
        >
          ●
        </button>
      </section>
      <button
        class="mt-[var(--space-5)] h-[var(--control-height-lg)] w-full cursor-pointer rounded-[var(--radius-xl)] border-0 bg-[var(--color-navy)] font-bold text-[var(--color-white)]"
        type="button"
        @click="saveSettings"
      >
        설정 저장하기
      </button>
    </template>
  </main>
  <BottomNavBar v-if="isMain" />
</template>
