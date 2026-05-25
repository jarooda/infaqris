interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

let timer: ReturnType<typeof setTimeout> | null = null

export const useToast = () => {
  const toast = useState<ToastState | null>('toast', () => null)

  function show(message: string, type: ToastState['type'] = 'info') {
    if (timer) clearTimeout(timer)
    toast.value = { message, type }
    timer = setTimeout(() => {
      toast.value = null
    }, 3000)
  }

  return { toast, show }
}
