<script setup>
import { computed, ref, watch } from 'vue';
import BottomSheet from '@/components/common/BottomSheet.vue';
import IconCheck from '@/components/common/icons/IconCheck.vue';
import IconChevronDown from '@/components/common/icons/IconChevronDown.vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  minYear: {
    type: Number,
    default: () => new Date().getFullYear() - 50,
  },
});

const emit = defineEmits(['update:modelValue']);

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const currentDay = today.getDate();

const selectedYear = ref('');
const selectedMonth = ref('');
const selectedDay = ref('');

const openSheet = ref(null);

const years = computed(() =>
  Array.from(
    { length: currentYear - props.minYear + 1 },
    (_, index) => currentYear - index,
  ),
);

const months = computed(() => {
  const lastMonth = Number(selectedYear.value) === currentYear ? currentMonth : 12;
  return Array.from({ length: lastMonth }, (_, index) => index + 1);
});

const days = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) return [];

  const year = Number(selectedYear.value);
  const month = Number(selectedMonth.value);
  const lastDay = year === currentYear && month === currentMonth
    ? currentDay
    : new Date(year, month, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => index + 1);
});

function pad(value) {
  return String(value).padStart(2, '0');
}

function parseModelValue(value) {
  if (!value) return { year: '', month: '', day: '' };

  const match = /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const lastDay = new Date(year, month, 0).getDate();
  const isFuture = year > currentYear
    || (year === currentYear && month > currentMonth)
    || (year === currentYear && month === currentMonth && day > currentDay);

  if (year < props.minYear || year > currentYear
      || month < 1 || month > 12
      || day < 1 || day > lastDay
      || isFuture) {
    return null;
  }

  return {
    year: String(year),
    month: String(month),
    day: String(day),
  };
}

function syncFromModel(value) {
  const parsed = parseModelValue(value);
  selectedYear.value = parsed?.year ?? '';
  selectedMonth.value = parsed?.month ?? '';
  selectedDay.value = parsed?.day ?? '';
}

watch(
  () => props.modelValue,
  (value) => syncFromModel(value),
  { immediate: true },
);

function clampSelection() {
  if (selectedMonth.value && !months.value.includes(Number(selectedMonth.value))) {
    selectedMonth.value = String(months.value.at(-1));
  }
  if (selectedDay.value && !days.value.includes(Number(selectedDay.value))) {
    selectedDay.value = days.value.length ? String(days.value.at(-1)) : '';
  }
}

function emitSelection() {
  const isComplete = selectedYear.value && selectedMonth.value && selectedDay.value;
  if (!isComplete) return;

  const nextValue = `${selectedYear.value}.${pad(selectedMonth.value)}.${pad(selectedDay.value)}`;
  if (nextValue !== props.modelValue) emit('update:modelValue', nextValue);
}

function selectYear(year) {
  selectedYear.value = String(year);
  clampSelection();
  emitSelection();
  openSheet.value = null;
}

function selectMonth(month) {
  selectedMonth.value = String(month);
  clampSelection();
  emitSelection();
  openSheet.value = null;
}

function selectDay(day) {
  selectedDay.value = String(day);
  emitSelection();
  openSheet.value = null;
}

const yearSheetOpen = computed({
  get: () => openSheet.value === 'year',
  set: (isOpen) => { openSheet.value = isOpen ? 'year' : null; },
});
const monthSheetOpen = computed({
  get: () => openSheet.value === 'month',
  set: (isOpen) => { openSheet.value = isOpen ? 'month' : null; },
});
const daySheetOpen = computed({
  get: () => openSheet.value === 'day',
  set: (isOpen) => { openSheet.value = isOpen ? 'day' : null; },
});
</script>

<template>
  <fieldset>
    <legend class="mb-(--space-2) text-(length:--font-sm) font-medium text-(color:--color-slate-dark)">
      생년월일
    </legend>
    <div class="grid grid-cols-3 gap-(--space-2)">
      <button
        type="button"
        data-testid="birth-year-trigger"
        class="flex h-[48px] min-w-0 items-center justify-between rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft)"
        :class="selectedYear ? 'text-(color:--color-navy)' : 'text-(color:--color-slate-muted)'"
        @click="yearSheetOpen = true"
      >
        <span class="truncate">{{ selectedYear ? `${selectedYear}년` : '년' }}</span>
        <IconChevronDown
          size="14"
          color="var(--color-slate-muted)"
          class="shrink-0"
        />
      </button>

      <button
        type="button"
        data-testid="birth-month-trigger"
        class="flex h-[48px] min-w-0 items-center justify-between rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft)"
        :class="selectedMonth ? 'text-(color:--color-navy)' : 'text-(color:--color-slate-muted)'"
        @click="monthSheetOpen = true"
      >
        <span class="truncate">{{ selectedMonth ? `${selectedMonth}월` : '월' }}</span>
        <IconChevronDown
          size="14"
          color="var(--color-slate-muted)"
          class="shrink-0"
        />
      </button>

      <button
        type="button"
        data-testid="birth-day-trigger"
        :disabled="!days.length"
        class="flex h-[48px] min-w-0 items-center justify-between rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-app-bg) px-(--space-3) text-(length:--font-sm) outline-none focus-visible:border-(--color-leaf-dark) focus-visible:ring-2 focus-visible:ring-(--color-leaf-soft) disabled:opacity-50"
        :class="selectedDay ? 'text-(color:--color-navy)' : 'text-(color:--color-slate-muted)'"
        @click="daySheetOpen = true"
      >
        <span class="truncate">{{ selectedDay ? `${selectedDay}일` : '일' }}</span>
        <IconChevronDown
          size="14"
          color="var(--color-slate-muted)"
          class="shrink-0"
        />
      </button>
    </div>

    <BottomSheet
      v-model="yearSheetOpen"
      title="출생 연도 선택"
    >
      <ul data-testid="birth-year-options">
        <li
          v-for="year in years"
          :key="year"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              String(year) === selectedYear
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectYear(year)"
          >
            <span>{{ year }}년</span>
            <IconCheck
              v-if="String(year) === selectedYear"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>

    <BottomSheet
      v-model="monthSheetOpen"
      title="출생 월 선택"
    >
      <ul data-testid="birth-month-options">
        <li
          v-for="month in months"
          :key="month"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              String(month) === selectedMonth
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectMonth(month)"
          >
            <span>{{ month }}월</span>
            <IconCheck
              v-if="String(month) === selectedMonth"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>

    <BottomSheet
      v-model="daySheetOpen"
      title="출생 일 선택"
    >
      <ul data-testid="birth-day-options">
        <li
          v-for="day in days"
          :key="day"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between py-(--space-3) text-(length:--font-base)"
            :class="
              String(day) === selectedDay
                ? 'text-(color:--color-gold) font-bold'
                : 'text-(color:--color-slate-dark)'
            "
            @click="selectDay(day)"
          >
            <span>{{ day }}일</span>
            <IconCheck
              v-if="String(day) === selectedDay"
              size="18"
              color="var(--color-gold)"
            />
          </button>
        </li>
      </ul>
    </BottomSheet>
  </fieldset>
</template>
