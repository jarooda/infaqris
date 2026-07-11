export default defineNuxtRouteMiddleware(async () => {
  const { user } = useAuth()

  // Always confirm admin status server-side (reads the httpOnly auth cookie) on
  // every navigation, so a forged client-side isAdmin can never render the shell.
  try {
    // $fetch doesn't forward cookies during SSR — useRequestFetch does.
    const fetch = import.meta.server ? useRequestFetch() : $fetch
    const data = await fetch<{ email: string; isAdmin: boolean }>('/api/auth/me')
    user.value = { email: data.email, isAdmin: data.isAdmin }
    if (!data.isAdmin) return navigateTo('/')
  } catch {
    return navigateTo('/')
  }
})
