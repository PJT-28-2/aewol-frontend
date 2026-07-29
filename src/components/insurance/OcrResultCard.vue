<script setup>
import { ref } from 'vue'

const props = defineProps({
  fileName: {
    type: String,
    default: '진료 영수증.jpg',
  },
  items: {
    type: Array,
    required: true,
  },
})

const editingKey = ref(null)

const startEdit = (key) => { editingKey.value = key }
const finishEdit = () => { editingKey.value = null }
</script>

<template>
  <section class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) mb-(--space-5) [box-shadow:var(--shadow-md)]">
    <!-- 파일 정보 -->
    <div class="mb-(--space-4)">
      <p class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
        {{ props.fileName }}
      </p>
      <p class="text-(length:--font-sm) text-(color:--color-gray-500) mb-(--space-2)">
        OCR 인식 완료 · Gemini Vision
      </p>
      <span class="inline-block text-(length:--font-xs) font-semibold px-(--space-3) py-[3px] rounded-(--radius-full) bg-(--color-olive-surface) text-(color:--color-olive-dark)">
        인식 완료
      </span>
    </div>

    <div class="h-px bg-(--color-border) mb-(--space-4)" />

    <!-- 추출 항목 헤더 -->
    <div class="flex justify-between items-center mb-(--space-3)">
      <span class="text-(length:--font-sm) font-semibold text-(color:--color-gray-700)">추출된 항목</span>
      <span class="text-(length:--font-sm) text-(color:--color-gray-500)">탭해서 수정</span>
    </div>

    <!-- 항목 리스트 -->
    <ul>
      <li
        v-for="item in props.items"
        :key="item.key"
        class="flex items-center justify-between py-(--space-3) border-b border-(--color-border) last:border-0 gap-(--space-3) cursor-pointer"
        @click="startEdit(item.key)"
      >
        <span class="text-(length:--font-md) text-(color:--color-gray-600) shrink-0">{{ item.label }}</span>
        <input
          v-if="editingKey === item.key"
          v-model="item.value"
          class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right border-b border-(--color-navy) outline-none bg-transparent w-full"
          autofocus
          @blur="finishEdit"
          @keyup.enter="finishEdit"
        />
        <span v-else class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right">
          {{ item.value }}
        </span>
      </li>
    </ul>
  </section>
</template>
