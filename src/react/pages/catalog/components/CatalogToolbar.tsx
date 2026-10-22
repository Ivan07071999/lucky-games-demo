import { useTranslation } from 'react-i18next';
import { SearchIcon } from '../../../shared/ui/icons';

type CatalogToolbarProps = {
  gameCount: number;
  selectedGameTitle: string | null;
  search: string;
  onSearchChange: (search: string) => void;
};

export function CatalogToolbar({
  gameCount,
  selectedGameTitle,
  search,
  onSearchChange,
}: CatalogToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="theme-accent text-[10px] font-bold tracking-[0.2em]">
          {t('catalog.eyebrow')}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            {t('catalog.title')}
          </h2>
          <span className="theme-border theme-muted rounded-full border px-2.5 py-1 text-xs font-semibold">
            {gameCount.toString().padStart(2, '0')}
          </span>
        </div>
        <p className="theme-muted mt-2 text-sm" aria-live="polite">
          {selectedGameTitle
            ? t('catalog.selected', { title: selectedGameTitle })
            : t('catalog.selectHint')}
        </p>
      </div>

      <label className="theme-border theme-control flex h-12 w-full items-center gap-3 rounded-full border px-4 transition focus-within:border-[#849e42] sm:max-w-xs">
        <SearchIcon />
        <span className="sr-only">{t('catalog.searchLabel')}</span>
        <input
          className="theme-primary theme-placeholder min-w-0 flex-1 bg-transparent text-sm outline-none"
          type="search"
          placeholder={t('catalog.searchPlaceholder')}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
    </div>
  );
}
