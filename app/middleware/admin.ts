export default defineNuxtRouteMiddleware(async () => {
  const { user, isAdmin } = useAuth()

  if (import.meta.server && !user.value) {
    // $fetch doesn't forward cookies in SSR — useRequestFetch does
    try {
      const fetch = useRequestFetch()
      const data = await fetch<{ email: string; isAdmin: boolean }>('/api/auth/me')
      user.value = { email: data.email, isAdmin: data.isAdmin }
    } catch {
      return navigateTo('/')
    }
  }

  if (!user.value || !isAdmin.value) return navigateTo('/')
})
