export default defineEventHandler((event) => {
  const email = getCookie(event, 'auth_email')
  if (!email) throw createError({ statusCode: 401, message: 'Not authenticated' })
  return { email }
})
