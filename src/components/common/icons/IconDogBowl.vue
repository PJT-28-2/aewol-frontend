<script setup>
defineProps({ size: { type: [String, Number], default: 24 }, color: { type: String, default: 'currentColor' } })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <!-- 카테고리 아이콘 세트의 optical 크기를 맞추기 위해 최대 변을 17로 정규화(중앙정렬). -->
    <path
      :fill="color"
      transform="translate(-2.57 -2.39) scale(1.2143)"
      d="M5 10h14l-1.4 6.2a3 3 0 0 1-2.9 2.3H9.3a3 3 0 0 1-2.9-2.3L5 10Zm4.2-3.5a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0Zm8.2 0a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0ZM12 6.8c1.6 0 2.8.8 3.3 1.7H8.7c.5-.9 1.7-1.7 3.3-1.7Z"
    />
  </svg>
</template>
