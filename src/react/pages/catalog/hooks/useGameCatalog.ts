import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { games } from '../model/games'

export function useGameCatalog() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ru'
  const [search, setSearch] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  const filteredGames = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase(language)
    if (!searchTerm) return games

    return games.filter((game) => {
      const translations = t(`games.${game.translationKey}`, { returnObjects: true }) as Record<
        string,
        string
      >
      return Object.values(translations).join(' ').toLocaleLowerCase(language).includes(searchTerm)
    })
  }, [language, search, t])

  const selectedGame = games.find((game) => game.id === selectedGameId)
  const selectedGameTitle = selectedGame ? t(`games.${selectedGame.translationKey}.title`) : null

  function toggleGameSelection(gameId: string) {
    setSelectedGameId((currentGameId) => (currentGameId === gameId ? null : gameId))
  }

  return {
    filteredGames,
    search,
    selectedGameId,
    selectedGameTitle,
    setSearch,
    toggleGameSelection,
  }
}
