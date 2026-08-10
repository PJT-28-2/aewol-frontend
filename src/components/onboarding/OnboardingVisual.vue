<script setup>
import IconDocument from '@/components/common/icons/IconDocument.vue'
import IconDogBowl from '@/components/common/icons/IconDogBowl.vue'
import IconHospital from '@/components/common/icons/IconHospital.vue'
import IconPetInsurance from '@/components/common/icons/IconPetInsurance.vue'
import IconQrCode from '@/components/common/icons/IconQrCode.vue'
import IconRecurring from '@/components/common/icons/IconRecurring.vue'
import IconShowerGel from '@/components/common/icons/IconShowerGel.vue'
import IconStats from '@/components/common/icons/IconStats.vue'
import IconWallet from '@/components/common/icons/IconWallet.vue'

defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['wallet', 'report', 'insurance'].includes(value),
  },
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden rounded-[28px] bg-(--color-leaf-soft)">
    <template v-if="type === 'wallet'">
      <div class="absolute inset-x-[24px] top-[66px]">
        <div class="rounded-[26px] bg-(--color-navy) p-(--space-4) text-(--color-white) shadow-(--shadow-lg)">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-[5px] text-[9px] font-bold tracking-[0.08em] text-(--color-leaf)">
              <span class="size-[5px] rounded-full bg-(--color-leaf)" />
              PET WALLET
            </span>
            <IconWallet
              :size="22"
              color="var(--color-leaf)"
            />
          </div>
          <p class="mt-(--space-3) text-[10px] font-medium text-(--color-slate-light)">
            포리의 애월 지갑
          </p>
          <strong class="mt-(--space-1) block text-[26px] tracking-[-0.04em]">482,600원</strong>
          <div class="mt-(--space-3) grid grid-cols-4 gap-[5px] text-center text-[9px] font-semibold">
            <span class="rounded-full bg-[color-mix(in_srgb,var(--color-white)_12%,transparent)] py-[6px]">충전</span>
            <span class="rounded-full bg-[color-mix(in_srgb,var(--color-white)_12%,transparent)] py-[6px]">송금</span>
            <span class="col-span-2 flex items-center justify-center gap-[5px] rounded-full bg-(--color-leaf) py-[6px] font-bold text-(--color-navy) shadow-(--shadow-sm)">
              <IconQrCode :size="14" /> QR 결제
            </span>
          </div>
        </div>
        <div class="mt-(--space-3) grid grid-cols-2 gap-(--space-2)">
          <div class="flex items-center gap-(--space-2) rounded-[17px] bg-(--color-white) p-(--space-3) shadow-(--shadow-sm)">
            <span class="flex size-[32px] shrink-0 items-center justify-center rounded-[11px] bg-(--color-icon-green-soft) text-(--color-icon-green)"><IconWallet :size="18" /></span>
            <div><strong class="block text-[10px] text-(--color-navy)">거래 내역</strong><span class="text-[9px] text-(--color-slate-muted)">결제 후 자동 기록</span></div>
          </div>
          <div class="flex items-center gap-(--space-2) rounded-[17px] bg-(--color-white) p-(--space-3) shadow-(--shadow-sm)">
            <span class="flex size-[32px] shrink-0 items-center justify-center rounded-[11px] bg-(--color-icon-purple-soft) text-(--color-icon-purple)"><IconRecurring :size="18" /></span>
            <div><strong class="block text-[10px] text-(--color-navy)">정기결제</strong><span class="text-[9px] text-(--color-slate-muted)">일정과 금액 관리</span></div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="type === 'report'">
      <div class="absolute inset-x-[24px] top-[54px]">
        <div class="flex items-center justify-between px-(--space-1)">
          <div class="flex items-center gap-(--space-2)">
            <span class="flex size-[38px] items-center justify-center rounded-[13px] bg-(--color-icon-blue-soft) text-(--color-icon-blue)"><IconStats :size="21" /></span>
            <strong class="text-(length:--font-sm) text-(--color-navy)">8월 지출 리포트</strong>
          </div>
          <div class="flex rounded-full bg-(--color-white) p-[3px] text-[9px] font-semibold shadow-(--shadow-sm)">
            <span class="rounded-full bg-(--color-navy) px-(--space-2) py-[5px] text-(--color-white)">카테고리</span>
            <span class="px-(--space-2) py-[5px] text-(--color-slate-muted)">반려동물</span>
          </div>
        </div>

        <div class="mt-(--space-3) rounded-[25px] bg-(--color-white) p-(--space-4) shadow-(--shadow-md)">
          <span class="text-[10px] font-medium text-(--color-slate-muted)">이번 달 총 지출</span>
          <strong class="mt-[2px] block text-[25px] tracking-[-0.03em] text-(--color-navy)">324,600원</strong>
          <div class="mt-(--space-3) space-y-[10px]">
            <div class="flex items-center gap-(--space-2)">
              <span class="flex size-[29px] items-center justify-center rounded-[10px] bg-(--color-icon-blue-soft) text-(--color-icon-blue)"><IconHospital :size="17" /></span>
              <span class="w-[38px] text-[10px] font-semibold text-(--color-slate-dark)">의료비</span>
              <span class="h-[7px] flex-1 overflow-hidden rounded-full bg-(--color-gray-200)"><span class="block h-full w-[68%] rounded-full bg-(--color-chart-leaf)" /></span>
              <span class="text-[10px] font-bold text-(--color-navy)">48%</span>
            </div>
            <div class="flex items-center gap-(--space-2)">
              <span class="flex size-[29px] items-center justify-center rounded-[10px] bg-(--color-icon-yellow-soft) text-(--color-icon-yellow)"><IconDogBowl :size="17" /></span>
              <span class="w-[38px] text-[10px] font-semibold text-(--color-slate-dark)">식비</span>
              <span class="h-[7px] flex-1 overflow-hidden rounded-full bg-(--color-gray-200)"><span class="block h-full w-[42%] rounded-full bg-(--color-chart-amber)" /></span>
              <span class="text-[10px] font-bold text-(--color-navy)">31%</span>
            </div>
            <div class="flex items-center gap-(--space-2)">
              <span class="flex size-[29px] items-center justify-center rounded-[10px] bg-(--color-icon-pink-soft) text-(--color-icon-pink)"><IconShowerGel :size="17" /></span>
              <span class="w-[38px] text-[10px] font-semibold text-(--color-slate-dark)">미용</span>
              <span class="h-[7px] flex-1 overflow-hidden rounded-full bg-(--color-gray-200)"><span class="block h-full w-[24%] rounded-full bg-(--color-chart-lilac)" /></span>
              <span class="text-[10px] font-bold text-(--color-navy)">15%</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="absolute inset-x-[24px] top-[52px]">
        <div class="mx-auto flex size-[96px] items-center justify-center rounded-[32px] bg-(--color-navy) text-(--color-leaf) shadow-(--shadow-lg)">
          <IconPetInsurance :size="58" />
        </div>

        <div class="mt-(--space-4) rounded-[23px] bg-(--color-white) p-(--space-4) shadow-(--shadow-md)">
          <div class="flex items-center gap-(--space-3)">
            <span class="flex size-[40px] shrink-0 items-center justify-center rounded-[14px] bg-(--color-icon-purple-soft) text-(--color-icon-purple)"><IconStats :size="22" /></span>
            <div class="min-w-0 flex-1">
              <span class="text-[9px] font-medium text-(--color-slate-muted)">보험 손익분기 결과</span>
              <div class="mt-[3px] flex items-center gap-(--space-2)">
                <strong class="text-(length:--font-sm) text-(--color-navy)">가입 유리</strong><span class="rounded-full bg-(--color-leaf-soft) px-(--space-2) py-[3px] text-[9px] font-bold text-(--color-leaf-dark)">예상 비용 비교</span>
              </div>
            </div>
          </div>
          <div class="my-(--space-3) h-px bg-(--color-card-border)" />
          <div class="flex items-center gap-(--space-3)">
            <span class="flex size-[40px] shrink-0 items-center justify-center rounded-[14px] bg-(--color-icon-pink-soft) text-(--color-icon-pink)"><IconDocument :size="22" /></span>
            <div class="min-w-0 flex-1">
              <strong class="block text-[11px] text-(--color-navy)">영수증으로 청구서 초안</strong><span class="mt-[2px] block text-[9px] text-(--color-slate-muted)">정보를 확인하고 서류를 완성해요</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
