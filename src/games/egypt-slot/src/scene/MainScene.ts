import { Container, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../assets';
import { BetPanel } from '../components/bet-panel';
import { BetSelectionModal } from '../components/ui/bet-selection-modal';
import { AutoPlayModal } from '../components/ui/auto-play-modal';
import { FreeSpinsStatus } from '../components/ui/free-spins-status';
import { ReelsMachine } from '../reelsMachine/ReelsMachine';
import type { ReelsCommand } from '../reelsMachine/commands';
import { GameContext, type GameMessages } from '../runtime/GameContext';
import {
  calculateGameLayout,
  getGameLayoutMode,
  type LayoutBounds,
  type LayoutPlacement,
} from './gameLayout';

export class MainScene extends Container {
  readonly context: GameContext;
  private background: Sprite | null = null;
  private reelsMachine: ReelsMachine | null = null;
  private betPanel: BetPanel | null = null;
  private betSelectionModal: BetSelectionModal | null = null;
  private autoPlayModal: AutoPlayModal | null = null;
  private freeSpinsStatus: FreeSpinsStatus | null = null;

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    super();
    this.context = new GameContext(canvas, messages);
  }

  initialize(): void {
    if (this.background) return;

    const background = new Sprite(Texture.from(EgyptImageAssetKey.scene.background));
    background.anchor.set(0.5);

    const reelsMachine = new ReelsMachine(this.context.slotStore.reels.reels);
    const betPanel = new BetPanel(
      reelsMachine.width,
      reelsMachine.height,
      this.context.slotStore,
      this.handleSpinButtonPress,
      this.openBetSelection,
      this.handleMaxBetButtonPress,
      this.handleAutoPlayButtonPress,
    );
    const betSelectionModal = new BetSelectionModal({
      onSelect: this.selectBet,
      onClose: this.closeBetSelection,
    });
    const autoPlayModal = new AutoPlayModal(this.context.slotStore, () =>
      this.context.autoPlayController.start(),
    );
    const freeSpinsStatus = new FreeSpinsStatus(this.context.slotStore.round);

    this.background = background;
    this.reelsMachine = reelsMachine;
    this.betPanel = betPanel;
    this.betSelectionModal = betSelectionModal;
    this.autoPlayModal = autoPlayModal;
    this.freeSpinsStatus = freeSpinsStatus;

    this.addChild(
      background,
      reelsMachine,
      betPanel,
      freeSpinsStatus,
      betSelectionModal,
      autoPlayModal,
    );
  }

  resize(width: number, height: number): void {
    if (!this.background) throw new Error('MainScene has not been initialized');
    if (width <= 0 || height <= 0) return;

    const texture = this.background.texture;
    const backgroundScale = Math.max(width / texture.width, height / texture.height);
    this.background.scale.set(backgroundScale);
    this.background.position.set(width / 2, height / 2);
    this.betSelectionModal?.resize(width, height);
    this.autoPlayModal?.resize(width, height);
    this.freeSpinsStatus?.resize(width, height);

    const panel = this.betPanel;
    const reelsMachine = this.reelsMachine;
    if (!panel || !reelsMachine) return;

    const mode = getGameLayoutMode(width, height);
    panel.setLayout(mode === 'wide' ? 'wide' : 'compact');
    const reelsBounds = reelsMachine.getLocalBounds();
    const panelBounds = panel.getLocalBounds();
    const layout = calculateGameLayout(width, height, reelsBounds, panelBounds, mode);

    this.place(reelsMachine, reelsBounds, layout.reels);
    this.place(panel, panelBounds, layout.panel);
  }

  executeReels(command: ReelsCommand, signal: AbortSignal): void | Promise<void> {
    if (!this.reelsMachine) throw new Error('ReelsMachine has not been initialized');
    return this.reelsMachine.execute(command, signal);
  }

  private place(container: Container, bounds: LayoutBounds, placement: LayoutPlacement): void {
    container.scale.set(placement.scale);
    container.position.set(
      placement.left + (container.pivot.x - bounds.x) * placement.scale,
      placement.top + (container.pivot.y - bounds.y) * placement.scale,
    );
  }

  private readonly openBetSelection = (): void => {
    const store = this.context.slotStore;
    if (!store.panel.canEditBet) return;

    this.betSelectionModal?.open(store.panel.availableBets, store.panel.bet);
  };

  private readonly handleSpinButtonPress = (): void => {
    const { slotStore, emitter } = this.context;
    const { round } = slotStore;

    if (round.canQuickStop) {
      emitter.emit('ui:quickStopRequested');
    } else if (round.canSkipWin) {
      emitter.emit('ui:skipWinRequested');
    } else if ((!round.isFreeSpin || round.errorMessage) && slotStore.requestSpin()) {
      emitter.emit('ui:spinRequested');
    }
  };

  private readonly handleMaxBetButtonPress = (): void => {
    const { slotStore, emitter } = this.context;
    const outcome = slotStore.requestMaxBetSpin();
    if (outcome === 'started') emitter.emit('ui:spinRequested');
    if (outcome === 'insufficientBalance') emitter.emit('ui:maxBetInsufficientBalance');
  };

  private readonly handleAutoPlayButtonPress = (): void => {
    const { slotStore, autoPlayController } = this.context;
    if (slotStore.autoPlay.isBetLocked) {
      autoPlayController.requestStop();
      return;
    }
    if (
      slotStore.round.ready &&
      slotStore.round.stage === 'idle' &&
      !slotStore.round.isFreeSpin &&
      !slotStore.round.errorMessage
    ) {
      this.autoPlayModal?.open();
    }
  };

  private readonly selectBet = (value: number): void => {
    this.context.slotStore.panel.setBet(value);
    this.closeBetSelection();
  };

  private readonly closeBetSelection = (): void => {
    this.betSelectionModal?.close();
  };
}
