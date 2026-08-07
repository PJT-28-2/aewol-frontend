<script setup>
import { useRoute } from 'vue-router';
import IconHome from './icons/IconHome.vue';
import IconInsurance from './icons/IconInsurance.vue';
import IconPetFace from './icons/IconPetFace.vue';
import IconUser from './icons/IconUser.vue';
import IconWallet from './icons/IconWallet.vue';

const route = useRoute();

const tabs = [
  {
    path: '/insurance',
    label: '보험',
    icon: IconInsurance,
  },
  { path: '/wallet', label: '지갑', icon: IconWallet },
  { path: '/home', label: '홈', icon: IconHome },
  { path: '/pets', label: '반려동물', icon: IconPetFace },
  { path: '/settings', label: '마이페이지', icon: IconUser },
];

function isActive(path) {
  return route.path.startsWith(path);
}
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none fixed bottom-0 left-0 right-0 z-90 mx-auto h-[calc(var(--space-6)+env(safe-area-inset-bottom,0px))] max-w-(--layout-max-width) bg-[color-mix(in_srgb,var(--color-app-bg)_92%,transparent)] backdrop-blur-[12px]"
  />
  <nav
    class="fixed bottom-[calc(var(--space-3)+env(safe-area-inset-bottom,0px))] left-(--space-4) right-(--space-4) z-100 mx-auto flex h-(--bottom-nav-height) max-w-[calc(var(--layout-max-width)-var(--space-8))] items-center justify-around rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) px-(--space-2) shadow-[0_10px_32px_color-mix(in_srgb,var(--color-navy)_14%,transparent)]"
  >
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="group flex h-[52px] flex-1 flex-col items-center justify-center gap-[3px] rounded-(--radius-xl) no-underline transition-colors"
      :class="
        isActive(tab.path) ? 'text-(color:--color-leaf-dark)' : 'text-(color:--color-slate-muted)'
      "
    >
      <component
        :is="tab.icon"
        :size="22"
        filled
      />

      <span
        class="text-[11px] leading-none"
        :class="isActive(tab.path) ? 'font-semibold' : 'font-medium'"
      >{{ tab.label }}</span>
    </router-link>
  </nav>
</template>
