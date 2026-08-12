<script setup>
defineProps({ size: { type: [String, Number], default: 24 }, color: { type: String, default: 'currentColor' } })
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="color"
    aria-hidden="true"
  >
    <!-- 카테고리 아이콘 세트의 optical 크기를 맞추기 위해 최대 변을 17로 정규화(중앙정렬). -->
    <path
      fill-rule="evenodd"
      transform="translate(1.26 1.71) scale(0.8947)"
      d="M9 2h6v3H9V2Zm-1 5h8a3 3 0 0 1 3 3v11H5V10a3 3 0 0 1 3-3Zm1 6h6v2H9v-2Z"
    />
  </svg>
</template>
