<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMemberStore } from '@/stores/member'
import { usePetStore } from '@/stores/pet'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import PasswordInput from '@/components/common/PasswordInput.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import iconPetProfile3d from '@/assets/images/icons-3d/dog_face_3d.png'
import iconCatProfile3d from '@/assets/images/icons-3d/cat_face_3d.png'
import iconNotification3d from '@/assets/images/icons-3d/bell_3d.png'
import iconAccountCard3d from '@/assets/images/icons-3d/credit_card_3d.png'
import iconRecurring3d from '@/assets/images/icons-3d/calendar_3d.png'
import iconDiscussion3d from '@/assets/images/icons-3d/speech_balloon_3d.png'
import iconFamily3d from '@/assets/images/icons-3d/people_hugging_3d.png'

const router = useRouter()
const authStore = useAuthStore()
const memberStore = useMemberStore()
const petStore = usePetStore()
const showPasswordModal = ref(false)
const showLogoutModal = ref(false)
const profilePassword = ref('')
const passwordError = ref('')
const isVerifying = ref(false)
const PROFILE_VERIFIED_KEY = 'profileEditPasswordVerified'
import { MOCK_CURRENT_PASSWORD } from '@/mocks/settings'

const profilePetIcon = computed(() =>
  petStore.pets[0]?.species === 'CAT'
    ? iconCatProfile3d
    : iconPetProfile3d,
)

const memberName = computed(() => memberStore.profile?.name ?? '')
const memberEmail = computed(() => memberStore.profile?.email ?? '')

onMounted(async () => {
  if (!memberStore.profile) {
    try {
      await memberStore.fetchProfile()
    } catch {
      // 프로필 조회 실패 시 이름/이메일은 빈 상태로 유지한다.
    }
  }
})

const menuSections = [
  {
    title: '서비스 관리',
    items: [
      {
        title: '함께 돌보기',
        description: '가족 초대 및 공동양육 관리',
        path: '/share',
        icon: iconFamily3d,
      },
      {
        title: '계좌 관리',
        description: '연동된 계좌 확인 및 등록',
        path: '/account',
        icon: iconAccountCard3d,
      },
      {
        title: '정기 결제 관리',
        description: '구독형 결제 내역 확인',
        path: '/payment/recurring',
        icon: iconRecurring3d,
      },
    ],
  },
  {
    title: '설정 · 지원',
    items: [
      {
        title: '알림 설정',
        description: '푸시 알림 켜기 / 끄기',
        path: '/settings/notifications',
        icon: iconNotification3d,
      },
      {
        title: '고객센터',
        description: '자주 묻는 질문 및 문의',
        path: '/support',
        icon: iconDiscussion3d,
      },
    ],
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
    class="min-h-screen w-full bg-(--color-app-bg) px-(--space-4) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-7))]"
    aria-labelledby="mypage-title"
  >
    <header class="mb-(--space-4)">
      <h1
        id="mypage-title"
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        마이페이지
      </h1>
    </header>

    <article
      class="flex items-center gap-(--space-3) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
      aria-label="회원 정보"
    >
      <div class="relative shrink-0">
        <img
          v-if="memberStore.petProfilePhotoUrl"
          :src="memberStore.petProfilePhotoUrl"
          alt=""
          class="size-[52px] rounded-[16px] object-cover"
        >
        <div
          v-else
          class="flex size-[52px] items-center justify-center rounded-[16px] border border-(--color-card-border) bg-(--color-white)"
          aria-hidden="true"
        >
          <img
            :src="profilePetIcon"
            :alt="petStore.pets[0]?.species === 'CAT' ? '고양이 프로필' : '강아지 프로필'"
            class="size-[40px] object-contain saturate-[0.85] brightness-[1.03] contrast-[0.96]"
          >
        </div>
        <router-link
          to="/settings/pet-photo"
          class="absolute -right-[4px] -bottom-[4px] flex size-[22px] items-center justify-center rounded-full bg-(--color-white) border border-(--color-gray-200) shadow-(--shadow-sm)"
          aria-label="프로필 사진 만들기"
        >
          <IconImage
            size="12"
            color="var(--color-navy)"
          />
        </router-link>
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[15px] leading-[1.3] font-(--font-bold) text-(color:--color-navy)">
          {{ memberName ? `${memberName}님` : '회원님' }}
        </p>
        <p class="mt-[5px] truncate text-[12px] leading-[1.3] text-(color:--color-slate-muted)">
          {{ memberEmail || '이메일 정보가 없습니다' }}
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-(--radius-full) bg-(--color-leaf-surface) px-(--space-3) py-[7px] text-(length:--font-xs) font-semibold text-(--color-leaf-dark) active:bg-(--color-leaf)"
        @click="handleMenuClick({ action: 'verifyProfile' })"
      >
        프로필 수정
      </button>
    </article>

    <section
      v-for="section in menuSections"
      :key="section.title"
      class="mt-(--space-6)"
    >
      <h2 class="mb-(--space-2) px-(--space-1) text-(length:--font-sm) font-semibold text-(--color-slate-dark)">
        {{ section.title }}
      </h2>
      <nav
        class="flex flex-col overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white)"
        :aria-label="section.title"
      >
        <button
          v-for="item in section.items"
          :key="item.title"
          class="flex w-full cursor-pointer items-center gap-(--space-3) border-b border-(--color-card-border) px-(--space-4) py-(--space-3) text-left transition-colors last:border-b-0 active:bg-(--color-gray-100) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
          type="button"
          @click="handleMenuClick(item)"
        >
          <span
            class="flex size-[40px] shrink-0 items-center justify-center rounded-[13px] bg-(--color-gray-100)"
          >
            <img
              :src="item.icon"
              alt=""
              class="size-[27px] object-contain saturate-[0.8] brightness-[1.03] contrast-[0.95]"
            >
          </span>
          <div class="min-w-0 flex-1">
            <strong class="block truncate text-(length:--font-md) font-semibold text-(color:--color-navy)">
              {{ item.title }}
            </strong>
            <p class="mt-[3px] truncate text-(length:--font-xs) text-(color:--color-slate-muted)">
              {{ item.description }}
            </p>
          </div>
          <IconChevronRight
            size="18"
            color="var(--color-gray-400)"
            class="shrink-0"
          />
        </button>
      </nav>
    </section>

    <button
      type="button"
      class="mt-(--space-6) mb-(--space-2) flex w-full items-center justify-center gap-(--space-1) py-(--space-3) text-(length:--font-sm) font-semibold text-(color:--color-danger-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
      @click="handleLogout"
    >
      로그아웃
    </button>

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
        <PasswordInput
          id="profile-password"
          v-model="profilePassword"
          input-class="h-(--control-height-md) w-full rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-[13px] text-[13px] text-(color:--color-navy) outline-none focus:border-(--color-navy)"
          autocomplete="current-password"
          required
        />
        <p
          v-if="passwordError"
          class="mt-2 text-[12px] text-(color:--color-danger-strong)"
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
      title="정말 로그아웃 하시겠어요?"
      :show-close="false"
      :divider="false"
      :center-title="true"
    >
      <template #footer>
        <div class="flex w-full gap-(--space-3)">
          <AppButton
            type="button"
            variant="secondary"
            size="lg"
            class="flex-1 !rounded-(--radius-lg) border-(--color-border)!"
            @click="showLogoutModal = false"
          >
            취소
          </AppButton>
          <AppButton
            type="button"
            variant="primary"
            size="lg"
            class="flex-1 !rounded-(--radius-lg)"
            @click="confirmLogout"
          >
            로그아웃
          </AppButton>
        </div>
      </template>
    </AppModal>
  </section>
</template>
