import type { SlotStore } from '../../../stores/SlotStore';

export type BetPanelState = {
  bet: number;
  level: number;
  totalBetCoins: number;
  canEditBet: boolean;
  isSpinning: boolean;
  canPressSpin: boolean;
  canPressMaxBet: boolean;
  autoPlayActive: boolean;
  autoPlayCompleted: number;
  autoPlayRemaining: number;
  canPressAutoPlay: boolean;
};

export function getBetPanelState(store: SlotStore): BetPanelState {
  const { panel, round, autoPlay } = store;
  const canPressSpin =
    (store.canSpin && (!round.isFreeSpin || !!round.errorMessage)) ||
    round.canQuickStop ||
    round.canSkipWin;
  const canStopAutoPlay = autoPlay.isBetLocked && autoPlay.state !== 'stopRequested';
  const canOpenAutoPlay =
    autoPlay.canConfigure &&
    round.ready &&
    round.stage === 'idle' &&
    !round.isFreeSpin &&
    !round.errorMessage;

  return {
    bet: panel.bet,
    level: panel.level,
    totalBetCoins: round.currentRound?.bet.totalCoins ?? panel.totalBetCoins,
    canEditBet: panel.canEditBet,
    isSpinning: round.isSpinning,
    canPressSpin,
    canPressMaxBet: store.canRequestMaxBet,
    autoPlayActive: autoPlay.isBetLocked,
    autoPlayCompleted: autoPlay.completed,
    autoPlayRemaining: autoPlay.remaining,
    canPressAutoPlay: canStopAutoPlay || canOpenAutoPlay,
  };
}
