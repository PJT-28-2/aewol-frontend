<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
  filled: { type: Boolean, default: false },
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M12 21s-7.4-4.35-9.45-8.55C.65 8.55 2.68 4 6.7 4c2.12 0 3.94 1.18 5.3 2.83C13.36 5.18 15.18 4 17.3 4c4.02 0 6.05 4.55 4.15 8.45C19.4 16.65 12 21 12 21Z"
      :fill="filled ? color : 'none'"
      :stroke="filled ? 'none' : color"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <g :fill="filled ? 'var(--color-white)' : color">
      <ellipse
        cx="12"
        cy="14.25"
        rx="2.65"
        ry="2.05"
      />
      <ellipse
        cx="8.85"
        cy="11.45"
        rx="1.05"
        ry="1.35"
      />
      <ellipse
        cx="11.05"
        cy="9.6"
        rx="1.05"
        ry="1.35"
      />
      <ellipse
        cx="13.65"
        cy="9.6"
        rx="1.05"
        ry="1.35"
      />
      <ellipse
        cx="15.85"
        cy="11.45"
        rx="1.05"
        ry="1.35"
      />
    </g>
  </svg>
</template>
