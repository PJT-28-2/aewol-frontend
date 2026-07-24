<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

const tabs = [
  { path: '/home', label: '홈', icon: 'home' },
  { path: '/wallet', label: '지갑', icon: 'wallet' },
  {
    path: '/insurance/simulator',
    label: '보험',
    icon: 'insurance',
  },
  { path: '/settings', label: '마이페이지', icon: 'user' },
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
      <!-- 홈 -->
      <svg
        v-if="tab.icon === 'home'"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M13.768,1.147a2.5,2.5,0,0,0-3.536,0L0,11.38V21a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V11.38ZM21,21H16V17.818A3.818,3.818,0,0,0,12.182,14h-.364A3.818,3.818,0,0,0,8,17.818V21H3V12.622l9-9,9,9Z"
        />
      </svg>

      <!-- 지갑 -->
      <svg
        v-else-if="tab.icon === 'wallet'"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M20.5,6H5.5c-.789,0-1.53-.376-2-.999,.457-.607,1.184-1.001,2-1.001H22.5c1.972-.034,1.971-2.967,0-3H5.5C2.468,1,0,3.467,0,6.5v11c0,3.033,2.468,5.5,5.5,5.5h15c1.93,0,3.5-1.57,3.5-3.5V9.5c0-1.93-1.57-3.5-3.5-3.5Zm.5,13.5c0,.276-.225,.5-.5,.5H5.5c-1.379,0-2.5-1.122-2.5-2.5V8.396c.763,.39,1.618,.604,2.5,.604h15c.275,0,.5,.224,.5,.5v10Zm-2-5c-.034,1.972-2.967,1.971-3,0,.034-1.972,2.967-1.971,3,0Z"
        />
      </svg>

      <!-- 보험 -->
      <svg
        v-else-if="tab.icon === 'insurance'"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="m17.269 16.077c-1.678 4.027-5.705 6.009-7.358 6.674-.275.113-.485.249-.908.249s-.705-.167-1.007-.327c-1.875-.937-7.995-4.451-7.995-10.304v-4.142c0-2.087 1.331-3.931 3.312-4.588l4.716-1.563c.786-.261 1.635.166 1.896.952.261.787-.166 1.635-.952 1.896l-4.716 1.563c-.751.249-1.256.948-1.256 1.74v4.142c0 3.909 4.34 6.577 6.067 7.483 1.256-.545 4.254-2.103 5.432-4.929.319-.764 1.196-1.126 1.962-.808.765.319 1.126 1.197.808 1.962zm6.731-10.077c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6 6 2.686 6 6zm-2.288-1.702c-.383-.399-1.017-.41-1.414-.029l-2.713 2.624c-.143.141-.379.144-.522.002l-1.354-1.331c-.396-.388-1.028-.381-1.414.014-.387.395-.381 1.027.014 1.414l1.354 1.332c.46.449 1.062.674 1.663.674s1.201-.225 1.653-.671l2.703-2.614c.398-.383.411-1.016.029-1.414zm-14.548 5.089c.126.18.268.348.414.509-1.163.642-2.077 1.976-2.077 3.363 0 .962.784 1.742 1.75 1.742h3.5c.966 0 1.75-.78 1.75-1.742 0-1.387-.914-2.72-2.077-3.363.146-.161.288-.329.414-.509.408-.584.007-1.387-.706-1.387h-2.261c-.713 0-1.114.802-.706 1.387z"
        />
      </svg>

      <!-- 마이페이지 -->
      <svg
        v-else-if="tab.icon === 'user'"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M21,24H18V19a2,2,0,0,0-2-2H8a2,2,0,0,0-2,2v5H3V19a5.006,5.006,0,0,1,5-5h8a5.006,5.006,0,0,1,5,5Z"
        />
        <path
          d="M12,12a6,6,0,1,1,6-6A6.006,6.006,0,0,1,12,12Zm0-9a3,3,0,1,0,3,3A3,3,0,0,0,12,3Z"
        />
      </svg>

      <span class="text-xs font-medium">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>
