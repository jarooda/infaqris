export const useAuth = () => {
  const user = useState<{ email: string } | null>('auth_user', () => null)
  // Non-httpOnly cookie set by the server on login; lets us skip /api/auth/me
  // entirely when unauthenticated, avoiding a noisy 401 in the console.
  const authHint = useCookie('auth_hint')

  async function fetchUser() {
    if (!authHint.value) return
    try {
      const data = await $fetch<{ email: string }>('/api/auth/me')
      user.value = data
    } catch {
      user.value = null
      authHint.value = null // stale hint — clear it
    }
  }

  async function login(credential: string) {
    const data = await $fetch<{ email: string }>('/api/auth/login', {
      method: 'POST',
      body: { credential },
    })
    user.value = { email: data.email }
    authHint.value = '1' // mirror server Set-Cookie for immediate reactivity
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    authHint.value = null
  }

  return { user, fetchUser, login, logout }
}
