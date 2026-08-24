<script setup>
import { computed, onMounted, ref } from 'vue'
import { memberApi } from '@/api/member'

const notificationSettings = ref([
  {
    id: 'payment',
    field: 'paymentEnabled',
    title: '결제 알림',
    description: '결제 시 알림을 보내드려요',
    isEnabled: false,
  },
  {
    id: 'recurring-payment',
    field: 'recurringPaymentEnabled',
    title: '정기 결제 알림',
    description: '정기결제일 3일 전에 미리 알려드려요',
    isEnabled: false,
  },
  {
    id: 'family-share',
    field: 'familyShareEnabled',
    title: '가족 공유 알림',
    description: '공동육아 가족의 입출금·버킷 변경 알림',
    isEnabled: false,
  },
  {
    id: 'community',
    field: 'communityEnabled',
    title: '커뮤니티 알림',
    description: '공동구매 마감·참여 현황 알림',
    isEnabled: false,
  },
  {
    id: 'marketing',
    field: 'marketingEnabled',
    title: '마케팅 정보 수신',
    description: '혜택 · 이벤트 소식을 보내드려요',
    isEnabled: false,
  },
])

const isLoading = ref(true)
const isSaving = ref(false)
const hasLoadedSettings = ref(false)
const errorMessage = ref('')
const isAllEnabled = computed(() =>
  notificationSettings.value.every((setting) => setting.isEnabled),
)
const isInteractionDisabled = computed(
  () => isLoading.value || isSaving.value || !hasLoadedSettings.value,
)

const applySettings = (settings) => {
  notificationSettings.value.forEach((setting) => {
    setting.isEnabled = settings[setting.field] === true
  })
}

const fetchNotificationSettings = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { data } = await memberApi.getNotificationSettings()
    applySettings(data.result ?? data)
    hasLoadedSettings.value = true
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '알림 설정을 불러오지 못했어요. 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
  }
}

const updateSettings = async (payload) => {
  if (isInteractionDisabled.value) return

  errorMessage.value = ''
  isSaving.value = true

  try {
    const { data } = await memberApi.updateNotificationSettings(payload)
    applySettings(data.result ?? data)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '알림 설정을 변경하지 못했어요. 다시 시도해 주세요.'
  } finally {
    isSaving.value = false
  }
}

const handleSettingChange = (setting, event) => {
  updateSettings({ [setting.field]: event.target.checked })
}

const handleAllChange = (event) => {
  const isEnabled = event.target.checked
  updateSettings(
    Object.fromEntries(notificationSettings.value.map((setting) => [setting.field, isEnabled])),
  )
}

onMounted(fetchNotificationSettings)
</script>

<template>
  <main
    class="mx-auto min-h-svh w-full max-w-[390px] bg-(--color-app-bg) px-[22px] pt-[var(--space-4)] pb-[62px]"
    aria-labelledby="notification-settings-title"
  >
    <header>
      <h1
        id="notification-settings-title"
        class="text-(length:--font-2xl) leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        알림 설정
      </h1>
      <p class="mt-[4px] text-(length:--font-md) leading-[1.4] text-(color:--color-slate-muted)">
        필요한 알림만 받아보세요
      </p>
    </header>

    <section
      class="mt-[15px]"
      aria-label="전체 알림 설정"
    >
      <div
        class="flex h-[72px] items-center justify-between rounded-(--radius-2xl) border border-(--color-leaf) bg-(--color-leaf-soft) px-[17px] shadow-(--shadow-card)"
      >
        <span>
          <strong
            class="block text-[13.5px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
          >
            전체 알림
          </strong>
          <span
            class="mt-[4px] block text-[11px] leading-[1.4] text-(color:--color-slate-muted)"
          >
            모든 알림을 한 번에 켜고 꺼요
          </span>
        </span>
        <label
          class="cursor-pointer"
        >
          <input
            :checked="isAllEnabled"
            :disabled="isInteractionDisabled"
            class="peer sr-only"
            type="checkbox"
            role="switch"
            aria-label="전체 알림"
            @change="handleAllChange"
          >
          <span
            class="block relative h-[24px] w-[44px] shrink-0 rounded-full bg-(--color-border) transition-colors after:absolute after:top-[2px] after:left-[2px] after:size-5 after:rounded-full after:bg-(--color-contrast) after:shadow-(--shadow-sm) after:transition-transform peer-checked:bg-(--color-leaf) peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-leaf-dark)"
            aria-hidden="true"
          />
        </label>
      </div>
    </section>

    <section
      class="mt-[14px]"
      aria-labelledby="detail-notification-title"
    >
      <div class="flex items-center gap-[11px]">
        <span class="h-px flex-1 bg-(--color-border)" />
        <h2
          id="detail-notification-title"
          class="shrink-0 text-[10.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-muted)"
        >
          카테고리별 알림
        </h2>
        <span class="h-px flex-1 bg-(--color-border)" />
      </div>

      <div class="mt-[19px] flex flex-col gap-[12px]">
        <div
          v-for="setting in notificationSettings"
          :key="setting.id"
          class="flex min-h-[72px] items-center justify-between rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) px-[17px] py-(--space-3) shadow-(--shadow-card)"
        >
          <span class="min-w-0 pr-4">
            <strong
              class="block text-[13.5px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
            >
              {{ setting.title }}
            </strong>
            <span
              class="mt-[4px] block text-[10.5px] leading-[1.4] text-(color:--color-slate-muted)"
            >
              {{ setting.description }}
            </span>
          </span>
          <label
            class="cursor-pointer"
          >
            <input
              :checked="setting.isEnabled"
              :disabled="isInteractionDisabled"
              class="peer sr-only"
              type="checkbox"
              role="switch"
              :aria-label="setting.title"
              @change="handleSettingChange(setting, $event)"
            >
            <span
              class="block relative h-[24px] w-[44px] shrink-0 rounded-full bg-(--color-border) transition-colors after:absolute after:top-[2px] after:left-[2px] after:size-5 after:rounded-full after:bg-(--color-contrast) after:shadow-(--shadow-sm) after:transition-transform peer-checked:bg-(--color-leaf) peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-leaf-dark)"
              aria-hidden="true"
            />
          </label>
        </div>
      </div>
    </section>

    <p
      v-if="isLoading"
      class="mt-(--space-4) text-center text-(length:--font-sm) text-(color:--color-slate-muted)"
      role="status"
    >
      알림 설정을 불러오는 중이에요.
    </p>
    <div
      v-else-if="errorMessage"
      class="mt-(--space-4) text-center"
      role="alert"
    >
      <p class="text-(length:--font-sm) text-(color:--color-danger-strong)">
        {{ errorMessage }}
      </p>
      <button
        type="button"
        class="mt-(--space-2) rounded-(--radius-md) px-(--space-3) py-(--space-2) text-(length:--font-sm) font-(--font-bold) text-(color:--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
        @click="fetchNotificationSettings"
      >
        다시 시도
      </button>
    </div>
    <p
      v-else-if="isSaving"
      class="mt-(--space-4) text-center text-(length:--font-sm) text-(color:--color-slate-muted)"
      role="status"
    >
      알림 설정을 저장하는 중이에요.
    </p>
  </main>
</template>
