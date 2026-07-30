<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import IconAccountCard from '@/components/common/icons/IconAccountCard.vue'
import IconChevronLeft from '@/components/common/icons/IconChevronLeft.vue'
import IconDiscussion from '@/components/common/icons/IconDiscussion.vue'
import IconNotificationBell from '@/components/common/icons/IconNotificationBell.vue'
import IconPetProfile from '@/components/common/icons/IconPetProfile.vue'
import IconProfileEdit from '@/components/common/icons/IconProfileEdit.vue'
import IconRecurring from '@/components/common/icons/IconRecurring.vue'

const router = useRouter()
const authStore = useAuthStore()
const showPasswordModal = ref(false)
const showLogoutModal = ref(false)
const profilePassword = ref('')
const passwordError = ref('')
const isVerifying = ref(false)
const PROFILE_VERIFIED_KEY = 'profileEditPasswordVerified'
const MOCK_CURRENT_PASSWORD = 'test1234'

const menuItems = [
  {
    title: '반려동물 관리',
    description: '반려동물 프로필 등록 및 수정',
    path: '/pets',
    icon: IconPetProfile,
  },
  {
    title: '프로필 수정',
    description: '이름 · 전화번호 · 비밀번호 변경 · 회원탈퇴',
    action: 'verifyProfile',
    icon: IconProfileEdit,
  },
  {
    title: '알림 설정',
    description: '푸시 알림 켜기 / 끄기',
    path: '/settings/notifications',
    icon: IconNotificationBell,
  },
  {
    title: '계좌 관리',
    description: '연동된 계좌 확인 및 등록',
    path: '/accounts',
    icon: IconAccountCard,
  },
  {
    title: '정기 결제 관리',
    description: '구독형 결제 내역 확인',
    path: '/payment/recurring',
    icon: IconRecurring,
  },
  {
    title: '고객센터',
    description: '자주 묻는 질문 및 문의',
    path: '/support',
    icon: IconDiscussion,
  },
]

const handleMenuClick = (item) => {
  if (item.action === 'verifyProfile') {
    profilePassword.value = ''
    passwordError.value = ''
    showPasswordModal.value = true
    return
  }

  if (item.path) {
    router.push(item.path)
  }
}

const verifyProfilePassword = async () => {
  passwordError.value = ''
  isVerifying.value = true

  try {
    if (!import.meta.env.DEV) {
      passwordError.value = '비밀번호 확인 API 연동 예정입니다.'
      return
    }

    if (profilePassword.value !== MOCK_CURRENT_PASSWORD) {
      passwordError.value = '현재 비밀번호가 일치하지 않습니다.'
      return
    }

    window.sessionStorage.setItem(PROFILE_VERIFIED_KEY, 'true')
    showPasswordModal.value = false
    await router.push('/settings/profile')
  } catch (error) {
    passwordError.value =
      error.response?.data?.message ?? '현재 비밀번호가 일치하지 않습니다.'
  } finally {
    isVerifying.value = false
  }
}

const handleLogout = () => {
  showLogoutModal.value = true
}

const confirmLogout = () => {
  showLogoutModal.value = false
  authStore.logout()
}
</script>

<template>
  <section
    class="mx-auto min-h-[calc(100svh-var(--bottom-nav-height))] w-full max-w-[390px] bg-(--color-white) px-[22px] pt-[61px] pb-[27px]"
    aria-labelledby="mypage-title"
  >
    <header class="flex items-start justify-between">
      <div>
        <h1
          id="mypage-title"
          class="text-[20px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
        >
          마이페이지
        </h1>
        <p class="mt-[5px] text-[12.5px] leading-[1.3] text-(color:--color-slate-muted)">
          계정과 반려동물 정보를 관리해요
        </p>
      </div>
      <button
        class="mt-[5px] text-[11.5px] leading-[1.3] font-(--font-bold) text-(color:--color-slate-muted) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-navy)"
        type="button"
        @click="handleLogout"
      >
        로그아웃
      </button>
    </header>

    <article
      class="mt-[25px] flex h-[94px] items-center gap-[14px] rounded-[18px] bg-(--color-surface) px-4"
      aria-label="회원 정보"
    >
      <div
        class="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-(--color-navy) text-[20px] font-(--font-bold) text-(color:--color-white)"
        aria-hidden="true"
      >
        애
      </div>
      <div class="min-w-0">
        <p class="truncate text-[15px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)">
          김애월
        </p>
        <p class="mt-[5px] truncate text-[12px] leading-[1.3] text-(color:--color-slate-muted)">
          example@aewol.com
        </p>
      </div>
    </article>

    <nav
      class="mt-6 flex flex-col gap-[11px]"
      aria-label="마이페이지 메뉴"
    >
      <button
        v-for="item in menuItems"
        :key="item.title"
        class="flex h-[66px] w-full items-center rounded-[14px] border border-(--color-border) bg-(--color-white) px-[17px] text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
        :class="
          item.path || item.action
            ? 'cursor-pointer hover:bg-(--color-surface)'
            : 'cursor-default'
        "
        type="button"
        :aria-disabled="item.path || item.action ? undefined : 'true'"
        @click="handleMenuClick(item)"
      >
        <component
          :is="item.icon"
          class="shrink-0 text-(color:--color-navy)"
          :size="24"
        />
        <span class="ml-[19px] min-w-0 flex-1">
          <strong
            class="block truncate text-[13.5px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)"
          >
            {{ item.title }}
          </strong>
          <span
            class="mt-[3px] block truncate text-[11px] leading-[1.3] text-(color:--color-slate-muted)"
          >
            {{ item.description }}
          </span>
        </span>
        <IconChevronLeft
          class="ml-2 shrink-0 rotate-180 text-(color:--color-slate-muted)"
          :size="16"
        />
      </button>
    </nav>

    <AppModal
      v-model="showPasswordModal"
      title="비밀번호 확인"
    >
      <form @submit.prevent="verifyProfilePassword">
        <p class="text-[13px] leading-[1.5] text-(color:--color-slate-dark)">
          프로필 수정을 위해 현재 비밀번호를 입력해주세요.
        </p>
        <label
          class="mt-4 mb-1 block text-[12.5px] font-(--font-bold) text-(color:--color-slate-dark)"
          for="profile-password"
        >
          현재 비밀번호
        </label>
        <input
          id="profile-password"
          v-model="profilePassword"
          class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-navy)"
          type="password"
          autocomplete="current-password"
          required
        >
        <p
          v-if="passwordError"
          class="mt-2 text-[12px] text-(color:--color-danger)"
          role="alert"
        >
          {{ passwordError }}
        </p>
        <AppButton
          class="mt-5"
          type="submit"
          block
          :loading="isVerifying"
        >
          확인
        </AppButton>
      </form>
    </AppModal>

    <AppModal
      v-model="showLogoutModal"
      title="로그아웃"
      :show-close="false"
    >
      <p class="text-center text-[14px] leading-[1.5] text-(color:--color-navy)">
        로그아웃 하시겠습니까?
      </p>

      <template #footer>
        <AppButton
          type="button"
          @click="confirmLogout"
        >
          로그아웃
        </AppButton>
        <AppButton
          type="button"
          variant="secondary"
          @click="showLogoutModal = false"
        >
          취소
        </AppButton>
      </template>
    </AppModal>
  </section>
</template>
