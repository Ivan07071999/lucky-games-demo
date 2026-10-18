import { useTranslation } from 'react-i18next'
import { AppBackdrop } from './components/AppBackdrop'
import { useDocumentLanguage } from './hooks/useDocumentLanguage'
import { useTheme } from './hooks/useTheme'
import './i18n/i18n'
import { CatalogPage } from '../pages/catalog'
import { SiteHeader } from '../shared/ui/site-header'

function App() {
  const { i18n: activeI18n } = useTranslation()
  const language = activeI18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ru'
  const { theme, toggleTheme } = useTheme()
  useDocumentLanguage(language)

  return (
    <div
      data-theme={theme}
      style={{ colorScheme: theme }}
      className="theme-page relative min-h-screen overflow-clip selection:bg-violet-400/30 selection:text-white"
    >
      <AppBackdrop />

      <SiteHeader language={language} theme={theme} onThemeToggle={toggleTheme} />
      <CatalogPage />
    </div>
  )
}

export default App
