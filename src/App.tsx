import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CatalogPage } from './pages/catalog/CatalogPage'
import { SiteHeader } from './shared/ui/SiteHeader'
import './i18n'

function App() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ru'
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('lucky-games-theme') === 'light' ? 'light' : 'dark',
  )

  useEffect(() => {
    localStorage.setItem('lucky-games-theme', theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f4f3ef' : '#0b0c12')
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <div
      data-theme={theme}
      style={{ colorScheme: theme }}
      className="theme-page relative min-h-screen overflow-clip selection:bg-violet-400/30 selection:text-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 size-[34rem] rounded-full bg-violet-700/10 blur-[120px]" />
        <div className="absolute -right-48 top-[34rem] size-[32rem] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="theme-grid absolute inset-0 bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      </div>

      <SiteHeader
        language={language}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      <CatalogPage />
    </div>
  )
}

export default App
