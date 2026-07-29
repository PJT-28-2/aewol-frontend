import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useGroupPurchaseCreateStore } from '@/stores/groupPurchase';

/* ------------------------------------------------------------------ */
/*  Public (no auth required) routes                                  */
/* ------------------------------------------------------------------ */
const publicRoutes = [
  {
    path: '/',
    redirect: '/login',
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
    path: '/signup/verify',
    name: 'SignupVerify',
    component: () => import('@/views/auth/SignupVerifyView.vue'),
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
];

/* ------------------------------------------------------------------ */
/*  Authenticated routes (require login, use DefaultLayout)           */
/* ------------------------------------------------------------------ */
const authRoutes = [
  {
    path: '/account',
    name: 'AccountManagement',
    component: () => import('@/views/account/AccountManagement.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/account/link',
    name: 'AccountLinkSelect',
    component: () => import('@/views/account/AccountLinkSelect.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/account/link/verify',
    name: 'AccountAuthOneWon',
    component: () => import('@/views/account/AccountAuthOneWon.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/account/link/complete',
    name: 'AccountLinkComplete',
    component: () => import('@/views/account/AccountLinkComplete.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
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
  },
  {
    path: '/pets/register',
    name: 'PetRegister',
    component: () => import('@/views/pet/PetRegisterView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/pets/:petId/edit',
    name: 'PetEdit',
    component: () => import('@/views/pet/PetEditView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
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
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/wallet/transfer',
    name: 'Transfer',
    component: () => import('@/views/wallet/TransferView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/wallet/history',
    name: 'TransactionHistory',
    component: () => import('@/views/wallet/TransactionHistoryView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/wallet/history/:txId',
    name: 'TransactionDetail',
    component: () => import('@/views/wallet/TransactionDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/accounts',
    name: 'AccountList',
    component: () => import('@/views/account/AccountListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/accounts/connect',
    name: 'AccountConnect',
    component: () => import('@/views/account/AccountConnectView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/payment',
    name: 'Payment',
    component: () => import('@/views/payment/PaymentView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/payment/recurring',
    name: 'Recurring',
    component: () => import('@/views/payment/RecurringView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/dashboard/pet/:petId',
    name: 'PetDashboard',
    component: () => import('@/views/dashboard/PetDashboardView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
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
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/insurance/claim',
    name: 'Claim',
    component: () => import('@/views/insurance/ClaimView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/insurance/claims',
    name: 'ClaimList',
    component: () => import('@/views/insurance/ClaimListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/share',
    name: 'Share',
    component: () => import('@/views/share/ShareView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
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
    meta: { requiresAuth: true },
  },
  {
    path: '/share/invite',
    name: 'ShareInvite',
    component: () => import('@/views/share/ShareInviteView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/group-purchase',
    name: 'GroupPurchaseList',
    component: () => import('@/views/grouppurchase/GroupPurchaseListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/group-purchase/create',
    name: 'GroupPurchaseCreateStep1',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseCreateStep1.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/group-purchase/create/step2',
    name: 'GroupPurchaseCreateStep2',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseCreateStep2.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
    // URL 직접 입력/새로고침으로 1단계를 건너뛰고 들어오는 것을 막음
    beforeEnter: () => {
      if (!useGroupPurchaseCreateStore().isStep1Complete) {
        return '/group-purchase/create';
      }
    },
  },
  {
    path: '/group-purchase/create/step3',
    name: 'GroupPurchaseCreateStep3',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseCreateStep3.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
    // URL 직접 입력/새로고침으로 1~2단계를 건너뛰고 들어오는 것을 막음
    beforeEnter: () => {
      const store = useGroupPurchaseCreateStore();
      if (!store.isStep1Complete) return '/group-purchase/create';
      if (!store.isStep2Complete) return '/group-purchase/create/step2';
    },
  },
  {
    path: '/group-purchase/:gpId',
    name: 'GroupPurchaseDetail',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/group-purchase/:gpId/paymentPreview',
    name: 'GroupPurchasePayment',
    component: () =>
      import('@/views/grouppurchase/GroupPurchasePaymentPreview.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/donation',
    name: 'Donation',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout', step: 'main' },
  },
  {
    path: '/donation/give',
    name: 'DonationGive',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, step: 'give' },
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
    meta: { requiresAuth: true, step: 'explore' },
  },
  {
    path: '/donation/settings',
    name: 'DonationSettings',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true, step: 'settings' },
  },
  {
    path: '/donation/give',
    name: 'DonationGive',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/donation/confirm',
    name: 'DonationConfirm',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/donation/complete',
    name: 'DonationComplete',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/donation/explore',
    name: 'DonationExplore',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/donation/settings',
    name: 'DonationSettings',
    component: () => import('@/views/donation/DonationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/support',
    name: 'Support',
    component: () => import('@/views/support/SupportView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/support',
    name: 'CustomerCenter',
    component: () => import('@/views/support/CustomerCenter.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/support/faqs/:faqId',
    name: 'FaqDetail',
    component: () => import('@/views/support/FaqDetail.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/support/inquiry',
    name: 'InquiryForm',
    component: () => import('@/views/support/InquiryForm.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/support/inquiries',
    name: 'MyInquiries',
    component: () => import('@/views/support/MyInquiries.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/support/inquiry/complete',
    name: 'InquirySubmitted',
    component: () => import('@/views/support/InquirySubmitted.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/support/:programId',
    name: 'SupportDetail',
    component: () => import('@/views/support/SupportView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/emergency',
    name: 'Emergency',
    component: () => import('@/views/emergency/EmergencyView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/settings/withdraw',
    name: 'Withdraw',
    component: () => import('@/views/settings/WithdrawView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
];

/* ------------------------------------------------------------------ */
/*  Router instance                                                   */
/* ------------------------------------------------------------------ */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...publicRoutes, ...authRoutes],
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
