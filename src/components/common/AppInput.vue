<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

function onInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="app-input" :class="{ 'app-input--error': error }">
    <label v-if="label" class="app-input__label">
      {{ label }}
      <span v-if="required" class="app-input__required">*</span>
    </label>

    <input
      class="app-input__field"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      @input="onInput"
    />

    <p v-if="error" class="app-input__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
}

.app-input__label {
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
}

.app-input__required {
  color: var(--color-danger);
  margin-left: 2px;
}

.app-input__field {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-3);
  font-size: var(--font-md);
  color: var(--color-gray-900);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.app-input__field::placeholder {
  color: var(--color-gray-400);
}

.app-input__field:focus {
  border-color: var(--color-navy);
  box-shadow: 0 0 0 3px rgba(27, 42, 73, 0.1);
}

.app-input--error .app-input__field {
  border-color: var(--color-danger);
}

.app-input--error .app-input__field:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.app-input__error {
  font-size: var(--font-xs);
  color: var(--color-danger);
}
</style>
