import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useMemberStore } from '@/stores/member';
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
    path: '/signup/kakao/additional-info',
    name: 'KakaoAdditionalInfo',
    component: () => import('@/views/auth/KakaoAdditionalInfoView.vue'),
    beforeEnter: () => {
      if (!useAuthStore().registrationToken) return '/login';
    },
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
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true, hideBottomNav: true },
  },
  {
    path: '/account/link/password/confirm',
    name: 'AccountPasswordConfirm',
    component: () => import('@/views/account/AccountPasswordConfirmView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true, hideBottomNav: true },
  },
  {
    path: '/account/link/password/complete',
    name: 'PasswordSetupComplete',
    component: () => import('@/views/account/PasswordSetupComplete.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
    beforeEnter: () => {
      // 확인(confirm) API가 실제로 성공했을 때만 세팅되는 플래그 — 없으면 완료 화면에
      // 직접 진입한 것이므로(예: URL 직접 접근, 뒤로가기 후 재접근) 계좌 관리로 돌려보낸다.
      const completionKey = 'simplePasswordSetupCompleted';
      const isCompleted = window.sessionStorage.getItem(completionKey) === 'true';

      if (!isCompleted) return { name: 'AccountManagement' };

      window.sessionStorage.removeItem(completionKey);
    },
  },
  {
    path: '/account/link/complete',
    name: 'AccountLinkComplete',
    component: () => import('@/views/account/AccountLinkComplete.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/notifications',
    name: 'NotificationInbox',
    component: () => import('@/views/notification/NotificationInboxView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true, title: '알림함' },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/pets',
    name: 'PetList',
    component: () => import('@/views/pet/PetListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
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
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
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
    path: '/wallet/charge/success',
    name: 'TossChargeSuccess',
    component: () => import('@/views/wallet/TossChargeSuccessView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true, hideBottomNav: true },
  },
  {
    path: '/wallet/charge/fail',
    name: 'TossChargeFail',
    component: () => import('@/views/wallet/TossChargeFailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true, hideBottomNav: true },
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
    path: '/payment/qr',
    name: 'QrPayment',
    component: () => import('@/views/payment/QrPaymentView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
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
    path: '/payment/recurring/:id',
    name: 'RecurringDetail',
    component: () => import('@/views/payment/RecurringDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/payment/recurring/:id/edit',
    name: 'RecurringEdit',
    component: () => import('@/views/payment/RecurringRegisterView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
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
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
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
    path: '/explore',
    name: 'Explore',
    component: () => import('@/views/explore/ExploreView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true, title: '멍스타그램' },
  },
  {
    path: '/explore/diaries/:diaryId',
    name: 'ExplorePostDetail',
    component: () => import('@/views/explore/ExplorePostDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    // 계정 주체가 반려동물이라 경로도 pet 기준이다. 사람 id는 어디에도 쓰지 않는다.
    path: '/explore/pets/:petId',
    name: 'ExplorePetProfile',
    component: () => import('@/views/explore/ExplorePetProfileView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/share/diary',
    name: 'ShareDiary',
    component: () => import('@/views/share/ShareDiaryView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/share/diary/write',
    name: 'ShareDiaryWrite',
    component: () => import('@/views/share/ShareDiaryWriteView.vue'),
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
    meta: { requiresAuth: true, requiresNonAdmin: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/group-purchase/create/step1',
    name: 'GroupPurchaseCreateStep1',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseCreateStep1.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/group-purchase/create/step2',
    name: 'GroupPurchaseCreateStep2',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseCreateStep2.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'DefaultLayout', showBack: true },
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
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'DefaultLayout', showBack: true },
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
    // join()이 role=USER 전용이라 관리자는 애초에 참여자가 될 수 없음 — URL 직접 입력으로
    // 이 결제 화면에 들어와 참여자로 등록되는 경로를 막는다(#237 리뷰 HIGH 항목)
    meta: { requiresAuth: true, requiresNonAdmin: true, layout: 'DefaultLayout', showBack: true },
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
    path: '/donation/deposit',
    name: 'DonationDeposit',
    component: () => import('@/views/donation/DonationDepositView.vue'),
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
    path: '/admin/inquiries',
    name: 'AdminInquiries',
    component: () => import('@/views/admin/AdminInquiryListView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      adminFallback: '/settings',
      layout: 'DefaultLayout',
      showBack: true,
      title: '문의 관리',
    },
  },
  {
    path: '/admin/inquiries/:inquiryId',
    name: 'AdminInquiryDetail',
    component: () => import('@/views/admin/AdminInquiryDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      adminFallback: '/settings',
      layout: 'DefaultLayout',
      showBack: true,
      title: '문의 상세',
    },
  },
  {
    path: '/emergency',
    name: 'Emergency',
    component: () => import('@/views/emergency/EmergencyView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/admin/diary-reports',
    name: 'AdminDiaryReports',
    component: () => import('@/views/admin/AdminDiaryReportListView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, adminFallback: '/settings', layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/admin/diary-reports/:reportId',
    name: 'AdminDiaryReportDetail',
    component: () => import('@/views/admin/AdminDiaryReportDetailView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, adminFallback: '/settings', layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true },
  },
  {
    path: '/settings/profile',
    name: 'ProfileEdit',
    component: () => import('@/views/settings/ProfileEditView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
    beforeEnter: async () => {
      const verificationKey = 'profileEditPasswordVerified';
      const memberStore = useMemberStore();
      if (!memberStore.profile) {
        try {
          await memberStore.fetchProfile();
        } catch {
          return '/settings';
        }
      }

      if (memberStore.profile?.provider === 'KAKAO') return;

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
    meta: { requiresAuth: true, layout: 'DefaultLayout', showBack: true },
  },
  {
    path: '/settings/pet-photo',
    name: 'PetProfilePhoto',
    component: () => import('@/views/settings/PetProfilePhotoView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', hideHeader: true, hideBottomNav: true },
  },
];

/* ------------------------------------------------------------------ */
/*  Not found (catch-all)                                             */
/* ------------------------------------------------------------------ */
const notFoundRoutes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { layout: 'DefaultLayout', hideBottomNav: true },
  },
];

/* ------------------------------------------------------------------ */
/*  Router instance                                                   */
/* ------------------------------------------------------------------ */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // catch-all은 항상 마지막이어야 한다. 앞에 두면 뒤의 라우트가 전부 가려진다.
  //
  // S3 정적 호스팅 + CloudFront 구성에서는 존재하지 않는 경로도 CloudFront가
  // index.html을 돌려주므로(SPA 폴백), 라우터에 대응 라우트가 없으면 흰 화면만 남는다.
  routes: [...publicRoutes, ...authRoutes, ...notFoundRoutes],
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

router.beforeEach(async (to) => {
  // 외부 링크를 복사하면서 슬래시가 중복되어도 빈 화면 대신 정상 경로로 보낸다.
  const normalizedPath = to.path.replace(/\/{2,}/g, '/');
  if (normalizedPath !== to.path) {
    return {
      path: normalizedPath,
      query: to.query,
      hash: to.hash,
      replace: true,
    };
  }

  const authStore = useAuthStore();

  // 로그인 화면 구현 전까지 로컬 화면 개발을 위한 인증 우회
  // Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (authStore.isAuthenticated && !useMemberStore().profile) {
    try {
      await useMemberStore().fetchProfile();
    } catch {
      authStore.clearSession();
      return { path: '/login', query: { redirect: to.fullPath } };
    }
  }

  // 공동구매 글쓰기 등 관리자 전용 화면을 URL 직접 입력으로 우회하는 것을 막음.
  // 버튼은 숨겨져 있어도 라우트 자체는 막혀있지 않으면 그대로 진입할 수 있기 때문
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { path: to.meta.adminFallback ?? '/group-purchase' };
  }

  // 나의 공동구매(GET /api/group-purchase/my)는 role=USER 전용이라 관리자가 URL로 직접
  // 들어와도 막는다 — 관리자의 작성글 관리는 별도 기능으로 분리 예정이라 이 화면 범위 밖
  if (to.meta.requiresNonAdmin && authStore.isAdmin) {
    return { path: '/group-purchase' };
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
