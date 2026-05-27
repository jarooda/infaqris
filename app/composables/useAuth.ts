export const useAuth = () => {
  const user = useState<{ email: string; isAdmin: boolean } | null>('auth_user', () => null)
  // Non-httpOnly cookie set by the server on login; lets us skip /api/auth/me
  // entirely when unauthenticated, avoiding a noisy 401 in the console.
  const authHint = useCookie('auth_hint')

  async function fetchUser() {
    if (!authHint.value) return
    try {
      const data = await $fetch<{ email: string; isAdmin: boolean }>('/api/auth/me')
      user.value = data
    } catch {
      user.value = null
      authHint.value = null // stale hint — clear it
    }
  }

  async function login(credential: string) {
    const data = await $fetch<{ email: string; isAdmin: boolean }>('/api/auth/login', {
      method: 'POST',
      body: { credential },
    })
    user.value = { email: data.email, isAdmin: data.isAdmin }
    authHint.value = '1' // mirror server Set-Cookie for immediate reactivity
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    authHint.value = null
  }

  const isAdmin = computed(() => user.value?.isAdmin === true)

  return { user, isAdmin, fetchUser, login, logout }
}
