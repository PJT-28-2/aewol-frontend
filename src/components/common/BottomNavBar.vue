<script setup>
import { useRoute } from 'vue-router';
import IconHome from './icons/IconHome.vue';
import IconInsurance from './icons/IconInsurance.vue';
import IconUser from './icons/IconUser.vue';
import IconWallet from './icons/IconWallet.vue';

const route = useRoute();

const tabs = [
  { path: '/home', label: '홈', icon: IconHome },
  { path: '/wallet', label: '지갑', icon: IconWallet },
  {
    path: '/insurance/simulator',
    label: '보험',
    icon: IconInsurance,
  },
  { path: '/settings', label: '마이페이지', icon: IconUser },
];

function isActive(path) {
  return route.path.startsWith(path);
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-100 flex items-center justify-around h-(--bottom-nav-height) bg-white border-t border-[#EAEAE4] pb-[env(safe-area-inset-bottom,0)]"
  >
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="flex flex-col items-center justify-center flex-1 h-full gap-1 no-underline"
      :class="
        isActive(tab.path) ? 'text-[#1B2A49]' : 'text-[#8A93A6]'
      "
    >
      <component
        :is="tab.icon"
        :size="22"
      />

      <span class="text-xs font-medium">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>
