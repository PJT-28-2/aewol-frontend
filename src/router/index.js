import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

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
    component: () =>
      import('@/views/auth/PasswordResetView.vue'),
  },
  {
    path: '/id/find',
    name: 'FindId',
    component: () => import('@/views/auth/FindIdView.vue'),
  },
  {
    path: '/callback/kakao',
    name: 'KakaoCallback',
    component: () =>
      import('@/views/auth/KakaoCallbackView.vue'),
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
    path: '/wallet/buckets',
    name: 'BucketManage',
    component: () =>
      import('@/views/wallet/BucketManageView.vue'),
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
    component: () =>
      import('@/views/wallet/TransactionHistoryView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/wallet/history/:txId',
    name: 'TransactionDetail',
    component: () =>
      import('@/views/wallet/TransactionDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/accounts',
    name: 'AccountList',
    component: () =>
      import('@/views/account/AccountListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/accounts/connect',
    name: 'AccountConnect',
    component: () =>
      import('@/views/account/AccountConnectView.vue'),
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
    component: () =>
      import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/dashboard/pet/:petId',
    name: 'PetDashboard',
    component: () =>
      import('@/views/dashboard/PetDashboardView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/insurance',
    name: 'InsuranceHome',
    component: () =>
      import('@/views/insurance/InsuranceHomeView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/insurance/simulator',
    name: 'Simulator',
    component: () =>
      import('@/views/insurance/SimulatorView.vue'),
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
    component: () =>
      import('@/views/insurance/ClaimListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/share',
    name: 'Share',
    component: () => import('@/views/share/ShareView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/group-purchase',
    name: 'GroupPurchaseList',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseListView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/group-purchase/:gpId',
    name: 'GroupPurchaseDetail',
    component: () =>
      import('@/views/grouppurchase/GroupPurchaseDetailView.vue'),
    meta: { requiresAuth: true, layout: 'DefaultLayout' },
  },
  {
    path: '/donation',
    name: 'Donation',
    component: () => import('@/views/donation/DonationView.vue'),
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
    path: '/emergency',
    name: 'Emergency',
    component: () =>
      import('@/views/emergency/EmergencyView.vue'),
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

  // TODO: 로그인 화면 구현 전까지 임시 인증 우회 (팀 공용, 다른 화면 개발용)
  // 로그인 플로우 완성되면 제거 필요
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

export default router;