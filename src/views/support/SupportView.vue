<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomNavBar from '@/components/common/BottomNavBar.vue'

const route = useRoute(); const router = useRouter()
const detail = computed(() => Boolean(route.params.programId))
const programs = [
  { id: 'neuter', title: '서울시 반려동물 중성화 지원', description: '소득 조건 충족 · 최대 15만원', available: true },
  { id: 'vaccine', title: '강아지 예방접종비 지원사업', description: '만 2세 이하 반려견 대상', available: true },
  { id: 'adoption', title: '유기동물 입양비 지원', description: '입양 후 6개월 이내 신청', available: false },
]
const selected = computed(() => programs.find((program) => program.id === route.params.programId) ?? programs[2])
</script>

<template>
  <main class="support-screen">
    <template v-if="!detail">
      <h1>우리 동네 지원사업</h1><p class="description">프로필 조건에 맞는 지원사업을 모아봤어요</p>
      <article v-for="program in programs" :key="program.id" class="program-card" :class="{ unavailable: !program.available }"><span class="status" :class="{ fail: !program.available }">{{ program.available ? '신청 가능' : '조건 미충족' }}</span><h2>{{ program.title }}</h2><p>{{ program.description }}</p><button type="button" @click="router.push(program.available ? `/support/${program.id}` : `/support/${program.id}`)">{{ program.available ? '신청하기' : '조건 보기' }}</button></article>
    </template>
    <template v-else>
      <button class="back" type="button" @click="router.push('/support')">‹</button><span class="status fail">조건 미충족</span><h1>{{ selected.title }}</h1><p class="description">제주시 동물복지과 · 최대 20만원</p><section class="period"><b>신청 기간</b><strong>입양일로부터 6개월 이내</strong></section><h2 class="section-title">신청 조건</h2><div class="condition ok"><b>✓</b><span><strong>반려동물 등록 완료</strong><small>국가동물보호정보시스템에 등록되어 있어요</small></span></div><div class="condition ok"><b>✓</b><span><strong>제주시 거주자</strong><small>프로필상 거주지 조건을 충족했어요</small></span></div><div class="condition fail-row"><b>✕</b><span><strong>입양 후 6개월 이내 신청</strong><small>입양일로부터 8개월이 지나 신청 기간이 지났어요</small></span></div><div class="notice">💡 신청 기간이 지나 이 지원사업은 신청할 수 없어요<br/><small>비슷한 조건의 다른 지원사업을 확인해보세요</small></div><button class="primary" type="button" @click="router.push('/support')">비슷한 지원사업 더 보기</button><button class="secondary" type="button" @click="router.push('/support')">목록으로 돌아가기</button>
    </template>
  </main>
  <BottomNavBar v-if="!detail" />
</template>

<style scoped>
.support-screen { width: min(100%, 390px); min-height: 780px; margin: 0 auto; padding: 62px 22px 100px; box-sizing: border-box; color: #1b2a49; background: #fff; }.support-screen h1 { margin: 0; font-size: 20px; }.description { margin: 4px 0 36px; color: #8a93a6; font-size: 12.5px; }.program-card { position: relative; height: 118px; margin-bottom: 14px; padding: 16px; box-sizing: border-box; border: 1px solid #eaeae4; border-radius: 18px; }.program-card.unavailable { background: #fafaf8; }.status { display: inline-grid; place-items: center; height: 20px; padding: 0 8px; border-radius: 10px; background: #eef3e2; color: #3f5a08; font-size: 10.5px; font-weight: 700; }.status.fail { background: #f2e3e3; color: #8a3b3b; }.program-card h2 { margin: 7px 0 4px; font-size: 14px; }.program-card p { margin: 0; color: #8a93a6; font-size: 11.5px; }.program-card button { position: absolute; right: 16px; bottom: 12px; width: 82px; height: 26px; border: 0; border-radius: 8px; background: #1b2a49; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer; }.unavailable button { border: 1px solid #eaeae4; background: #fff; color: #4a5a7d; }.back { display: block; margin: -12px 0 22px -8px; border: 0; background: none; color: #1b2a49; font-size: 32px; cursor: pointer; }.support-screen>.status { margin-bottom: 12px; }.period,.notice { margin-top: 28px; padding: 12px 16px; border-radius: 14px; background: #fafaf8; }.period b,.period strong { display: block; }.period b { color: #4a5a7d; font-size: 11px; }.period strong { margin-top: 6px; font-size: 12.5px; }.section-title { margin: 28px 0 12px; font-size: 15px; }.condition { display: flex; gap: 12px; align-items: flex-start; margin: 14px 0; }.condition>b { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #eef3e2; color: #3f5a08; }.condition.fail-row>b { background: #f2e3e3; color: #8a3b3b; }.condition span { display: flex; flex-direction: column; gap: 4px; }.condition strong { font-size: 13px; }.condition small,.notice { color: #8a93a6; font-size: 11px; }.notice { color: #4a5a7d; line-height: 1.6; }.notice small { color: #8a93a6; }.primary,.secondary { width: 100%; height: 52px; margin-top: 16px; border: 0; border-radius: 16px; background: #1b2a49; color: #fff; font-weight: 700; cursor: pointer; }.secondary { height: 50px; border: 1px solid #eaeae4; background: #fff; color: #4a5a7d; }
</style>
