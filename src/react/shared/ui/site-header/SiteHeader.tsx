import { useTranslation } from 'react-i18next';
import { StarIcon } from '../icons';
import { HeaderActions } from './HeaderActions';

type SiteHeaderProps = {
  language: 'ru' | 'en';
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
};

export function SiteHeader({ language, theme, onThemeToggle }: SiteHeaderProps) {
  const { t } = useTranslation();

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
        <HeaderActions language={language} theme={theme} onThemeToggle={onThemeToggle} />
      </div>
    </header>
  );
}
