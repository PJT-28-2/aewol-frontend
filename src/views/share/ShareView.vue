<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomNavBar from '@/components/common/BottomNavBar.vue'

const router = useRouter()
const selectedPet = ref('소로')
const pets = ['소로', '나비']
const members = [
  { name: '이애월', ratio: 45, color: '#1B2A49' },
  { name: '김애월', ratio: 30, color: '#F2B853' },
  { name: '박애월', ratio: 15, color: '#6A930D' },
  { name: '최애월', ratio: 10, color: '#98A4BC' },
]

function openInvite() {
  router.push('/share/invite')
}
</script>

<template>
  <main class="share-screen">
    <header class="share-heading">
      <h1>함께 돌보기</h1>
      <p>가족과 지갑을 공유하고 기여도를 확인해요</p>
    </header>

    <div class="pet-switcher" role="tablist" aria-label="반려동물 선택">
      <button
        v-for="pet in pets"
        :key="pet"
        class="pet-tab"
        :class="{ active: selectedPet === pet }"
        type="button"
        @click="selectedPet = pet"
      >🐕 {{ pet }}</button>
    </div>

    <section class="members-block">
      <h2>참여 중인 가족</h2>
      <div class="member-avatars">
        <div v-for="(member, index) in members.slice(0, 3)" :key="member.name" class="member-avatar-wrap">
          <div class="member-avatar" :class="`avatar-${index}`">{{ member.name.slice(0, 1) }}</div>
          <strong>{{ member.name }}</strong>
        </div>
        <button class="member-avatar-wrap invite-avatar" type="button" @click="openInvite">
          <span class="member-avatar">+</span><strong>초대</strong>
        </button>
      </div>
    </section>

    <section class="contribution-card" aria-label="이번 달 기여 비율">
      <div class="donut-chart">
        <div class="donut-label"><strong>기여 비율</strong><span>이번 달</span></div>
      </div>
    </section>

    <section class="contribution-list">
      <div v-for="member in members" :key="member.name" class="contribution-row">
        <span class="legend-dot" :style="{ backgroundColor: member.color }"></span>
        <strong>{{ member.name }}</strong><span class="ratio">{{ member.ratio }}%</span>
      </div>
    </section>
  </main>
  <BottomNavBar />
</template>

<style scoped>
.share-screen { width: min(100%, 390px); min-height: 968px; margin: 0 auto; padding: 58px 22px 102px; background: #fff; color: #1b2a49; box-sizing: border-box; }
.share-heading h1 { margin: 0; font-size: 20px; line-height: 1.3; font-weight: 700; }
.share-heading p { margin: 4px 0 0; color: #8a93a6; font-size: 12.5px; }
.pet-switcher { display: flex; gap: 8px; margin-top: 30px; }
.pet-tab { width: 73px; height: 36px; border: 1px solid #eaeae4; border-radius: 999px; background: #fafaf8; color: #4a5a7d; font: 700 12.5px Inter, sans-serif; cursor: pointer; }
.pet-tab.active { border-color: #1b2a49; background: #1b2a49; color: #fff; }
.members-block { margin-top: 42px; }
.members-block h2 { margin: 0 0 16px; font-size: 15px; }
.member-avatars { display: flex; gap: 14px; }
.member-avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 64px; border: 0; background: none; color: #1b2a49; font-size: 11.5px; cursor: pointer; padding: 0; }
.member-avatar { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; color: #fff; font-size: 18px; font-weight: 700; background: #f2b853; }
.avatar-1 { background: #4a5a7d; }.avatar-2 { background: #6a930d; }.invite-avatar .member-avatar { background: #fafaf8; color: #8a93a6; font-size: 28px; }
.contribution-card { display: grid; place-items: center; margin-top: 42px; }
.donut-chart { display: grid; place-items: center; width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(#1b2a49 0 45%, #f2b853 45% 75%, #6a930d 75% 90%, #98a4bc 90% 100%); }
.donut-chart::before { content: ''; position: absolute; width: 132px; height: 132px; border-radius: 50%; background: #fff; }
.donut-label { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }.donut-label strong { font-size: 16px; }.donut-label span { color: #8a93a6; font-size: 11.5px; }
.contribution-list { display: flex; flex-direction: column; gap: 8px; margin-top: 40px; }.contribution-row { display: flex; align-items: center; height: 50px; padding: 0 16px; border-radius: 12px; background: #fafaf8; box-sizing: border-box; font-size: 12.5px; }.legend-dot { width: 14px; height: 14px; margin-right: 10px; border-radius: 50%; }.ratio { margin-left: auto; color: #4a5a7d; font-weight: 700; }
</style>
