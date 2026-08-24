<script setup>
import { ref, nextTick } from 'vue'

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
const inputRef = ref(null)

const startEdit = async (key) => {
  editingKey.value = key
  await nextTick()
  inputRef.value?.focus()
}
const finishEdit = () => {
  const item = props.items.find(i => i.key === editingKey.value)
  if (item?.unit && item.value && !item.value.endsWith(item.unit)) {
    item.value = item.value + item.unit
  }
  editingKey.value = null
}
</script>

<template>
  <section class="mb-(--space-5) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-5) shadow-(--shadow-card)">
    <!-- 파일 정보 -->
    <div class="mb-(--space-4)">
      <p class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
        {{ props.fileName }}
      </p>
      <p class="text-(length:--font-sm) text-(color:--color-gray-500) mb-(--space-2)">
        영수증 정보 인식 완료
      </p>
      <span class="inline-block rounded-(--radius-full) bg-(--color-leaf-soft) px-(--space-3) py-[3px] text-(length:--font-xs) font-semibold text-(color:--color-leaf-dark)">
        인식 완료
      </span>
    </div>

    <!-- 추출 항목 헤더 -->
    <div class="flex justify-between items-center mb-(--space-3)">
      <span class="text-(length:--font-sm) font-semibold text-(color:--color-gray-600)">추출된 항목</span>
      <span class="text-(length:--font-sm) text-(color:--color-gray-500)">탭해서 수정</span>
    </div>

    <!-- 항목 리스트 -->
    <ul>
      <li
        v-for="item in props.items"
        :key="item.key"
        class="flex items-center justify-between py-(--space-3) gap-(--space-3) cursor-pointer"
        tabindex="0"
        role="button"
        :aria-label="`${item.label} 수정`"
        @click="startEdit(item.key)"
        @keyup.enter="startEdit(item.key)"
        @keyup.space.prevent="startEdit(item.key)"
      >
        <span class="text-(length:--font-md) text-(color:--color-gray-600) shrink-0">{{ item.label }}</span>
        <input
          v-if="editingKey === item.key"
          ref="inputRef"
          v-model="item.value"
          class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right outline-none border-none bg-transparent w-full"
          @blur="finishEdit"
          @keyup.enter="finishEdit"
        >
        <span
          v-else
          class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right"
        >
          {{ item.value }}
        </span>
      </li>
    </ul>
  </section>
</template>
