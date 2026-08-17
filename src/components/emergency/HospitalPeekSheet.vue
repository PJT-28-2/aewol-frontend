<script setup>
import { computed } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconChevronUp from '@/components/common/icons/IconChevronUp.vue'
import IconEmergencyCross from '@/components/common/icons/IconEmergencyCross.vue'
import IconPhone from '@/components/common/icons/IconPhone.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'
import { formatDistance, formatDrivingTime } from '@/utils/distance'

// 지도 위에 얹히는 비모달 peek 시트. BottomSheet.vue와 달리 딤/포커스 트랩이 없어서
// 시트가 떠 있는 동안에도 지도를 그대로 보고 다른 마커를 누를 수 있다.
const props = defineProps({
  hospitals: { type: Array, default: () => [] },
  selected: { type: Object, default: null },
  expanded: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  hasError: { type: Boolean, default: false },
  // 24시간 필터가 켜진 상태의 조회 결과는 전부 24시간 운영 병원이므로 그때만 배지를 붙인다.
  // 백엔드 HospitalResponse에 is24h 필드가 생기면 병원별 값이 우선한다.
  is24hFilter: { type: Boolean, default: false },
})

const emit = defineEmits(['update:expanded', 'select', 'call', 'navigate', 'retry'])

// max-height가 아니라 height를 바꾼다 — 내용이 더 짧으면 max-height는 실제 높이에
// 영향을 주지 않아서 시트가 올라오는 트랜지션이 보이지 않는다.
const heightClass = computed(() => {
  if (props.expanded) return 'h-(--size-map-sheet-list)'
  if (props.hasError || props.selected) return 'h-(--size-map-sheet-detail)'
  return 'h-(--size-map-sheet-summary)'
})

function hospitalKey(hospital) {
  return `${hospital.name}-${hospital.latitude}-${hospital.longitude}`
}

function isAlwaysOpen(hospital) {
  return hospital?.is24h ?? props.is24hFilter
}

function toggleExpanded() {
  emit('update:expanded', !props.expanded)
}

// 목록에서 고르면 시트를 접어서 지도 위 선택된 마커를 바로 확인할 수 있게 한다.
function selectFromList(hospital) {
  emit('select', hospital)
  emit('update:expanded', false)
}
</script>

<template>
  <section
    class="absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-(--radius-sheet) border-t border-(--color-card-border) bg-(--color-app-bg) shadow-[0_-12px_40px_color-mix(in_srgb,var(--color-navy)_14%,transparent)] transition-[height] duration-300 ease-out"
    :class="heightClass"
    aria-label="주변 응급병원"
  >
    <button
      type="button"
      class="flex w-full shrink-0 cursor-pointer justify-center pt-(--space-3) pb-(--space-2)"
      :aria-expanded="expanded"
      :aria-label="expanded ? '목록 접기' : '목록 펼치기'"
      @click="toggleExpanded"
    >
      <span class="h-[5px] w-[44px] rounded-(--radius-full) bg-(--color-slate-light)" />
    </button>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden px-(--space-4) pb-(--space-4)">
      <!-- 조회 실패 -->
      <div
        v-if="hasError"
        class="flex flex-1 flex-col items-center justify-center gap-(--space-3) text-center"
      >
        <IconWarning
          :size="24"
          color="var(--color-slate-muted)"
        />
        <p class="text-(length:--font-md) text-(color:--color-slate-muted)">
          병원 목록을 불러오지 못했습니다.
        </p>
        <AppButton
          variant="secondary"
          size="sm"
          @click="emit('retry')"
        >
          다시 시도
        </AppButton>
      </div>

      <!-- 조회 중 -->
      <div
        v-else-if="isLoading"
        class="flex flex-1 items-center justify-center py-(--space-4)"
      >
        <LoadingSpinner />
      </div>

      <!-- 전체 목록 -->
      <template v-else-if="expanded">
        <p
          class="shrink-0 pb-(--space-3) text-(length:--font-base) font-semibold text-(color:--color-navy)"
        >
          {{ is24hFilter ? '가까운 24시 응급병원' : '가까운 응급병원' }}
        </p>

        <EmptyState
          v-if="!hospitals.length"
          :icon="IconEmergencyCross"
          message="주변에 응급 동물병원이 없습니다."
        />

        <ul
          v-else
          class="flex min-h-0 flex-1 flex-col gap-(--space-2) overflow-y-auto [scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--color-gray-300)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-(--color-gray-300)"
        >
          <li
            v-for="hospital in hospitals"
            :key="hospitalKey(hospital)"
          >
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-(--space-2) rounded-(--radius-2xl) border bg-(--color-white) p-(--space-3) text-left transition-colors"
              :class="
                selected && hospitalKey(selected) === hospitalKey(hospital)
                  ? 'border-(--color-navy)'
                  : 'border-(--color-card-border)'
              "
              @click="selectFromList(hospital)"
            >
              <FeatureIconTile
                :icon="IconEmergencyCross"
                tone="pink"
              />
              <span class="min-w-0 flex-1">
                <span
                  class="block truncate text-(length:--font-md) font-semibold text-(color:--color-navy)"
                >
                  {{ hospital.name }}
                </span>
                <span
                  class="mt-(--space-1) block truncate text-(length:--font-sm) text-(color:--color-slate-muted)"
                >
                  {{ formatDistance(hospital.distanceKm) }} · {{ formatDrivingTime(hospital.distanceKm) }}
                </span>
              </span>
              <IconChevronRight
                :size="18"
                color="var(--color-slate)"
              />
            </button>
          </li>
        </ul>
      </template>

      <!-- 마커에서 선택한 병원 -->
      <template v-else-if="selected">
        <div class="flex shrink-0 items-start gap-(--space-3)">
          <FeatureIconTile
            :icon="IconEmergencyCross"
            tone="pink"
          />
          <div class="min-w-0 flex-1">
            <p
              class="truncate text-(length:--font-base) font-semibold text-(color:--color-navy)"
            >
              {{ selected.name }}
            </p>
            <p
              class="mt-(--space-1) truncate text-(length:--font-sm) text-(color:--color-slate-muted)"
            >
              {{ selected.address }}
            </p>
            <div class="mt-(--space-2) flex flex-wrap gap-(--space-2)">
              <span
                v-if="isAlwaysOpen(selected)"
                class="rounded-(--radius-full) bg-(--color-leaf-surface) px-(--space-3) py-(--space-1) text-(length:--font-xs) font-semibold text-(color:--color-leaf-dark)"
              >
                24시간 진료
              </span>
              <span
                class="rounded-(--radius-full) bg-(--color-info-surface) px-(--space-3) py-(--space-1) text-(length:--font-xs) font-semibold text-(color:--color-slate-dark)"
              >
                {{ formatDistance(selected.distanceKm) }} · {{ formatDrivingTime(selected.distanceKm) }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-(--space-4) flex shrink-0 gap-(--space-2)">
          <AppButton
            variant="secondary"
            size="lg"
            block
            class="border-(--color-border)!"
            @click="emit('call', selected)"
          >
            <IconPhone
              :size="16"
              color="var(--color-navy)"
              class="shrink-0"
            />
            전화
          </AppButton>
          <AppButton
            variant="navy"
            size="lg"
            block
            @click="emit('navigate', selected)"
          >
            길찾기
          </AppButton>
        </div>

        <button
          type="button"
          class="mt-auto flex shrink-0 cursor-pointer items-center justify-between border-t border-(--color-card-border) pt-(--space-3)"
          @click="toggleExpanded"
        >
          <span class="text-(length:--font-sm) text-(color:--color-slate-muted)">
            주변 응급병원 {{ hospitals.length }}곳
          </span>
          <span
            class="flex items-center gap-(--space-1) text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)"
          >
            목록 보기
            <IconChevronUp
              :size="16"
              color="var(--color-slate-dark)"
            />
          </span>
        </button>
      </template>

      <!-- 선택 전 요약 -->
      <button
        v-else
        type="button"
        class="my-auto flex w-full shrink-0 cursor-pointer items-center justify-between"
        @click="toggleExpanded"
      >
        <span class="text-(length:--font-md) font-semibold text-(color:--color-navy)">
          {{
            hospitals.length
              ? `주변 응급병원 ${hospitals.length}곳`
              : '주변에 응급 동물병원이 없습니다'
          }}
        </span>
        <span
          v-if="hospitals.length"
          class="flex items-center gap-(--space-1) text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)"
        >
          목록 보기
          <IconChevronUp
            :size="16"
            color="var(--color-slate-dark)"
          />
        </span>
      </button>
    </div>

    <!-- 목록 상태에서만 접기 버튼을 별도로 둔다 (그래버만으로는 접는 방법이 눈에 안 띈다) -->
    <button
      v-if="expanded"
      type="button"
      class="flex w-full shrink-0 cursor-pointer items-center justify-center gap-(--space-1) border-t border-(--color-card-border) py-(--space-3) text-(length:--font-sm) font-semibold text-(color:--color-slate-dark)"
      @click="toggleExpanded"
    >
      접기
      <IconChevronDown
        :size="16"
        color="var(--color-slate-dark)"
      />
    </button>
  </section>
</template>
