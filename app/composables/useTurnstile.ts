let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if ((window as any).turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Failed to load Turnstile'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export function useTurnstile() {
  const siteKey = useRuntimeConfig().public.turnstileSiteKey as string

  /**
   * Mints a fresh, single-use Turnstile token with no visible widget — used to
   * back deferred writes (offline edits replayed on reconnect) so every server
   * write carries a fresh human proof.
   *
   * Resolves `undefined` when Turnstile isn't configured (dev / opt-out).
   * Rejects when a token can't be obtained (e.g. an interactive challenge is
   * required) — callers should treat that as "retry later", not a hard failure.
   */
  async function getToken(): Promise<string | undefined> {
    if (!import.meta.client || !siteKey) return undefined
    await loadTurnstileScript()
    const turnstile = (window as any).turnstile
    if (!turnstile) throw new Error('Turnstile unavailable')

    return new Promise<string>((resolve, reject) => {
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.pointerEvents = 'none'
      document.body.appendChild(container)

      let widgetId: string | undefined
      let settled = false

      const finish = (fn: () => void) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        try {
          if (widgetId) turnstile.remove(widgetId)
        } catch {
          /* widget may already be gone */
        }
        container.remove()
        fn()
      }

      const timer = setTimeout(() => finish(() => reject(new Error('Turnstile timed out'))), 20000)

      try {
        widgetId = turnstile.render(container, {
          sitekey: siteKey,
          // Stay invisible unless a challenge genuinely requires interaction.
          appearance: 'interaction-only',
          callback: (token: string) => finish(() => resolve(token)),
          'error-callback': () => finish(() => reject(new Error('Turnstile error'))),
          'timeout-callback': () => finish(() => reject(new Error('Turnstile timeout'))),
        })
      } catch (e) {
        finish(() => reject(e instanceof Error ? e : new Error('Turnstile render failed')))
      }
    })
  }

  return { getToken }
}
