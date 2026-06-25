import { toast as jldsToast, type ToastTone } from '~/components/ui/toast'

type ToastType = 'success' | 'error' | 'info'

const toneByType: Record<ToastType, ToastTone> = {
  success: 'success',
  error: 'danger',
  info: 'info',
}

export const useToast = () => {
  function show(message: string, type: ToastType = 'info') {
    jldsToast({ description: message, tone: toneByType[type], duration: 3000 })
  }

  return { show }
}
