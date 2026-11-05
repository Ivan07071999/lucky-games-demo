import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowIcon } from '../../shared/ui/icons';
import { CatalogBackdrop } from '../catalog/layout/CatalogBackdrop';
import { CatalogFooter } from '../catalog/layout/CatalogFooter';
import { CatalogHeader } from '../catalog/layout/CatalogHeader';

type NotFoundPageProps = {
  language: 'ru' | 'en';
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
};

export function NotFoundPage({ language, theme, onThemeToggle }: NotFoundPageProps) {
  const { t } = useTranslation();

  return (
    <div
      data-theme={theme}
      style={{ colorScheme: theme }}
      className="theme-page relative min-h-screen overflow-clip selection:bg-violet-400/30 selection:text-white"
    >
      <CatalogBackdrop />
      <CatalogHeader language={language} theme={theme} onThemeToggle={onThemeToggle} />
      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-76px)] max-w-7xl items-center px-5 py-12 sm:px-8 lg:px-12">
        <section className="theme-border theme-surface relative isolate mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border px-6 py-10 text-center shadow-[0_28px_90px_rgba(0,0,0,0.12)] sm:px-12 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(199,243,107,0.09),transparent_55%)]"
          />
          <p className="theme-accent text-xs font-bold tracking-[0.2em]">{t('notFound.eyebrow')}</p>
          <p
            aria-hidden="true"
            className="theme-muted mt-5 text-8xl font-semibold tracking-[-0.08em] sm:text-9xl"
          >
            404
          </p>
          <h1 className="theme-primary mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            {t('notFound.title')}
          </h1>
          <p className="theme-muted mx-auto mt-3 max-w-lg text-sm leading-6 sm:text-base">
            {t('notFound.description')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#c7f36b] px-5 py-3 text-sm font-bold text-[#11150a] transition hover:bg-[#d6ff80] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#849e42]"
            >
              {t('notFound.backToCatalog')}
              <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>
      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-6 sm:px-8 lg:px-12">
        <CatalogFooter />
      </div>
    </div>
  );
}
