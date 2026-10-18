import { SiteFooter } from '../../shared/ui/site-footer'
import { CatalogHero } from './components/CatalogHero'
import { GameCatalog } from './components/GameCatalog'

export function CatalogPage() {
  return (
    <main
      id="top"
      className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pt-14"
    >
      <CatalogHero />
      <GameCatalog />
      <SiteFooter />
    </main>
  )
}
