import { ref } from 'vue'

export function useLoading() {
  const isLoading = ref(false)

  function startLoading() {
    isLoading.value = true
  }

  function stopLoading() {
    isLoading.value = false
  }

  async function withLoading(asyncFn) {
    startLoading()
    try {
      return await asyncFn()
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  }
}
