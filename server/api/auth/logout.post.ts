export default defineEventHandler((event) => {
  deleteCookie(event, 'auth_email', { path: '/' })
  deleteCookie(event, 'auth_hint', { path: '/' })
  return { success: true }
})
