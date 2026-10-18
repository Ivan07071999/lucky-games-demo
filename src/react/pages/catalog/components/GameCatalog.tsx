import { CatalogToolbar } from './CatalogToolbar'
import { EmptyCatalogState } from './EmptyCatalogState'
import { GameCard } from './GameCard'
import { useGameCatalog } from '../hooks/useGameCatalog'

export function GameCatalog() {
  const {
    filteredGames,
    search,
    selectedGameId,
    selectedGameTitle,
    setSearch,
    toggleGameSelection,
  } = useGameCatalog()

  return (
    <section id="games" className="scroll-mt-8 pt-12 sm:pt-16">
      <CatalogToolbar
        gameCount={filteredGames.length}
        selectedGameTitle={selectedGameTitle}
        search={search}
        onSearchChange={setSearch}
      />

      {filteredGames.length > 0 ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:gap-6">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isSelected={selectedGameId === game.id}
              onSelect={() => toggleGameSelection(game.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyCatalogState />
      )}
    </section>
  )
}
