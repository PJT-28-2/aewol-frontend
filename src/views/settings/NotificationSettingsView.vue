<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconChevronLeft from '@/components/common/icons/IconChevronLeft.vue'

const router = useRouter()

const notificationSettings = ref([
  {
    id: 'payment',
    title: '결제 알림',
    description: '결제 시 알림을 보내드려요',
    isEnabled: true,
  },
  {
    id: 'recurring-payment',
    title: '정기 결제 알림',
    description: '정기결제일 3일 전에 미리 알려드려요',
    isEnabled: true,
  },
  {
    id: 'family-share',
    title: '가족 공유 알림',
    description: '공동양육 가족의 입출금·버킷 변경 알림',
    isEnabled: true,
  },
  {
    id: 'community',
    title: '커뮤니티 알림',
    description: '공동구매 마감·참여 현황 알림',
    isEnabled: false,
  },
  {
    id: 'marketing',
    title: '마케팅 정보 수신',
    description: '혜택 · 이벤트 소식을 보내드려요',
    isEnabled: false,
  },
])

const isAllEnabled = computed({
  get: () => notificationSettings.value.every((setting) => setting.isEnabled),
  set: (isEnabled) => {
    notificationSettings.value.forEach((setting) => {
      setting.isEnabled = isEnabled
    })
  },
})

const handleBack = () => {
  router.back()
}
</script>

<template>
  <main
    class="mx-auto min-h-svh w-full max-w-[390px] rounded-[40px] bg-(--color-white) px-[22px] pt-[67px] pb-[62px]"
    aria-labelledby="notification-settings-title"
  >
    <header>
      <button
        class="-ml-[7px] flex size-[24px] items-center justify-center rounded-full text-(color:--color-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
        type="button"
        aria-label="뒤로 가기"
        @click="handleBack"
      >
        <IconChevronLeft :size="18" />
      </button>
      <h1
        id="notification-settings-title"
        class="mt-[7px] text-[20px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
      >
        알림 설정
      </h1>
      <p class="mt-[4px] text-[12px] leading-[1.4] text-(color:--color-slate-muted)">
        필요한 알림만 받아보세요
      </p>
    </header>

    <section
      class="mt-[15px]"
      aria-label="전체 알림 설정"
    >
      <div
        class="flex h-[66px] items-center justify-between rounded-[14px] bg-(--color-surface) px-[17px]"
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
          aria-label="전체 알림"
        >
          <input
            v-model="isAllEnabled"
            class="peer sr-only"
            type="checkbox"
            role="switch"
          >
          <span
            class="block relative h-[24px] w-[44px] shrink-0 rounded-full bg-(--color-border) transition-colors after:absolute after:top-[2px] after:left-[2px] after:size-5 after:rounded-full after:bg-(--color-white) after:shadow-(--shadow-sm) after:transition-transform peer-checked:bg-(--color-gold) peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-navy)"
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
          class="flex h-[66px] items-center justify-between rounded-[14px] border border-(--color-border) px-[17px]"
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
            :aria-label="setting.title"
          >
            <input
              v-model="setting.isEnabled"
              class="peer sr-only"
              type="checkbox"
              role="switch"
            >
            <span
              class="block relative h-[24px] w-[44px] shrink-0 rounded-full bg-(--color-border) transition-colors after:absolute after:top-[2px] after:left-[2px] after:size-5 after:rounded-full after:bg-(--color-white) after:shadow-(--shadow-sm) after:transition-transform peer-checked:bg-(--color-gold) peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-navy)"
              aria-hidden="true"
            />
          </label>
        </div>
      </div>
    </section>
  </main>
</template>
