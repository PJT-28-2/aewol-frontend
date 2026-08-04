<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SelectableChip from '@/components/common/SelectableChip.vue'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconHeart from '@/components/common/icons/IconHeart.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import IconSearch from '@/components/common/icons/IconSearch.vue'
import IconSettings from '@/components/common/icons/IconSettings.vue'
import IconStar from '@/components/common/icons/IconStar.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'
import donationCompleteImage from '@/assets/images/donation-complete.png'
import donationConfirmImage from '@/assets/images/donation-confirm.png'
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
const currentCampaign = computed(() => donationStore.currentCampaign)
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
  if (await donationStore.saveSettings()) go('/donation')
}

onMounted(loadDonationData)
</script>

<template>
  <div
    class="mx-auto w-full max-w-(--content-max-width) box-border bg-(--color-white) px-[var(--space-5)] pt-[var(--space-4)] text-(--color-navy)"
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
        variant="navy"
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
          <IconSettings :size="20" />
        </button>
        <strong class="block text-[length:var(--font-2xl)] font-bold text-(--color-navy)">짜투리 저금통</strong>
        <span
          class="mt-[var(--space-1)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
        >{{
          piggyBankEnabled
            ? '결제할 때마다 잔돈이 자동으로 모여요'
            : '짜투리저금통 사용이 중지되어 있어요'
        }}</span>
      </header>

      <section
        class="mt-[var(--space-5)] rounded-[var(--radius-xl)] bg-(--color-olive-surface) p-[var(--space-5)]"
      >
        <b
          class="block text-[length:var(--font-sm)] text-(--color-olive)"
        >누적 저금액</b>
        <strong
          class="block text-[length:var(--font-3xl)] text-(--color-olive)"
        >{{ formatWon(balance) }}</strong>
        <span
          class="block text-[length:var(--font-sm)] text-(--color-olive)"
        >이번 달 {{ formatWon(monthlySaved) }} 모았어요</span>
        <div class="mt-[var(--space-3)] flex gap-[var(--space-3)]">
          <AppButton
            block
            pill
            size="sm"
            variant="olive"
            @click="go('/donation/give')"
          >
            기부하기
          </AppButton>
          <AppButton
            block
            pill
            size="sm"
            variant="olive-outline"
            @click="go('/donation/withdraw')"
          >
            지갑으로 출금
          </AppButton>
        </div>
      </section>

      <section
        class="mt-[var(--space-5)] flex flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] bg-(--color-surface) p-[var(--space-4)]"
      >
        <div class="flex items-center gap-[var(--space-1)]">
          <IconHeart
            class="shrink-0 text-(--color-olive)"
            :size="16"
          />
          <b class="text-[length:var(--font-sm)] text-(--color-slate-dark)">지금까지 모은 잔돈으로</b>
        </div>
        <span
          class="text-[length:var(--font-xs)] text-(--color-slate-muted)"
        >{{ impactMessage }}</span>
      </section>

      <section
        class="mt-[var(--space-3)] flex items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-(--color-border) p-[var(--space-4)]"
        aria-label="저금통 설정 상태"
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
              ? 'bg-(--color-olive-surface) text-(--color-olive)'
              : 'bg-(--color-surface) text-(--color-slate-dark)'
          "
        >
          자동 기부 {{ autoDonate ? 'ON' : 'OFF' }}
        </span>
      </section>
    </template>

    <!-- RF-SI-02 · 기부하기 -->
    <template v-else-if="screen === 'give'">
      <h1
        class="mb-[var(--space-7)] text-[length:var(--font-2xl)] font-bold text-(--color-navy)"
      >
        기부하기
      </h1>

      <section
        class="rounded-[var(--radius-xl)] bg-(--color-navy) px-[var(--space-5)] py-[var(--space-3)] text-(--color-white)"
      >
        <span
          class="block text-[length:var(--font-sm)] text-(--color-slate-light)"
        >내 저금통 잔액</span>
        <strong class="block text-[length:var(--font-2xl)]">
          ₩{{ balance.toLocaleString() }}
        </strong>
        <small
          class="block text-[length:var(--font-sm)] text-(--color-slate-light)"
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
        class="mt-[var(--space-3)] overflow-hidden rounded-[var(--radius-xl)] bg-(--color-surface) pb-[var(--space-3)]"
      >
        <div class="grid h-28 place-items-center bg-(--color-border)">
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
        v-if="!donationStore.canDonate"
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
            class="flex w-full cursor-pointer items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border-0 bg-(--color-surface) p-[var(--space-3)] text-left text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
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
        variant="navy"
        :disabled="!donationStore.canDonate"
        @click="go('/donation/confirm')"
      >
        저금통에서 {{ formatWon(amount) }} 기부하기
      </AppButton>
    </template>

    <!-- RF-SI-03 · 기부확인 -->
    <template v-else-if="screen === 'confirm'">
      <section class="pt-[var(--space-2)] text-center">
        <img
          class="mx-auto mt-[45px] size-[139px] object-contain"
          :src="donationConfirmImage"
          alt=""
        >
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
          class="mt-[var(--space-7)] rounded-[var(--radius-xl)] bg-(--color-surface) p-[var(--space-4)] text-left"
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
          v-if="!donationStore.canDonate"
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
            variant="secondary"
            class="border-(--color-border)!"
            @click="go('/donation/give')"
          >
            취소
          </AppButton>
          <AppButton
            block
            size="lg"
            variant="navy"
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
      <section class="pt-32 text-center">
        <img
          class="mx-auto mb-[var(--space-6)] size-[160px] object-contain"
          :src="donationCompleteImage"
          alt=""
        >
        <h1 class="m-0 text-[length:var(--font-2xl)] font-bold text-(--color-navy)">
          기부해주셔서 감사해요
        </h1>
        <p
          class="mt-[var(--space-2)] text-[length:var(--font-md)] text-(--color-slate-muted)"
        >
          {{ currentCampaign?.organization }}에 {{ formatWon(amount) }}을
          전달했어요
        </p>
        <AppButton
          class="mt-[var(--space-5)]"
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
        <button
          v-for="item in donationStore.filteredCampaigns"
          :key="item.id"
          class="cursor-pointer overflow-hidden rounded-[var(--radius-xl)] border-0 bg-(--color-surface) p-0 text-left text-(--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          type="button"
          @click="chooseCampaign(item.id)"
        >
          <span class="grid h-24 place-items-center bg-(--color-border)">
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
            class="mx-[var(--space-3)] mb-[var(--space-3)] mt-[var(--space-2)] block text-[length:var(--font-sm)] text-(--color-slate-muted)"
          >{{ item.progress }}% 달성</small>
        </button>
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
        class="mt-[var(--space-5)] flex items-start gap-[var(--space-4)] rounded-[var(--radius-xl)] bg-(--color-surface) p-[var(--space-4)]"
      >
        <div class="min-w-0 flex-1">
          <b class="block">짜투리 저금통 사용</b>
          <span
            class="mt-[var(--space-1)] block text-[length:var(--font-xs)] text-(--color-slate-muted)"
          >결제할 때마다 잔돈을 자동으로 모아요</span>
        </div>
        <ToggleSwitch
          :model-value="piggyBankEnabled"
          :disabled="donationStore.isSubmitting"
          label="짜투리 저금통 사용"
          @update:model-value="donationStore.setPiggyBankEnabled($event)"
        />
      </section>

      <h3
        class="mb-[var(--space-3)] mt-[var(--space-6)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
      >
        저금 단위
      </h3>
      <div class="flex gap-[var(--space-2)]">
        <SelectableChip
          v-for="unit in savingUnits"
          :key="unit"
          block
          shape="rounded"
          :selected="savingUnit === unit"
          :disabled="donationStore.isSubmitting"
          @click="donationStore.setSavingUnit(unit)"
        >
          {{ formatWon(unit) }}
        </SelectableChip>
      </div>

      <section
        class="mt-[var(--space-4)] rounded-[var(--radius-lg)] bg-(--color-olive-surface) p-[var(--space-4)] text-(--color-olive)"
      >
        <b class="block">예시</b>
        <strong
          class="mt-[var(--space-2)] block text-[length:var(--font-sm)] leading-snug"
        >
          31,275원 결제 시, {{ formatWon(savingUnit) }} 미만 잔돈인
          {{ formatWon(31275 % savingUnit) }}이 자동으로 저금통에 쌓여요
        </strong>
        <span
          class="mt-[var(--space-1)] block text-[length:var(--font-sm)] text-(--color-olive)"
        >결제 금액 자체는 그대로 나가고, 잔돈만 별도로 모여요</span>
      </section>

      <h3
        class="mb-[var(--space-3)] mt-[var(--space-6)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
      >
        자동 기부
      </h3>
      <section
        class="flex items-start gap-[var(--space-4)] rounded-[var(--radius-xl)] bg-(--color-surface) p-[var(--space-4)]"
      >
        <div class="min-w-0 flex-1">
          <b class="block">매달 자동으로 기부하기</b>
          <span
            class="mt-[var(--space-1)] block text-[length:var(--font-xs)] text-(--color-slate-muted)"
          >매월 말일, 모인 잔돈을 선택한 기부처로 자동 전달해요</span>
        </div>
        <ToggleSwitch
          :model-value="autoDonate"
          :disabled="donationStore.isSubmitting"
          label="매달 자동으로 기부하기"
          @update:model-value="donationStore.setAutoDonate($event)"
        />
      </section>

      <template v-if="autoDonate">
        <h3
          class="mb-[var(--space-3)] mt-[var(--space-5)] text-[length:var(--font-sm)] text-(--color-slate-dark)"
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
            :selected="currentCampaign?.id === campaign.id"
            :disabled="donationStore.isSubmitting"
            @click="donationStore.selectCampaign(campaign.id)"
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

      <AppButton
        class="mt-[var(--space-5)]"
        block
        size="lg"
        variant="primary"
        :disabled="donationStore.isSubmitting || (autoDonate && !currentCampaign)"
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
