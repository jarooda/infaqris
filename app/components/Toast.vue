<template>
  <div
    class="fixed z-[9999] bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:top-6 pointer-events-none"
  >
    <Transition name="toast">
      <div
        v-if="toast"
        class="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white w-max max-w-[calc(100vw-2rem)] pointer-events-auto"
        :class="{
          'bg-green-600': toast.type === 'success',
          'bg-red-600': toast.type === 'error',
          'bg-gray-800 dark:bg-gray-700': toast.type === 'info',
        }"
      >
        <Icon
          :name="
            toast.type === 'success'
              ? 'material-symbols:check-circle'
              : toast.type === 'error'
                ? 'material-symbols:error'
                : 'material-symbols:info'
          "
          class="w-4 h-4 shrink-0"
        />
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { toast } = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

/* mobile: slide up from bottom */
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* desktop: slide down from top */
@media (min-width: 768px) {
  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(-8px);
  }
}
</style>
