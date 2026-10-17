import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchIcon } from '../../shared/ui/Icons'
import { GameCard } from './GameCard'
import { games } from './games'

export function GameCatalog() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ru'
  const [search, setSearch] = useState('')
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  const filteredGames = useMemo(() => {
    const value = search.trim().toLocaleLowerCase(language)
    if (!value) return games
    return games.filter((game) => {
      const translatedGame = t(`games.${game.translationKey}`, { returnObjects: true }) as Record<
        string,
        string
      >
      return Object.values(translatedGame).join(' ').toLocaleLowerCase(language).includes(value)
    })
  }, [language, search, t])

  const selectedGameData = games.find((game) => game.id === selectedGame)
  const selectedGameTitle = selectedGameData
    ? t(`games.${selectedGameData.translationKey}.title`)
    : null

  return (
    <section id="games" className="scroll-mt-8 pt-12 sm:pt-16">
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
              {filteredGames.length.toString().padStart(2, '0')}
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
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {filteredGames.length > 0 ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:gap-6">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isSelected={selectedGame === game.id}
              onSelect={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
            />
          ))}
        </div>
      ) : (
        <div className="theme-border theme-soft mt-6 rounded-3xl border px-6 py-14 text-center">
          <p className="text-lg font-medium">{t('catalog.notFoundTitle')}</p>
          <p className="theme-muted mt-2 text-sm">{t('catalog.notFoundDescription')}</p>
        </div>
      )}
    </section>
  )
}
