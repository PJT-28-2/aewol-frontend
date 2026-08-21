<script setup>
import welcomePets from '@/assets/images/onboarding-welcome-pets-v4.png'
import memoryPlay from '@/assets/images/onboarding-memory-play-v1.png'
import memoryWalk from '@/assets/images/onboarding-memory-walk-v1.png'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import IconRegistrationPaper from '@/components/common/icons/IconRegistrationPaper.vue'
import IconStethoscope from '@/components/common/icons/IconStethoscope.vue'
import IconSyringe from '@/components/common/icons/IconSyringe.vue'

defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['wallet', 'memories', 'family', 'identity'].includes(value),
  },
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden rounded-[28px] bg-(--color-leaf-soft)">
    <!-- HomeView의 MY PET 카드와 애월지갑 카드를 축약해 사용 -->
    <div v-if="type === 'wallet'" class="absolute inset-x-[28px] top-1/2 -translate-y-1/2 [@media(max-height:720px)]:scale-[0.68] [@media(max-height:640px)]:scale-[0.6]">
      <section class="relative flex h-[265px] items-end justify-center overflow-hidden rounded-[28px] bg-(--color-leaf-soft)">
        <div class="absolute top-0 left-(--space-4) z-2">
          <p class="text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap text-(--color-leaf-dark)">AEWOL PET</p>
          <strong class="mt-[3px] block text-[15px] text-(--color-navy)">포리 · 나비</strong>
        </div>
        <img :src="welcomePets" alt="애월의 강아지와 고양이 대표 캐릭터" class="absolute right-0 bottom-0 z-1 h-[230px] w-full object-contain" />
      </section>

      <section class="relative z-2 mt-(--space-3) rounded-[24px] bg-(--color-white) px-(--space-5) py-(--space-4) shadow-(--shadow-card)">
        <p class="text-[10px] font-medium text-(--color-slate-muted)">김애월님의 애월지갑</p>
        <strong class="mt-(--space-1) block text-[24px] tracking-[-0.03em] text-(--color-navy)">365,000원</strong>
        <div class="mt-(--space-3) grid grid-cols-3 divide-x divide-(--color-card-border) text-center text-[10px] text-(--color-slate-dark)">
          <span>충전</span>
          <span class="font-bold text-(--color-navy)">QR 결제</span>
          <span>조회</span>
        </div>
      </section>
    </div>

    <!-- 육아일기 목록(ShareDiaryView)의 카드 구조를 축약해 사용 -->
    <div v-else-if="type === 'memories'" class="absolute inset-x-[32px] top-1/2 -translate-y-1/2 [@media(max-height:720px)]:scale-[0.68] [@media(max-height:640px)]:scale-[0.6]">
      <div class="flex items-center justify-between px-(--space-2)">
        <span class="grid size-[26px] place-items-center rounded-full bg-(--color-white) text-(--color-slate-dark)">
          <IconChevronRight class="rotate-180" :size="15" />
        </span>
        <strong class="text-[12px] text-(--color-navy)">2026년 8월</strong>
        <span class="grid size-[26px] place-items-center rounded-full bg-(--color-white) text-(--color-slate-dark)">
          <IconChevronRight :size="15" />
        </span>
      </div>

      <div class="mt-(--space-3)">
        <h3 class="mb-(--space-2) text-[10px] font-semibold text-(--color-slate-muted)">2026. 08. 20</h3>
        <article class="overflow-hidden rounded-[18px] border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-sm)">
          <img :src="memoryPlay" alt="집에서 장난감을 가지고 노는 포리와 나비" class="block h-[114px] w-full object-cover object-[center_55%]" />
          <div class="flex items-center gap-(--space-2) px-(--space-3) py-(--space-2)">
            <span class="grid size-[25px] shrink-0 place-items-center rounded-full bg-(--color-leaf) text-[9px] font-bold text-(--color-navy)">김</span>
            <div class="min-w-0">
              <strong class="block text-[10px] text-(--color-navy)">김애월</strong>
              <p class="mt-[2px] truncate text-[9px] text-(--color-slate-muted)">장난감을 가지고 노는 포리와 나비</p>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-(--space-3)">
        <h3 class="mb-(--space-2) text-[10px] font-semibold text-(--color-slate-muted)">2026. 08. 18</h3>
        <article class="overflow-hidden rounded-[18px] border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-sm)">
          <img :src="memoryWalk" alt="공원에서 아침 산책을 즐기는 포리" class="block h-[97px] w-full object-cover object-[center_58%]" />
          <div class="flex items-center gap-(--space-2) px-(--space-3) py-(--space-2)">
            <span class="grid size-[24px] shrink-0 place-items-center rounded-full bg-(--color-icon-blue) text-[9px] font-bold text-(--color-white)">김</span>
            <div class="min-w-0">
              <strong class="block text-[10px] text-(--color-navy)">김지원</strong>
              <p class="mt-[2px] truncate text-[9px] text-(--color-slate-muted)">포리는 정말 낙엽을 좋아해</p>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- ShareView의 반려동물 선택과 참여 중인 가족 UI를 축약해 사용 -->
    <div v-else-if="type === 'family'" class="absolute inset-x-[32px] top-1/2 -translate-y-1/2 [@media(max-height:720px)]:scale-[0.68] [@media(max-height:640px)]:scale-[0.6]">
      <header class="mb-(--space-3)">
        <strong class="block text-[15px] text-(--color-navy)">함께 돌보기</strong>
        <span class="mt-[3px] block text-[9px] text-(--color-slate-muted)">가족과 돌봄 기록을 나누고 함께 관리해요</span>
      </header>
      <section>
        <strong class="text-[11px] text-(--color-navy)">반려동물 선택</strong>
        <div class="mt-(--space-2) flex items-center gap-(--space-2)">
          <span class="rounded-full bg-(--color-navy) px-(--space-4) py-[7px] text-[10px] font-semibold text-(--color-white)">포리</span>
          <span class="rounded-full border border-(--color-card-border) bg-(--color-white) px-(--space-4) py-[7px] text-[10px] font-semibold text-(--color-slate-dark)">나비</span>
          <span class="grid size-[29px] place-items-center rounded-full bg-(--color-white) text-(--color-navy) shadow-(--shadow-sm)"><IconPlus :size="15" /></span>
        </div>
      </section>

      <section class="mt-(--space-3) rounded-[20px] bg-(--color-white) p-(--space-4) shadow-(--shadow-sm)">
        <strong class="text-[11px] text-(--color-navy)">참여 중인 가족</strong>
        <div class="mt-(--space-3) flex items-start justify-between px-(--space-2)">
          <div v-for="member in [{ initial: '김', name: '김애월', tone: 'bg-(--color-navy)' }, { initial: '김', name: '김지원', tone: 'bg-(--color-icon-blue)' }, { initial: '김', name: '김서준', tone: 'bg-(--color-icon-pink)' }]" :key="member.name" class="w-[48px] text-center">
            <span class="mx-auto grid size-[36px] place-items-center rounded-full text-[10px] font-bold text-(--color-white)" :class="member.tone">{{ member.initial }}</span>
            <span class="mt-[5px] block truncate text-[9px] text-(--color-slate-dark)">{{ member.name }}</span>
          </div>
          <div class="w-[48px] text-center">
            <span class="mx-auto grid size-[36px] place-items-center rounded-full bg-(--color-leaf-soft) text-(--color-navy)"><IconPlus :size="16" /></span>
            <span class="mt-[5px] block text-[9px] font-semibold text-(--color-slate-dark)">초대</span>
          </div>
        </div>
      </section>

      <div class="mt-(--space-3) flex h-[36px] items-center justify-center gap-(--space-2) rounded-[14px] border border-(--color-card-border) bg-(--color-white) text-[10px] font-semibold text-(--color-navy)">
        <IconDocument :size="15" />
        육아일기 보기
      </div>

      <section class="mt-(--space-3) flex items-center rounded-[20px] bg-(--color-white) px-(--space-4) py-(--space-3) shadow-(--shadow-sm)">
        <div class="relative grid size-[66px] shrink-0 place-items-center rounded-full bg-[conic-gradient(var(--color-leaf)_0_46%,var(--color-icon-blue)_46%_78%,var(--color-icon-pink)_78%_100%)]">
          <span class="grid size-[43px] place-items-center rounded-full bg-(--color-white) text-center text-[9px] font-semibold leading-[1.25] text-(--color-navy)">이번 달<br />기여 비율</span>
        </div>
        <div class="ml-(--space-4) flex-1 space-y-[6px] text-[9px] text-(--color-slate-dark)">
          <div class="flex items-center"><span class="mr-[6px] size-[6px] rounded-full bg-(--color-leaf)" />김애월 <strong class="ml-auto text-(--color-navy)">46%</strong></div>
          <div class="flex items-center"><span class="mr-[6px] size-[6px] rounded-full bg-(--color-icon-blue)" />김지원 <strong class="ml-auto text-(--color-navy)">32%</strong></div>
          <div class="flex items-center"><span class="mr-[6px] size-[6px] rounded-full bg-(--color-icon-pink)" />김서준 <strong class="ml-auto text-(--color-navy)">22%</strong></div>
        </div>
      </section>
    </div>

    <!-- CertificateListView의 목록과 CertificateDetailView의 펼친 문서를 함께 축약해 사용 -->
    <div v-else class="absolute inset-x-[24px] top-[24px] [@media(max-height:720px)]:top-[14px] [@media(max-height:720px)]:scale-[0.62] [@media(max-height:720px)]:origin-top [@media(max-height:640px)]:scale-[0.54]">
      <header class="mb-(--space-2)">
        <strong class="block text-[15px] text-(--color-navy)">증명서 관리</strong>
        <span class="mt-[2px] block text-[9px] text-(--color-slate-muted)">동물등록증 · 접종증명서를 한곳에서 확인해요</span>
      </header>

      <section>
        <strong class="text-[10px] text-(--color-navy)">동물등록증</strong>
        <article class="mt-[6px] overflow-hidden rounded-[18px] border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-sm)">
          <div class="flex items-center gap-(--space-2) px-(--space-3) py-(--space-2)">
            <span class="grid size-[32px] shrink-0 place-items-center rounded-[11px] bg-(--color-icon-pink-soft) text-(--color-icon-pink)"><IconRegistrationPaper :size="17" /></span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-[5px]"><strong class="truncate text-[9px] text-(--color-navy)">포리 동물등록증</strong><span class="rounded-full bg-(--color-olive-surface) px-[5px] py-[2px] text-[7px] font-semibold text-(--color-olive)">APMS 연동됨</span></div>
              <span class="mt-[2px] block text-[8px] text-(--color-slate-muted)">등록번호 4101•••••••9012</span>
            </div>
            <IconChevronRight class="-rotate-90" :size="14" color="var(--color-gray-400)" />
          </div>

          <div class="border-t border-(--color-card-border) bg-(--color-surface) p-(--space-3)">
            <div class="rounded-[13px] border border-(--color-card-border) bg-(--color-white)">
              <div class="flex items-center justify-center gap-[7px] rounded-t-[13px] bg-(--color-pastel-cream) py-[8px]">
                <IconDocument :size="15" color="var(--color-icon-pink)" />
                <strong class="text-[10px] tracking-[0.16em] text-(--color-navy)">동 물 등 록 증</strong>
              </div>
              <dl class="divide-y divide-(--color-card-border) px-(--space-4) py-[3px]">
                <div v-for="row in [{ label: '등록번호', value: '4101•••••••9012' }, { label: '동물명', value: '포리' }, { label: '품종', value: '토이푸들' }, { label: '성별', value: '암컷' }, { label: '출생연월일', value: '2013. 01. 01' }, { label: '승인여부', value: '승인' }]" :key="row.label" class="flex min-w-0 items-center gap-(--space-3) py-[5px]">
                  <dt class="w-[37%] shrink-0 text-[8px] text-(--color-slate-muted)">{{ row.label }}</dt>
                  <dd class="truncate text-[9px] font-semibold text-(--color-navy)">{{ row.value }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </article>
      </section>

      <section class="mt-(--space-2)">
        <strong class="text-[10px] text-(--color-navy)">접종증명서</strong>
        <div class="mt-[6px] flex items-center gap-(--space-2) rounded-[16px] border border-(--color-card-border) bg-(--color-white) px-(--space-3) py-(--space-2) shadow-(--shadow-sm)">
          <span class="grid size-[30px] shrink-0 place-items-center rounded-[10px] bg-(--color-icon-blue-soft) text-(--color-icon-blue)"><IconSyringe :size="16" /></span>
          <div class="min-w-0 flex-1"><strong class="block truncate text-[9px] text-(--color-navy)">종합백신 접종증명서</strong><span class="mt-[2px] block text-[8px] text-(--color-slate-muted)">2026. 07. 12 발급</span></div>
          <IconChevronRight :size="14" color="var(--color-gray-400)" />
        </div>
      </section>

      <section class="mt-(--space-2)">
        <strong class="text-[10px] text-(--color-navy)">진료확인서</strong>
        <div class="mt-[6px] flex items-center gap-(--space-2) rounded-[16px] border border-(--color-card-border) bg-(--color-white) px-(--space-3) py-(--space-2) shadow-(--shadow-sm)">
          <span class="grid size-[30px] shrink-0 place-items-center rounded-[10px] bg-(--color-leaf-soft) text-(--color-leaf-dark)"><IconStethoscope :size="16" /></span>
          <div class="min-w-0 flex-1"><strong class="block truncate text-[9px] text-(--color-navy)">정기검진 진료확인서</strong><span class="mt-[2px] block text-[8px] text-(--color-slate-muted)">2026. 06. 28 업로드</span></div>
          <IconChevronRight :size="14" color="var(--color-gray-400)" />
        </div>
      </section>
    </div>
  </div>
</template>
