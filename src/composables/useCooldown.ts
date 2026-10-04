import { onBeforeUnmount, ref } from 'vue'
export function useCooldown() {
  const remaining = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined
  function start(seconds: number) {
    clearInterval(timer)
    const until = Date.now() + seconds * 1000
    remaining.value = seconds
    if (seconds <= 0) return
    timer = setInterval(() => {
      remaining.value = Math.max(0, Math.ceil((until - Date.now()) / 1000))
      if (!remaining.value) clearInterval(timer)
    }, 1000)
  }
  onBeforeUnmount(() => clearInterval(timer))
  return { remaining, start }
}
