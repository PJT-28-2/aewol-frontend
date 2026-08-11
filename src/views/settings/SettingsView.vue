<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMemberStore } from '@/stores/member'
import { usePetStore } from '@/stores/pet'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import PasswordInput from '@/components/common/PasswordInput.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconChatBubble from '@/components/common/icons/IconChatBubble.vue'
import IconGroupPurchase from '@/components/common/icons/IconGroupPurchase.vue'
import IconPublicSupport from '@/components/common/icons/IconPublicSupport.vue'
import IconNotificationBell from '@/components/common/icons/IconNotificationBell.vue'
import IconRecurring from '@/components/common/icons/IconRecurring.vue'
import IconSavings from '@/components/common/icons/IconSavings.vue'
import IconWallet from '@/components/common/icons/IconWallet.vue'
import profileMascot from '@/assets/images/pet-poodle-profile-mascot.png'

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

const memberName = computed(() => memberStore.profile?.name ?? '')
const memberEmail = computed(() => memberStore.profile?.email ?? '')
const petName = computed(() => petStore.pets[0]?.name ?? '포리')
const profileImage = computed(() => memberStore.petProfilePhotoUrl || profileMascot)

onMounted(async () => {
  await Promise.allSettled([
    memberStore.profile ? Promise.resolve() : memberStore.fetchProfile(),
    petStore.pets.length ? Promise.resolve() : petStore.fetchPets(),
  ])
})

const benefitItems = [
  {
    title: '공동구매',
    description: '인증 업체 특가',
    path: '/group-purchase',
    icon: IconGroupPurchase,
    tone: 'green',
  },
  {
    title: '짜투리 저금통',
    description: '모아서 기부하기',
    path: '/donation',
    icon: IconSavings,
    tone: 'yellow',
  },
  {
    title: '지원사업',
    description: '지역 혜택 찾기',
    path: '/support-programs',
    icon: IconPublicSupport,
    tone: 'blue',
  },
]

const settingItems = [
  {
    title: '계좌 관리',
    path: '/account',
    icon: IconWallet,
    tone: 'blue',
  },
  {
    title: '정기 결제',
    path: '/payment/recurring',
    icon: IconRecurring,
    tone: 'purple',
  },
  {
    title: '알림 설정',
    path: '/settings/notifications',
    icon: IconNotificationBell,
    tone: 'pink',
  },
  {
    title: '고객센터',
    path: '/support',
    icon: IconChatBubble,
    tone: 'gray',
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
    class="min-h-screen w-full bg-(--color-app-bg) px-(--space-5) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-8))]"
    aria-labelledby="mypage-title"
  >
    <header class="mb-(--space-5) flex h-[42px] items-center">
      <h1
        id="mypage-title"
        class="text-(length:--font-2xl) font-bold text-(color:--color-navy)"
      >
        마이페이지
      </h1>
    </header>

    <article
      class="relative overflow-hidden rounded-[28px] bg-(--color-leaf) p-(--space-5) shadow-(--shadow-card)"
      aria-label="회원 정보"
    >
      <div class="relative flex items-center gap-(--space-4)">
        <div class="relative shrink-0">
          <div class="flex size-[86px] items-center justify-center overflow-hidden rounded-full bg-(--color-leaf-soft)">
            <!-- 생성 이미지가 투명 PNG여도 프로필 배경은 UI에서 유지한다. -->
            <img
              :src="profileImage"
              :alt="`${petName} 프로필`"
              class="size-full scale-[1.08] object-cover"
            >
          </div>
          <router-link
            to="/settings/pet-photo?mode=edit"
            class="absolute -right-[5px] -bottom-[5px] flex size-[27px] items-center justify-center rounded-full border-2 border-(--color-leaf) bg-(--color-white) shadow-(--shadow-sm)"
            aria-label="프로필 사진 만들기"
          >
            <IconImage
              size="13"
              color="var(--color-navy)"
            />
          </router-link>
        </div>
        <div class="relative min-w-0 flex-1">
          <p class="text-(length:--font-xs) font-semibold text-(color:--color-leaf-dark)">
            {{ petName }}와 함께하는 보호자
          </p>
          <p class="mt-(--space-1) truncate text-(length:--font-xl) font-bold text-(color:--color-navy)">
            {{ memberName ? `${memberName}님` : '회원님' }}
          </p>
          <p class="mt-[3px] truncate text-(length:--font-xs) text-(color:--color-navy-light)">
            {{ memberEmail || '이메일 정보가 없습니다' }}
          </p>
        </div>
      </div>
      <button
        type="button"
        class="relative mt-(--space-4) w-full rounded-(--radius-xl) bg-[color-mix(in_srgb,var(--color-white)_68%,transparent)] py-(--space-3) text-(length:--font-sm) font-bold text-(color:--color-navy) active:bg-(--color-white)"
        @click="handleMenuClick({ action: 'verifyProfile' })"
      >
        내 정보 수정
      </button>
    </article>

    <section class="mt-(--space-7)">
      <div class="mb-(--space-3) flex items-center justify-between px-(--space-1)">
        <h2 class="text-(length:--font-lg) font-bold text-(color:--color-navy)">
          혜택 · 생활
        </h2>
      </div>
      <nav
        class="grid grid-cols-3 gap-(--space-2)"
        aria-label="혜택과 생활"
      >
        <button
          v-for="item in benefitItems"
          :key="item.title"
          type="button"
          class="min-w-0 rounded-[20px] bg-(--color-white) px-(--space-2) py-(--space-4) text-center shadow-(--shadow-sm) active:bg-(--color-leaf-soft)"
          @click="handleMenuClick(item)"
        >
          <FeatureIconTile
            class="mx-auto"
            :icon="item.icon"
            :tone="item.tone"
          />
          <strong class="mt-(--space-3) block truncate text-[13px] font-bold text-(color:--color-navy)">{{ item.title }}</strong>
          <span class="mt-[3px] block truncate text-[10px] text-(color:--color-slate-muted)">{{ item.description }}</span>
        </button>
      </nav>
    </section>

    <section class="mt-(--space-7)">
      <h2 class="mb-(--space-3) px-(--space-1) text-(length:--font-lg) font-bold text-(color:--color-navy)">
        계정 · 설정
      </h2>
      <nav
        class="grid grid-cols-2 overflow-hidden rounded-[22px] bg-(--color-white)"
        aria-label="계정과 설정"
      >
        <button
          v-for="item in settingItems"
          :key="item.title"
          type="button"
          class="flex items-center gap-(--space-2) border-r border-b border-(--color-card-border) p-(--space-4) text-left even:border-r-0 active:bg-(--color-gray-100)"
          @click="handleMenuClick(item)"
        >
          <FeatureIconTile
            :icon="item.icon"
            :tone="item.tone"
          />
          <span class="text-[13px] font-semibold text-(color:--color-navy)">{{ item.title }}</span>
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
