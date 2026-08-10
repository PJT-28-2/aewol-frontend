<script setup>
defineProps({
  size: { type: [String, Number], default: 24 },
  color: { type: String, default: 'currentColor' },
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      :fill="color"
      d="M9 7.1C7.8 5.8 5.8 5.6 4.7 6.8c-1 1.1-.6 2.8.6 3.6l1.9 1.3c1 .7 2.3 0 2.3-1.2V8.4c0-.5-.2-.9-.5-1.3ZM15 7.1c1.2-1.3 3.2-1.5 4.3-.3 1 1.1.6 2.8-.6 3.6l-1.9 1.3c-1 .7-2.3 0-2.3-1.2V8.4c0-.5.2-.9.5-1.3Z"
      opacity="0.88"
    />
    <path
      :fill="color"
      d="M7.7 7.6c-.6-.8-.2-1.9.8-2.2.2-1 1.4-1.5 2.3-1 .6-.9 1.8-.9 2.4 0 .9-.5 2.1 0 2.3 1 1 .3 1.4 1.4.8 2.2-2.8-.8-5.8-.8-8.6 0Z"
      opacity="0.22"
    />
    <path
      :stroke="color"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M7.3 8.3C8.3 6.5 9.8 5.6 12 5.6s3.7.9 4.7 2.7c.8 1.4 1 3.1.7 4.7-.6 3.3-2.7 5.4-5.4 5.4S7.2 16.3 6.6 13c-.3-1.6-.1-3.3.7-4.7Z"
    />
    <path
      :fill="color"
      d="M8.9 11.2c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1ZM13.1 11.2c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1Z"
    />
    <path
      :fill="color"
      opacity="0.12"
      d="M12 12.3c2 0 3.5 1.2 3.5 2.8S14 18 12 18s-3.5-1.3-3.5-2.9 1.5-2.8 3.5-2.8Z"
    />
    <path
      :fill="color"
      d="M12 13c.9 0 1.6.5 1.6 1.1 0 .7-.8 1.4-1.6 1.4s-1.6-.7-1.6-1.4c0-.6.7-1.1 1.6-1.1Z"
    />
    <path
      :stroke="color"
      stroke-width="1"
      stroke-linecap="round"
      d="M12 15.4c-.1.8-.7 1.2-1.5 1.2M12 15.4c.1.8.7 1.2 1.5 1.2"
    />
  </svg>
</template>
