<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SelectableChip from '@/components/common/SelectableChip.vue'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconHeart from '@/components/common/icons/IconHeart.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import IconSearch from '@/components/common/icons/IconSearch.vue'
import IconSettings from '@/components/common/icons/IconSettings.vue'
import IconStar from '@/components/common/icons/IconStar.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'
import StatusVisual from '@/components/common/StatusVisual.vue'
import { donationAmountPresets, donationCategories, savingUnits } from '@/constants/donation'
import { useDonationStore } from '@/stores/donation'
import { formatWon } from '@/utils/bankMeta'

const route = useRoute()
const router = useRouter()
const donationStore = useDonationStore()
const {
  activeCategory,
  amount,
  autoDonate,
  balance,
  impactMessage,
  isLoading,
  monthlySaved,
  piggyBankEnabled,
  savingUnit,
  searchKeyword,
} = storeToRefs(donationStore)

const screen = computed(() => route.meta.step)
const isMain = computed(() => screen.value === 'main')
const hasSavedBalance = computed(() => Number(balance.value) > 0)
const currentCampaign = computed(() => donationStore.currentCampaign)
const draftPiggyBankEnabled = ref(true)
const draftSavingUnit = ref(savingUnits[savingUnits.length - 1])
const draftAutoDonate = ref(false)
const draftCampaignId = ref('')
const draftCampaign = computed(() =>
  donationStore.campaigns.find((campaign) => campaign.id === draftCampaignId.value),
)
const otherCampaigns = computed(() =>
  donationStore.campaigns
    .filter((campaign) => campaign.id !== currentCampaign.value?.id)
    .slice(0, 2),
)

function go(path) {
  router.push(path)
}

/**
 * 화면 간 이동마다 재조회하면 기부·출금으로 차감한 잔액이 되돌아가므로
 * 아직 불러오지 않았을 때만 조회한다. 에러 후 재시도는 스토어를 직접 호출한다.
 */
function loadDonationData() {
  if (donationStore.isInitialized) return

  donationStore.fetchDonationData()
}

function chooseCampaign(campaignId) {
  donationStore.selectCampaign(campaignId)
  go('/donation/give')
}

async function donate() {
  if (await donationStore.donate()) go('/donation/complete')
}

async function saveSettings() {
  const saved = await donationStore.saveSettings({
    piggyBankEnabled: draftPiggyBankEnabled.value,
    savingUnit: draftSavingUnit.value,
    autoDonate: draftAutoDonate.value,
    campaignId: draftAutoDonate.value ? draftCampaignId.value : null,
  })
  if (saved) go('/donation')
}

/**
 * 지갑 잔액을 저금 단위로 깎고 남는 나머지.
 * 31,275원을 1,000원 단위로 깎으면 275원이 저금통으로 간다.
 */
function spareRemainder(amount) {
  if (!draftSavingUnit.value) return 0
  return amount % draftSavingUnit.value
}

watch(
  [screen, () => donationStore.isInitialized],
  ([activeScreen, isInitialized]) => {
    if (activeScreen !== 'settings' || !isInitialized) return
    draftPiggyBankEnabled.value = piggyBankEnabled.value
    draftSavingUnit.value = savingUnit.value
    draftAutoDonate.value = autoDonate.value
    draftCampaignId.value = currentCampaign.value?.id ?? ''
  },
  { immediate: true },
)

onMounted(loadDonationData)
</script>

<template>
  <div
    class="mx-auto box-border w-full max-w-(--content-max-width) bg-(--color-app-bg) px-[var(--space-5)] pt-[var(--space-4)] text-(--color-navy)"
    :class="
      isMain
        ? 'min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] pb-[calc(var(--space-8)+env(safe-area-inset-bottom))]'
        : 'min-h-dvh pb-[calc(var(--space-8)+env(safe-area-inset-bottom))]'
    "
  >
    <section
      v-if="isLoading"
      class="grid min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] place-items-center"
      aria-live="polite"
    >
      <LoadingSpinner />
    </section>

    <section
      v-else-if="donationStore.error"
      class="flex min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] flex-col items-center justify-center text-center"
      role="alert"
    >
      <p class="m-0 text-[length:var(--font-md)] text-(--color-slate-dark)">
        {{ donationStore.error }}
      </p>
      <AppButton
        class="mt-[var(--space-4)]"
        variant="primary"
        size="sm"
        @click="donationStore.fetchDonationData()"
      >
        다시 시도
      </AppButton>
    </section>

    <!-- RF-SI-01 · 짜투리저금통 -->
    <template v-else-if="isMain">
      <header class="relative">
        <button
          class="absolute right-0 top-0 cursor-pointer rounded-(--radius-full) border-0 bg-transparent text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          type="button"
          aria-label="저금통 설정"
          @click="go('/donation/settings')"
        >
          <IconSettings :size="22" />
        </button>
        <strong class="block text-[length:var(--font-2xl)] font-bold text-(--color-navy)">짜투리 저금통</strong>
        <span
          class="mt-[var(--space-1)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
        >{{
          piggyBankEnabled
            ? '매일 밤 지갑 잔돈을 저금통으로 옮겨요'
            : '짜투리저금통 사용이 중지되어 있어요'
        }}</span>
      </header>

      <section
        class="mt-[var(--space-5)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-5)] shadow-(--shadow-card)"
      >
        <b
          class="block text-[length:var(--font-sm)] text-(--color-leaf-dark)"
        >누적 저금액</b>
        <strong
          class="block text-[length:var(--font-3xl)] text-(--color-navy)"
        >{{ formatWon(balance) }}</strong>
        <span
          class="mt-[var(--space-1)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
        >이번 달 {{ formatWon(monthlySaved) }} 모았어요</span>
        <div class="mt-[var(--space-3)] flex gap-[var(--space-3)]">
          <AppButton
            block
            pill
            size="md"
            variant="primary"
            @click="go('/donation/give')"
          >
            기부하기
          </AppButton>
        </div>
        <div class="mt-[var(--space-3)] flex gap-[var(--space-3)]">
          <AppButton
            block
            pill
            size="md"
            variant="secondary"
            @click="go('/donation/deposit')"
          >
            넣기
          </AppButton>
          <AppButton
            block
            pill
            size="md"
            variant="secondary"
            @click="go('/donation/withdraw')"
          >
            지갑으로 출금
          </AppButton>
        </div>
        <div class="mt-[var(--space-4)] border-t border-(--color-border) pt-[var(--space-4)]">
          <div
            v-if="hasSavedBalance"
            class="flex items-center gap-[var(--space-1)]"
          >
            <IconHeart
              class="shrink-0 text-(--color-leaf-dark)"
              :size="16"
            />
            <b class="text-[length:var(--font-sm)] text-(--color-navy)">현재 모인 잔돈으로</b>
          </div>
          <span
            class="block text-[length:var(--font-sm)] text-(--color-slate-dark)"
            :class="hasSavedBalance ? 'mt-[var(--space-1)]' : ''"
          >{{ impactMessage }}</span>
        </div>
      </section>

      <button
        type="button"
        class="mt-[var(--space-3)] flex w-full cursor-pointer items-center gap-[var(--space-3)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)] text-left shadow-(--shadow-card) transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-leaf-dark)"
        aria-label="저금통 설정 상태"
        @click="go('/donation/settings')"
      >
        <div class="min-w-0 flex-1">
          <b class="block text-[length:var(--font-sm)] text-(--color-slate-dark)">
            {{ piggyBankEnabled ? '짜투리 저금 사용 중' : '짜투리 저금 사용 중지' }}
          </b>
          <span
            class="mt-[var(--space-1)] block text-[length:var(--font-xs)] text-(--color-slate-muted)"
          >
            {{
              piggyBankEnabled
                ? `${formatWon(savingUnit)} 단위로 저금하고 있어요`
                : '설정에서 언제든 다시 시작할 수 있어요'
            }}
          </span>
        </div>
        <span
          class="shrink-0 rounded-(--radius-full) px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-xs)] font-bold"
          :class="
            autoDonate
              ? 'bg-(--color-olive-surface) text-(--color-leaf-dark)'
              : 'bg-(--color-surface) text-(--color-slate-dark)'
          "
        >
          자동 기부 {{ autoDonate ? 'ON' : 'OFF' }}
        </span>
        <IconChevronRight
          class="shrink-0 text-(--color-slate-muted)"
          :size="16"
        />
      </button>
    </template>

    <!-- RF-SI-02 · 기부하기 -->
    <template v-else-if="screen === 'give'">
      <h1
        class="mb-[var(--space-7)] text-[length:var(--font-2xl)] font-bold text-(--color-navy)"
      >
        기부하기
      </h1>

      <section
        class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-leaf-soft) px-[var(--space-5)] py-[var(--space-4)] text-(--color-navy) shadow-(--shadow-card)"
      >
        <span
          class="block text-[length:var(--font-sm)] text-(--color-slate-dark)"
        >내 저금통 잔액</span>
        <strong class="block text-[length:var(--font-2xl)]">
          ₩{{ balance.toLocaleString() }}
        </strong>
        <small
          class="block text-[length:var(--font-sm)] text-(--color-slate-dark)"
        >잔돈을 모아 좋은 곳에 전해보세요</small>
      </section>

      <h2
        class="mb-[var(--space-3)] mt-[var(--space-7)] text-[length:var(--font-md)]"
      >
        <span class="inline-flex items-center gap-[var(--space-1)]">
          <IconStar
            class="text-(--color-gold)"
            :size="16"
          />
          선호 기부처
        </span>
      </h2>
      <div class="flex flex-wrap gap-[var(--space-2)]">
        <SelectableChip
          v-for="campaign in donationStore.preferredCampaigns"
          :key="campaign.id"
          :class="currentCampaign?.id !== campaign.id ? 'text-(--color-navy)!' : ''"
          :selected="currentCampaign?.id === campaign.id"
          @click="donationStore.selectCampaign(campaign.id)"
        >
          <IconStar :size="14" />
          {{ campaign.organization }}
        </SelectableChip>
        <button
          class="grid size-[var(--control-height-sm)] cursor-pointer place-items-center rounded-(--radius-full) border border-(--color-border) bg-(--color-surface) text-(--color-slate-dark) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          type="button"
          aria-label="선호 기부처 추가"
          @click="go('/donation/explore')"
        >
          <IconPlus :size="18" />
        </button>
      </div>

      <h2
        class="mb-[var(--space-3)] mt-[var(--space-7)] text-[length:var(--font-md)]"
      >
        이번주 추천 캠페인
      </h2>
      <article
        v-if="currentCampaign"
        class="mt-[var(--space-3)] overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) pb-[var(--space-3)] shadow-(--shadow-card)"
      >
        <div class="grid h-28 place-items-center bg-(--color-leaf-soft)">
          <IconDog
            class="text-(--color-navy)"
            :size="34"
            color="currentColor"
          />
        </div>
        <b
          class="mx-[var(--space-4)] mt-[var(--space-3)] block text-[length:var(--font-sm)] text-(--color-gold-dark)"
        >{{ currentCampaign.organization }}</b>
        <strong
          class="mx-[var(--space-4)] mt-[var(--space-2)] block text-[length:var(--font-md)]"
        >{{ currentCampaign.title }}</strong>
        <div
          class="mx-[var(--space-4)] mt-[var(--space-3)] h-1.5 overflow-hidden rounded-(--radius-full) bg-(--color-border)"
          role="progressbar"
          :aria-valuenow="currentCampaign.progress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <i
            class="block h-full rounded-(--radius-full) bg-(--color-gold)"
            :style="{ width: `${currentCampaign.progress}%` }"
          />
        </div>
        <small
          class="mx-[var(--space-4)] mt-[var(--space-3)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
        >
          {{ formatWon(currentCampaign.raised) }} 모금 · 참여
          {{ currentCampaign.participants.toLocaleString() }}명
          <em
            class="float-right not-italic text-(--color-gold-dark)"
          >{{ currentCampaign.progress }}% · D-{{ currentCampaign.daysLeft }}</em>
        </small>
      </article>

      <h3
        class="mb-[var(--space-3)] mt-[var(--space-6)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
      >
        기부 금액 선택
      </h3>
      <div class="flex gap-[var(--space-2)]">
        <SelectableChip
          v-for="preset in donationAmountPresets"
          :key="preset"
          block
          shape="rounded"
          :selected="amount === preset"
          :disabled="preset > balance"
          @click="donationStore.setAmount(preset)"
        >
          {{ formatWon(preset) }}
        </SelectableChip>
        <SelectableChip
          block
          shape="rounded"
          :selected="amount === balance && balance > 0"
          :disabled="balance <= 0"
          @click="donationStore.setAmount(balance)"
        >
          전액
        </SelectableChip>
      </div>
      <p
        v-if="currentCampaign && !donationStore.isCurrentCampaignDonatable"
        class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-(--color-danger-strong)"
        role="alert"
      >
        시연용 캠페인이라 실제 기부는 할 수 없어요.
      </p>
      <p
        v-else-if="!donationStore.canDonate"
        class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-(--color-danger-strong)"
        role="alert"
      >
        잔액 안에서 기부 금액을 선택해주세요.
      </p>

      <div
        class="mb-[var(--space-3)] mt-[var(--space-6)] flex items-center justify-between"
      >
        <h3 class="m-0 text-[length:var(--font-sm)] text-(--color-slate-dark)">
          다른 기부처 둘러보기
        </h3>
        <AppButton
          variant="ghost"
          size="sm"
          @click="go('/donation/explore')"
        >
          더보기 ›
        </AppButton>
      </div>
      <ul class="m-0 list-none space-y-[var(--space-2)] p-0">
        <li
          v-for="campaign in otherCampaigns"
          :key="campaign.id"
        >
          <button
            class="flex w-full cursor-pointer items-center gap-[var(--space-3)] rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-3)] text-left text-(--color-navy) shadow-(--shadow-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-leaf)"
            type="button"
            @click="donationStore.selectCampaign(campaign.id)"
          >
            <span
              class="grid size-10 shrink-0 place-items-center rounded-(--radius-icon) bg-(--color-border)"
            >
              <IconDog
                class="text-(--color-navy)"
                :size="20"
                color="currentColor"
              />
            </span>
            <span class="min-w-0 flex-1">
              <strong
                class="block truncate text-[length:var(--font-sm)]"
              >{{ campaign.title }}</strong>
              <span
                class="block text-[length:var(--font-sm)] text-(--color-slate-muted)"
              >{{ campaign.organization }}</span>
            </span>
            <em
              class="shrink-0 not-italic text-[length:var(--font-sm)] text-(--color-gold-dark)"
            >{{ campaign.progress }}%</em>
          </button>
        </li>
      </ul>

      <AppButton
        class="mt-[var(--space-5)]"
        block
        size="lg"
        variant="primary"
        :disabled="!donationStore.canDonate"
        @click="go('/donation/confirm')"
      >
        저금통에서 {{ formatWon(amount) }} 기부하기
      </AppButton>
    </template>

    <!-- RF-SI-03 · 기부확인 -->
    <template v-else-if="screen === 'confirm'">
      <section class="pt-[var(--space-2)] text-center">
        <StatusVisual
          variant="danger"
          class="mx-auto mt-[45px]"
        />
        <h1 class="mt-[10px] text-[length:var(--font-2xl)] font-bold text-(--color-navy)">
          {{ formatWon(amount) }}을 기부할까요?
        </h1>
        <p
          class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
        >
          기부는 완료 후 취소할 수 없어요
        </p>

        <div
          v-if="currentCampaign"
          class="mt-[var(--space-7)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-4)] text-left shadow-(--shadow-card)"
        >
          <b class="block">{{ currentCampaign.organization }}</b>
          <span
            class="mt-[var(--space-2)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
          >{{ currentCampaign.title }}</span>
          <hr class="my-[var(--space-3)] border-0 border-t border-(--color-border)">
          <div
            class="flex justify-between text-[length:var(--font-sm)] text-(--color-slate-dark)"
          >
            <span>기부 금액</span>
            <strong class="text-[length:var(--font-md)] font-bold">{{ formatWon(amount) }}</strong>
          </div>
        </div>

        <div
          class="mx-[var(--space-3)] my-[var(--space-7)] flex justify-between text-[length:var(--font-sm)] text-(--color-slate-dark)"
        >
          <span>기부 후 저금통 잔액</span>
          <strong class="text-[length:var(--font-md)] font-bold">{{ formatWon(donationStore.balanceAfterDonation) }}</strong>
        </div>
        <p
          v-if="currentCampaign && !donationStore.isCurrentCampaignDonatable"
          class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-(--color-danger-strong)"
          role="alert"
        >
          시연용 캠페인이라 실제 기부는 할 수 없어요.
        </p>
        <p
          v-else-if="!donationStore.canDonate"
          class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-(--color-danger-strong)"
          role="alert"
        >
          잔액이 부족해 기부할 수 없어요.
        </p>
        <p
          v-if="donationStore.operationError"
          class="mt-[var(--space-2)] text-[length:var(--font-sm)] text-(--color-danger-strong)"
          role="alert"
        >
          {{ donationStore.operationError }}
        </p>
        <div class="flex gap-[var(--space-3)]">
          <AppButton
            block
            size="lg"
            variant="neutral"
            class="bg-(--color-white)!"
            @click="go('/donation/give')"
          >
            취소
          </AppButton>
          <AppButton
            block
            size="lg"
            variant="primary"
            :disabled="!donationStore.canDonate || donationStore.isSubmitting"
            :loading="donationStore.isSubmitting"
            @click="donate"
          >
            기부하기
          </AppButton>
        </div>
      </section>
    </template>

    <!-- RF-SI-04 · 기부완료 -->
    <template v-else-if="screen === 'complete'">
      <section class="flex min-h-[calc(100svh-var(--header-height)-var(--bottom-nav-height)-var(--space-8))] flex-col items-center text-center">
        <StatusVisual
          size="126"
          class="mt-auto"
        />
        <h1 class="m-0 mt-(--space-7) text-[length:var(--font-2xl)] font-bold text-(--color-navy)">
          기부해주셔서 감사해요
        </h1>
        <p
          class="mt-[var(--space-2)] text-[length:var(--font-md)] text-(--color-slate-muted)"
        >
          {{ currentCampaign?.organization }}에 {{ formatWon(amount) }}을
          전달했어요
        </p>
        <AppButton
          class="mt-auto mb-(--space-3) !rounded-[20px]"
          block
          size="lg"
          variant="primary"
          @click="go('/donation')"
        >
          저금통으로 돌아가기
        </AppButton>
      </section>
    </template>

    <!-- RF-SI-05 · 기부처둘러보기 -->
    <template v-else-if="screen === 'explore'">
      <h1
        class="mb-[var(--space-2)] text-[length:var(--font-2xl)] font-bold text-(--color-navy)"
      >
        기부처 둘러보기
      </h1>
      <p class="m-0 text-[length:var(--font-md)] text-(--color-slate-muted)">
        우리 아이들을 위한 캠페인을 만나보세요
      </p>

      <div class="my-[var(--space-5)]">
        <AppInput
          :model-value="searchKeyword"
          label="기부처 검색"
          placeholder="기부처 · 캠페인 검색"
          type="search"
          @update:model-value="donationStore.setSearchKeyword($event)"
        />
      </div>

      <div class="flex flex-wrap gap-[var(--space-2)]">
        <SelectableChip
          v-for="category in donationCategories"
          :key="category"
          :selected="activeCategory === category"
          @click="donationStore.setCategory(category)"
        >
          {{ category }}
        </SelectableChip>
      </div>

      <div
        v-if="donationStore.filteredCampaigns.length"
        class="mt-[var(--space-5)] grid grid-cols-2 gap-[var(--space-3)]"
      >
        <article
          v-for="item in donationStore.filteredCampaigns"
          :key="item.id"
          class="relative overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) text-(--color-navy) shadow-(--shadow-card)"
        >
          <button
            class="w-full cursor-pointer p-0 pb-[var(--space-3)] text-left text-inherit focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-leaf)"
            type="button"
            @click="chooseCampaign(item.id)"
          >
            <span class="grid h-24 place-items-center bg-(--color-leaf-soft)">
              <IconDog
                class="text-(--color-navy)"
                :size="30"
                color="currentColor"
              />
            </span>
            <b
              class="mx-[var(--space-3)] mt-[var(--space-2)] block text-[length:var(--font-sm)] text-(--color-gold-dark)"
            >{{ item.organization }}</b>
            <strong
              class="mx-[var(--space-3)] mt-[var(--space-2)] block text-[length:var(--font-sm)]"
            >{{ item.title }}</strong>
            <span
              class="mx-[var(--space-3)] mt-[var(--space-3)] block h-1.5 overflow-hidden rounded-(--radius-full) bg-(--color-border)"
              role="progressbar"
              :aria-valuenow="item.progress"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <i
                class="block h-full rounded-(--radius-full) bg-(--color-gold)"
                :style="{ width: `${item.progress}%` }"
              />
            </span>
            <small
              class="mx-[var(--space-3)] mt-[var(--space-2)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
            >{{ item.progress }}% 달성</small>
          </button>
          <button
            type="button"
            class="absolute right-[var(--space-2)] top-[var(--space-2)] grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-(--color-card-border) bg-(--color-white) text-(--color-leaf-dark) shadow-(--shadow-sm) disabled:cursor-wait disabled:opacity-60"
            :aria-label="item.preferred ? `${item.organization} 선호 기부처 해제` : `${item.organization} 선호 기부처 등록`"
            :aria-pressed="item.preferred"
            :disabled="donationStore.preferenceUpdatingIds.includes(item.organizationId)"
            @click="donationStore.togglePreference(item)"
          >
            <IconHeart
              :size="20"
              color="currentColor"
              :class="item.preferred ? 'fill-(--color-leaf)' : 'fill-none'"
            />
          </button>
        </article>
      </div>
      <EmptyState
        v-else
        :icon="IconSearch"
        :message="
          donationStore.isFiltering
            ? '조건에 맞는 기부처가 없어요. 검색어나 분류를 바꿔보세요.'
            : '등록된 기부처가 아직 없어요.'
        "
      />
      <p
        v-if="donationStore.operationError"
        class="mt-[var(--space-3)] text-[length:var(--font-sm)] text-(--color-danger-strong)"
        role="alert"
      >
        {{ donationStore.operationError }}
      </p>
    </template>

    <!-- RF-SI-06 · 저금통설정 -->
    <template v-else-if="screen === 'settings'">
      <h1
        class="mb-[var(--space-2)] text-[length:var(--font-2xl)] font-bold text-(--color-navy)"
      >
        저금통 설정
      </h1>
      <p class="m-0 text-[length:var(--font-md)] text-(--color-slate-muted)">
        짜투리 저금 방식을 설정해요
      </p>

      <section
        class="mt-[var(--space-5)] flex items-center gap-[var(--space-4)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-5)] shadow-(--shadow-card)"
      >
        <div class="min-w-0 flex-1">
          <b class="block">짜투리 저금통 사용</b>
          <span
            class="mt-[var(--space-1)] block text-[length:var(--font-xs)] text-(--color-slate-muted)"
          >매일 밤, 애월지갑 잔액의 나머지를 저금통으로 옮겨요</span>
        </div>
        <ToggleSwitch
          :model-value="draftPiggyBankEnabled"
          :disabled="donationStore.isSubmitting"
          label="짜투리 저금통 사용"
          @update:model-value="draftPiggyBankEnabled = $event"
        />
      </section>

      <template v-if="draftPiggyBankEnabled">
        <section
          class="mt-[var(--space-4)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-5)] shadow-(--shadow-card)"
        >
          <h3 class="m-0 text-[length:var(--font-md)] font-bold text-(--color-navy)">
            저금 단위
          </h3>
          <p class="mb-[var(--space-4)] mt-[var(--space-1)] text-[length:var(--font-xs)] text-(--color-slate-muted)">
            매일 깎을 자릿수를 선택해 주세요
          </p>
          <div class="flex gap-[var(--space-2)]">
            <SelectableChip
              v-for="unit in savingUnits"
              :key="unit"
              block
              shape="rounded"
              :selected="draftSavingUnit === unit"
              :disabled="donationStore.isSubmitting"
              @click="draftSavingUnit = unit"
            >
              {{ formatWon(unit) }}
            </SelectableChip>
          </div>

          <div
            class="mt-[var(--space-4)] rounded-[var(--radius-lg)] bg-(--color-olive-surface) p-[var(--space-4)]"
          >
            <b class="block text-[length:var(--font-sm)] text-(--color-leaf-dark)">이렇게 모여요</b>
            <strong
              class="mt-[var(--space-2)] block text-[length:var(--font-sm)] leading-snug text-(--color-navy)"
            >
              지갑에 31,275원이 있으면, {{ formatWon(draftSavingUnit) }} 단위로 깎아
              {{ formatWon(spareRemainder(31275)) }}이 저금통으로 옮겨지고
              지갑에는 {{ formatWon(31275 - spareRemainder(31275)) }}이 남아요
            </strong>
            <span
              class="mt-[var(--space-1)] block text-[length:var(--font-xs)] text-(--color-slate-dark)"
            >매일 밤 한 번, 직접 넣을 수도 있어요</span>
          </div>
        </section>

        <section
          class="mt-[var(--space-4)] rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-[var(--space-5)] shadow-(--shadow-card)"
        >
          <div class="flex items-center gap-[var(--space-4)]">
            <div class="min-w-0 flex-1">
              <b class="block text-[length:var(--font-md)] text-(--color-navy)">매달 자동으로 기부하기</b>
              <span
                class="mt-[var(--space-1)] block text-[length:var(--font-xs)] text-(--color-slate-muted)"
              >매월 말일, 모인 잔돈을 선택한 기부처로 전달해요</span>
            </div>
            <ToggleSwitch
              :model-value="draftAutoDonate"
              :disabled="donationStore.isSubmitting"
              label="매달 자동으로 기부하기"
              @update:model-value="draftAutoDonate = $event"
            />
          </div>

        <template v-if="draftAutoDonate">
          <h3
            class="mb-[var(--space-3)] mt-[var(--space-5)] border-t border-(--color-border) pt-[var(--space-4)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
          >
            자동 기부 캠페인
          </h3>
          <div
            v-if="donationStore.hasCampaigns"
            class="flex flex-wrap gap-[var(--space-2)]"
          >
            <SelectableChip
              v-for="campaign in donationStore.campaigns"
              :key="campaign.id"
              :selected="draftCampaignId === campaign.id"
              :disabled="donationStore.isSubmitting || campaign.donatable === false"
              @click="draftCampaignId = campaign.id"
            >
              {{ campaign.organization }} · {{ campaign.title }}
            </SelectableChip>
          </div>
          <p
            v-else
            class="m-0 text-[length:var(--font-sm)] text-(--color-danger-strong)"
            role="alert"
          >
            자동 기부로 선택할 수 있는 진행 중 캠페인이 없어요.
          </p>
        </template>
        </section>
      </template>

      <AppButton
        class="mt-[var(--space-5)]"
        block
        size="lg"
        variant="primary"
        :disabled="donationStore.isSubmitting || (draftPiggyBankEnabled && draftAutoDonate && !draftCampaign)"
        :loading="donationStore.isSubmitting"
        @click="saveSettings"
      >
        설정 저장하기
      </AppButton>
      <p
        v-if="donationStore.operationError"
        class="mt-[var(--space-3)] text-center text-[length:var(--font-sm)] text-(--color-danger-strong)"
        role="alert"
      >
        {{ donationStore.operationError }}
      </p>
    </template>

    <section
      v-else
      class="grid min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] place-items-center"
    >
      <EmptyState
        :icon="IconWarning"
        message="요청한 화면을 찾을 수 없어요."
        action-text="저금통으로 돌아가기"
        action-route="/donation"
      />
    </section>
  </div>
</template>
