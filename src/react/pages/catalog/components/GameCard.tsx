import { useTranslation } from 'react-i18next'
import { ArrowIcon } from '../../../shared/ui/icons'
import { GameArtwork } from './GameArtwork'
import type { Game } from '../model/games'

type GameCardProps = {
  game: Game
  isSelected: boolean
  onSelect: () => void
}

export function GameCard({ game, isSelected, onSelect }: GameCardProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`theme-border theme-surface group rounded-[1.65rem] border p-3 text-left transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#849e42] ${isSelected ? 'border-[#9ab847] bg-[#c7f36b]/[0.12] shadow-[0_0_36px_rgba(199,243,107,0.12)]' : 'hover:-translate-y-1 hover:border-[#9ab847]/50 hover:bg-[var(--surface-soft)]'}`}
    >
      <div className="relative">
        <GameArtwork palette={game.palette} label={t(`games.${game.translationKey}.artwork`)} />
        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] backdrop-blur-md ${isSelected ? 'bg-[#c7f36b] text-[#11150a]' : 'border border-white/15 bg-black/25 text-white/75'}`}
        >
          {isSelected
            ? t('catalog.selectedBadge')
            : t('catalog.gameNumber', { number: game.number })}
        </span>
        <span className="absolute bottom-4 right-4 flex size-10 translate-y-1 items-center justify-center rounded-full bg-white text-[#15151b] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <ArrowIcon />
        </span>
      </div>
      <div className="flex items-end justify-between gap-4 px-2 pb-2 pt-5">
        <div>
          <p className="theme-subtle text-[10px] font-bold tracking-[0.15em]">
            {t(`games.${game.translationKey}.category`)}
          </p>
          <h3 className="theme-primary mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
            {t(`games.${game.translationKey}.title`)}
          </h3>
          <p className="theme-muted mt-2 max-w-sm text-sm leading-5">
            {t(`games.${game.translationKey}.description`)}
          </p>
        </div>
        <span
          className={`mb-1 flex size-9 shrink-0 items-center justify-center rounded-full border transition ${isSelected ? 'border-[#c7f36b] bg-[#c7f36b] text-[#11150a]' : 'theme-border theme-muted group-hover:border-[#9ab847] group-hover:text-[#647d2b]'}`}
        >
          <ArrowIcon />
        </span>
      </div>
    </button>
  )
}
