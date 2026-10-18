import { useTranslation } from 'react-i18next'
import { ThemeIcon } from '../icons'

type HeaderActionsProps = {
  language: 'ru' | 'en'
  theme: 'light' | 'dark'
  onThemeToggle: () => void
}

const controlClassName =
  'theme-border theme-control flex cursor-pointer items-center justify-center rounded-full border transition duration-200 hover:-translate-y-0.5 hover:border-[#c7f36b]/70 hover:bg-[#c7f36b]/10 hover:text-[var(--text-primary)] active:translate-y-0 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9ab847] motion-reduce:transition-none'

export function HeaderActions({ language, theme, onThemeToggle }: HeaderActionsProps) {
  const { t, i18n } = useTranslation()
  const themeAction = t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')
  const languageAction = t(language === 'ru' ? 'nav.switchToEnglish' : 'nav.switchToRussian')

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onThemeToggle}
        className={`${controlClassName} group size-10`}
        aria-label={themeAction}
        title={themeAction}
      >
        <span className="transition-transform duration-200 group-hover:rotate-12 motion-reduce:transition-none">
          <ThemeIcon theme={theme} />
        </span>
      </button>
      <button
        type="button"
        onClick={() => void i18n.changeLanguage(language === 'ru' ? 'en' : 'ru')}
        className={`${controlClassName} h-10 min-w-12 px-3 text-xs font-bold tracking-wide`}
        aria-label={languageAction}
        title={languageAction}
      >
        {language.toUpperCase()}
      </button>
    </div>
  )
}
