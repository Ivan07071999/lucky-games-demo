import { CatalogBackdrop } from './layout/CatalogBackdrop';
import { CatalogFooter } from './layout/CatalogFooter';
import { CatalogHeader } from './layout/CatalogHeader';
import { GameCatalog } from './components/GameCatalog';

type CatalogPageProps = {
  language: 'ru' | 'en';
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
};

export function CatalogPage({ language, theme, onThemeToggle }: CatalogPageProps) {
  return (
    <div
      data-theme={theme}
      style={{ colorScheme: theme }}
      className="theme-page relative min-h-screen overflow-clip selection:bg-violet-400/30 selection:text-white"
    >
      <CatalogBackdrop />
      <CatalogHeader language={language} theme={theme} onThemeToggle={onThemeToggle} />
      <main
        id="top"
        className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pt-14"
      >
        <GameCatalog />
        <CatalogFooter />
      </main>
    </div>
  );
}
