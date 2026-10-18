import { useTranslation } from 'react-i18next'

export function EmptyCatalogState() {
  const { t } = useTranslation()

  return (
    <div className="theme-border theme-soft mt-6 rounded-3xl border px-6 py-14 text-center">
      <p className="text-lg font-medium">{t('catalog.notFoundTitle')}</p>
      <p className="theme-muted mt-2 text-sm">{t('catalog.notFoundDescription')}</p>
    </div>
  )
}
