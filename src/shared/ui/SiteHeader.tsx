import { useTranslation } from 'react-i18next'
import { StarIcon, ThemeIcon } from './Icons'

type SiteHeaderProps = {
  language: 'ru' | 'en'
  theme: 'light' | 'dark'
  onThemeToggle: () => void
}

const controlClassName =
  'theme-border theme-control flex cursor-pointer items-center justify-center rounded-full border transition duration-200 hover:-translate-y-0.5 hover:border-[#c7f36b]/70 hover:bg-[#c7f36b]/10 hover:text-[var(--text-primary)] active:translate-y-0 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9ab847] motion-reduce:transition-none'

export function SiteHeader({ language, theme, onThemeToggle }: SiteHeaderProps) {
  const { t, i18n } = useTranslation()
  const themeAction = t(theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')
  const languageAction = t(language === 'ru' ? 'nav.switchToEnglish' : 'nav.switchToRussian')

  return (
    <header className="theme-border theme-hero sticky top-0 z-50 border-b shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <a href="#top" className="flex items-center gap-3" aria-label="Lucky Games">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#c7f36b] text-[#11150a] shadow-[0_0_28px_rgba(199,243,107,0.2)]">
            <StarIcon />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black tracking-[0.18em]">LUCKY</span>
            <span className="theme-subtle block text-[10px] font-bold tracking-[0.28em]">
              GAMES
            </span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a className="theme-primary transition hover:text-[#849e42]" href="#games">
            {t('nav.games')}
          </a>
          <a className="theme-muted transition hover:text-[#849e42]" href="#about">
            {t('nav.about')}
          </a>
        </nav>
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
      </div>
    </header>
  )
}
