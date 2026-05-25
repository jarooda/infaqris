export const useTheme = () => {
  const isDark = useState('theme_dark', () => false)

  function apply(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark)
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    apply(isDark.value)
  }

  function init() {
    const saved = localStorage.getItem('theme')
    const dark =
      saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    isDark.value = dark
    apply(dark)
  }

  return { isDark, toggle, init }
}
