<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  opsional: { type: Boolean, default: false },
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-label-md text-ink">
      {{ label }}
      <span v-if="opsional" class="font-normal text-subtle">(opsional)</span>
    </label>
    <slot />
    <p v-if="error" :id="`${id}-error`" class="text-body-sm text-danger-ink" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-body-sm text-muted">{{ hint }}</p>
  </div>
</template>
