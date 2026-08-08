import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useGroupPurchaseCreateStore } from '@/stores/groupPurchase';
import { usePetStore } from '@/stores/pet';

/* ------------------------------------------------------------------ */
/*  Public (no auth required) routes                                  */
/* ------------------------------------------------------------------ */
const publicRoutes = [
  {
    path: '/',
    redirect: '/onboarding',
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/onboarding/OnboardingView.vue'),
    // 개발 모드는 인증 가드를 우회하므로, 로그인된 사용자에게는
    // 이 라우트에서 직접 온보딩을 건너뛰도록 별도로 처리한다.
    beforeEnter: () => {
      if (useAuthStore().isAuthenticated) return '/home';
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/views/auth/SignupView.vue'),
  },
  {
    path: '/signup/complete',
    name: 'SignupComplete',
    component: () => import('@/views/auth/SignupCompleteView.vue'),
  },
  {
    path: '/password/reset',
    name: 'PasswordReset',
    component: () => import('@/views/auth/PasswordResetView.vue'),
  },
  {
    path: '/id/find',
    name: 'FindId',
    component: () => import('@/views/auth/FindIdView.vue'),
  },
  {
    path: '/callback/kakao',
    name: 'KakaoCallback',
    component: () => import('@/views/auth/KakaoCallbackView.vue'),
  },
  {
    path: '/withdraw/complete',
    name: 'WithdrawalComplete',
    component: () =>
      import('@/views/settings/WithdrawalCompleteView.vue'),
    beforeEnter: () => {
      const completionKey = 'withdrawalCompleted';
      const isCompleted = window.sessionStorage.getItem(completionKey) === 'true';

      if (!isCompleted) return '/login';

      window.sessionStorage.removeItem(completionKey);
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Authenticated routes (require login, use DefaultLayout)           */
/* ------------------------------------------------------------------ */
const authRoutes = [
  {
    path: '/account',
    name: 'AccountManagement',
    component: () => import('@/views/account/AccountManagement.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/account/link',
    name: 'AccountLinkSelect',
    component: () => import('@/views/account/AccountLinkSelect.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/account/link/verify',
    name: 'AccountAuthOneWon',
    component: () => import('@/views/account/AccountAuthOneWon.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/account/link/password',
    name: 'AccountPasswordSetup',
    component: () => import('@/views/account/AccountPasswordSetupView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/account/link/password/confirm',
    name: 'AccountPasswordConfirm',
    component: () => import('@/views/account/AccountPasswordConfirmView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/account/link/complete',
    name: 'AccountLinkComplete',
    component: () => import('@/views/account/AccountLinkComplete.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/pets',
    name: 'PetList',
    component: () => import('@/views/pet/PetListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
    // 등록된 반려동물이 없으면 관리 화면 대신 반려동물 등록/가족 참여 안내 화면으로 보낸다.
    beforeEnter: async () => {
      const petStore = usePetStore();
      try {
        await petStore.fetchPets();
      } catch {
        return;
      }
      if (petStore.pets.length === 0) return '/share/start';
    },
  },
  {
    path: '/pets/register',
    name: 'PetRegister',
    component: () => import('@/views/pet/PetRegisterView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true, title: '프로필 등록' },
  },
  {
    path: '/pets/:petId/edit',
    name: 'PetEdit',
    component: () => import('@/views/pet/PetEditView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true, title: '프로필 수정' },
  },
  {
    path: '/certificates',
    name: 'CertificateList',
    component: () => import('@/views/certificate/CertificateListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/certificates/:petId/:docId',
    name: 'CertificateDetail',
    component: () => import('@/views/certificate/CertificateDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('@/views/wallet/WalletView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/wallet/charge',
    name: 'Charge',
    component: () => import('@/views/wallet/ChargeView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/wallet/charge/complete',
    name: 'ChargeComplete',
    component: () => import('@/views/wallet/ChargeCompleteView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/wallet/charge/account-select',
    name: 'ChargeAccountSelect',
    component: () => import('@/views/wallet/ChargeAccountSelectView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/wallet/transfer',
    name: 'Transfer',
    component: () => import('@/views/wallet/TransferView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/wallet/transfer/account-select',
    name: 'TransferAccountSelect',
    component: () => import('@/views/wallet/TransferAccountSelectView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/wallet/transfer/confirm',
    name: 'TransferConfirm',
    component: () => import('@/views/wallet/TransferConfirmView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/wallet/transfer/complete',
    name: 'TransferComplete',
    component: () => import('@/views/wallet/TransferCompleteView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/wallet/history',
    name: 'TransactionHistory',
    component: () => import('@/views/wallet/TransactionHistoryView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/wallet/history/:txId',
    name: 'TransactionDetail',
    component: () => import('@/views/wallet/TransactionDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/payment/recurring',
    name: 'Recurring',
    component: () => import('@/views/payment/RecurringView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/payment/recurring/register',
    name: 'RecurringRegister',
    component: () => import('@/views/payment/RecurringRegisterView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/payment/recurring/register/complete',
    name: 'RecurringRegisterComplete',
    component: () => import('@/views/payment/RecurringRegisterCompleteView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/payment/recurring/:id/cancel',
    name: 'RecurringCancel',
    component: () => import('@/views/payment/RecurringCancelView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/payment/recurring/cancel/complete',
    name: 'RecurringCancelComplete',
    component: () => import('@/views/payment/RecurringCancelCompleteView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/insurance',
    name: 'InsuranceHome',
    component: () => import('@/views/insurance/InsuranceHomeView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/insurance/simulator',
    name: 'Simulator',
    component: () => import('@/views/insurance/SimulatorView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/insurance/claim',
    name: 'Claim',
    component: () => import('@/views/insurance/ClaimView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/insurance/claim/pdf-draft',
    name: 'ClaimPdfDraft',
    component: () =>
      import('@/views/insurance/ClaimPdfDraftView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/share',
    name: 'Share',
    component: () => import('@/views/share/ShareView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/share/start',
    name: 'ShareStart',
    component: () => import('@/views/share/ShareStartView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/share/join',
    name: 'ShareJoin',
    component: () => import('@/views/share/ShareJoinView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/share/invite',
    name: 'ShareInvite',
    component: () => import('@/views/share/ShareView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/group-purchase',
    name: 'GroupPurchaseList',
    component: () => import('@/views/grouppurchase/GroupPurchaseListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/group-purchase/my',
    name: 'GroupPurchaseMy',
    component: () => import('@/views/grouppurchase/GroupPurchaseMyView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/group-purchase/create/step1',
    name: 'GroupPurchaseCreateStep1',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseCreateStep1.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/group-purchase/create/step2',
    name: 'GroupPurchaseCreateStep2',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseCreateStep2.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
    // URL 직접 입력/새로고침으로 1단계를 건너뛰고 들어오는 것을 막음
    beforeEnter: () => {
      if (!useGroupPurchaseCreateStore().isStep1Complete) {
        return '/group-purchase/create/step1';
      }
    },
  },
  {
    path: '/group-purchase/create/step3',
    name: 'GroupPurchaseCreateStep3',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseCreateStep3.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
    // URL 직접 입력/새로고침으로 1~2단계를 건너뛰고 들어오는 것을 막음
    beforeEnter: () => {
      const store = useGroupPurchaseCreateStore();
      if (!store.isStep1Complete) return '/group-purchase/create/step1';
      if (!store.isStep2Complete()) return '/group-purchase/create/step2';
    },
  },
  {
    path: '/group-purchase/:gpId',
    name: 'GroupPurchaseDetail',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/group-purchase/:gpId/payment-preview',
    name: 'GroupPurchasePayment',
    component: () =>
      import('@/views/grouppurchase/GroupPurchasePaymentPreview.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/group-purchase/:gpId/status',
    name: 'GroupPurchaseStatus',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseStatusView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/donation',
    name: 'Donation',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', step: 'main', showBack: true },
  },
  {
    path: '/donation/give',
    name: 'DonationGive',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', step: 'give', showBack: true },
  },
  {
    path: '/donation/withdraw',
    name: 'DonationWithdraw',
    component: () => import('@/views/donation/DonationWithdrawView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/donation/confirm',
    name: 'DonationConfirm',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, step: 'confirm' },
  },
  {
    path: '/donation/complete',
    name: 'DonationComplete',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, step: 'complete' },
  },
  {
    path: '/donation/explore',
    name: 'DonationExplore',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', step: 'explore', showBack: true },
  },
  {
    path: '/donation/settings',
    name: 'DonationSettings',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', step: 'settings', showBack: true },
  },
  {
    path: '/support-programs',
    name: 'SupportPrograms',
    component: () => import('@/views/support-programs/SupportProgramsView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/support-programs/:programId',
    name: 'SupportProgramDetail',
    component: () => import('@/views/support-programs/SupportProgramsView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/support',
    name: 'CustomerCenter',
    component: () => import('@/views/support/CustomerCenter.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/support/faqs/:faqId',
    name: 'FaqDetail',
    component: () => import('@/views/support/FaqDetail.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/support/inquiry',
    name: 'InquiryForm',
    component: () => import('@/views/support/InquiryForm.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/support/inquiries',
    name: 'MyInquiries',
    component: () => import('@/views/support/MyInquiries.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/support/inquiries/:inquiryId',
    name: 'InquiryDetail',
    component: () => import('@/views/support/InquiryDetail.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/support/inquiry/complete',
    name: 'InquirySubmitted',
    component: () => import('@/views/support/InquirySubmitted.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/emergency',
    name: 'Emergency',
    component: () => import('@/views/emergency/EmergencyView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/settings/profile',
    name: 'ProfileEdit',
    component: () => import('@/views/settings/ProfileEditView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
    beforeEnter: () => {
      const verificationKey = 'profileEditPasswordVerified';
      const isVerified = window.sessionStorage.getItem(verificationKey) === 'true';

      if (!isVerified) return '/settings';

      window.sessionStorage.removeItem(verificationKey);
    },
  },
  {
    path: '/settings/notifications',
    name: 'NotificationSettings',
    component: () => import('@/views/settings/NotificationSettingsView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/settings/withdraw',
    name: 'Withdraw',
    component: () => import('@/views/settings/WithdrawView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/pet-photo',
    name: 'PetProfilePhoto',
    component: () => import('@/views/settings/PetProfilePhotoView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
];

/* ------------------------------------------------------------------ */
/*  Router instance                                                   */
/* ------------------------------------------------------------------ */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...publicRoutes, ...authRoutes],
  scrollBehavior(to, from, savedPosition) {
    // 뒤로/앞으로 가기는 이전 스크롤 위치를 복원하고, 새 이동은 맨 위에서 시작한다.
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

/* ------------------------------------------------------------------ */
/*  Navigation guard                                                  */
/* ------------------------------------------------------------------ */
const PUBLIC_ROUTE_NAMES = new Set(
  publicRoutes.filter((r) => r.name).map((r) => r.name),
);

router.beforeEach((to) => {
  const authStore = useAuthStore();

  // 로그인 화면 구현 전까지 로컬 화면 개발을 위한 인증 우회
  if (import.meta.env.DEV) {
    return;
  }

  // Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  // Redirect authenticated users away from public pages (except callback)
  if (
    authStore.isAuthenticated &&
    PUBLIC_ROUTE_NAMES.has(to.name) &&
    to.name !== 'KakaoCallback'
  ) {
    return { path: '/home' };
  }
});

// 상품등록 1~3단계(/group-purchase/create*)를 벗어나면 작성 중이던 데이터 초기화
router.afterEach((to, from) => {
  const CREATE_FLOW_PREFIX = '/group-purchase/create';
  const isLeavingCreateFlow =
    from.path.startsWith(CREATE_FLOW_PREFIX) && !to.path.startsWith(CREATE_FLOW_PREFIX);
  if (isLeavingCreateFlow) {
    useGroupPurchaseCreateStore().reset();
  }
});

export default router;
