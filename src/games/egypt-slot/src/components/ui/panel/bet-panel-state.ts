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
  const { bet, session, round, autoPlay } = store;
  const canPressSpin =
    (store.canSpin && (!session.isFreeSpin || !!round.errorMessage)) ||
    round.canQuickStop ||
    round.canSkipWin;
  const canStopAutoPlay = autoPlay.isBetLocked && autoPlay.state !== 'stopRequested';
  const canOpenAutoPlay =
    autoPlay.canConfigure &&
    session.ready &&
    round.stage === 'idle' &&
    !session.isFreeSpin &&
    !round.errorMessage;

  return {
    bet: bet.bet,
    level: bet.level,
    totalBetCoins: round.currentRound?.bet.totalCoins ?? bet.totalBetCoins,
    canEditBet: bet.canEditBet,
    isSpinning: round.isSpinning,
    canPressSpin,
    canPressMaxBet: store.canRequestMaxBet,
    autoPlayActive: autoPlay.isBetLocked,
    autoPlayCompleted: autoPlay.completed,
    autoPlayRemaining: autoPlay.remaining,
    canPressAutoPlay: canStopAutoPlay || canOpenAutoPlay,
  };
}
