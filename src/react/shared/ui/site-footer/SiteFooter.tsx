import { useTranslation } from 'react-i18next';

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer
      id="about"
      className="theme-border theme-subtle mt-14 flex flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between"
    >
      <p>© 2026 Lucky Games</p>
      <p>{t('footer.tagline')}</p>
    </footer>
  );
}
