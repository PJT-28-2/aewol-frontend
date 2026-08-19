<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import IconHome from './icons/IconHome.vue';
import IconPetFace from './icons/IconPetFace.vue';
import IconQrCode from './icons/IconQrCode.vue';
import IconUser from './icons/IconUser.vue';
import IconWallet from './icons/IconWallet.vue';

const route = useRoute();
const isPaymentPage = computed(() => route.path.startsWith('/payment/qr'));

const tabs = [
  {
    path: '/home',
    label: '홈',
    icon: IconHome,
  },
  { path: '/wallet', label: '지갑', icon: IconWallet },
  { path: '/payment/qr', label: '결제', icon: IconQrCode, primary: true },
  { path: '/pets', label: '반려생활', icon: IconPetFace },
  { path: '/settings', label: '마이페이지', icon: IconUser },
];

function isActive(path) {
  return route.path.startsWith(path);
}
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none fixed bottom-0 left-0 right-0 z-90 mx-auto h-[calc(var(--space-6)+env(safe-area-inset-bottom,0px))] max-w-(--layout-max-width) backdrop-blur-[12px]"
    :class="isPaymentPage ? 'bg-(--color-navy)' : 'bg-[color-mix(in_srgb,var(--color-app-bg)_92%,transparent)]'"
  />
  <nav
    class="fixed bottom-[calc(var(--space-3)+env(safe-area-inset-bottom,0px))] left-(--space-3) right-(--space-3) z-100 mx-auto flex h-[66px] max-w-[calc(var(--layout-max-width)-var(--space-6))] items-center justify-around rounded-[24px] bg-(--color-navy) px-(--space-2) shadow-[0_12px_32px_color-mix(in_srgb,var(--color-navy)_24%,transparent)]"
  >
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="group relative flex h-[56px] flex-1 flex-col items-center justify-center gap-[3px] rounded-(--radius-xl) no-underline transition-colors"
      :class="
        isActive(tab.path) || tab.primary ? 'text-(color:--color-navy)' : 'text-(color:--color-slate-light)'
      "
    >
      <span
        class="flex items-center justify-center rounded-full transition-transform"
        :class="tab.primary ? 'absolute -top-[15px] size-[46px] bg-(--color-leaf) shadow-(--shadow-md)' : isActive(tab.path) ? 'size-[30px] bg-(--color-leaf)' : 'size-[30px]'"
      >
        <component
          :is="tab.icon"
          size="24"
          filled
        />
      </span>

      <span
        class="text-[10px] leading-none"
        :class="[isActive(tab.path) ? 'font-semibold text-(color:--color-white)' : 'font-medium text-(color:--color-slate-light)', tab.primary ? 'mt-[30px]' : '']"
      >{{ tab.label }}</span>
    </router-link>
  </nav>
</template>
