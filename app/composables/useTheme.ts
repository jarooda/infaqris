export const useTheme = () => {
  const isDark = useState('theme_dark', () => false)

  function apply(dark: boolean) {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    // JLDS flips its design tokens on [data-theme="dark"]; keep both in sync.
    root.setAttribute('data-theme', dark ? 'dark' : 'light')
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
