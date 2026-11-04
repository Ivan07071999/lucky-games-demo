import { Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../assets';
import { AutoPlayModal } from '../components/popups/auto-play/auto-play-modal';
import { BetSelectionModal } from '../components/popups/bet-selection/bet-selection-modal';
import { GameInfoModal } from '../components/popups/game-info/game-info-modal';
import { GameSettingsModal } from '../components/popups/game-settings/game-settings-modal';
import { WinPopup } from '../components/popups/win-popup/WinPopup';
import { FreeSpinsTransition } from '../components/free-spins-transition/FreeSpinsTransition';
import { AudioToggle } from '../components/ui/actions/audio-toggle';
import { InfoButton } from '../components/ui/actions/info-button';
import { SettingsButton } from '../components/ui/actions/settings-button';
import { FreeSpinsStatus } from '../components/ui/status/free-spins-status';
import { BetPanel } from '../components/ui/panel/BetPanel';
import { ReelsMachine } from '../reelsMachine/ReelsMachine';
import type { GameContext } from '../runtime/GameContext';
import type { MainSceneActions } from './MainSceneActions';
import type { ViewportResizable } from './MainSceneLayout';

export type MainSceneComponents = {
  background: Sprite;
  reelsMachine: ReelsMachine;
  betPanel: BetPanel;
  betSelectionModal: BetSelectionModal;
  autoPlayModal: AutoPlayModal;
  infoModal: GameInfoModal;
  settingsModal: GameSettingsModal;
  freeSpinsStatus: FreeSpinsStatus;
  freeSpinsTransition: FreeSpinsTransition;
  winPopup: WinPopup;
  children: [
    Sprite,
    ReelsMachine,
    BetPanel,
    FreeSpinsStatus,
    BetSelectionModal,
    AutoPlayModal,
    GameInfoModal,
    GameSettingsModal,
    WinPopup,
    FreeSpinsTransition,
  ];
  resizable: readonly ViewportResizable[];
};

export function createMainSceneComponents(
  context: GameContext,
  actions: MainSceneActions,
): MainSceneComponents {
  const background = new Sprite(Texture.from(EgyptImageAssetKey.scene.background));
  background.anchor.set(0.5);

  const reelsMachine = new ReelsMachine(
    context.slotStore.reels.reels,
    (index) => context.emitter.emit('reel:stopped', index),
    (cue) => context.emitter.emit('reels:cue', cue),
  );
  const reelsBounds = reelsMachine.getLayoutBounds();

  const betSelectionModal = new BetSelectionModal({
    onSelect: (value) => {
      actions.selectBet(value);
      betSelectionModal.close();
    },
    onClose: () => betSelectionModal.close(),
  });
  const autoPlayModal = new AutoPlayModal(context.slotStore, () =>
    context.autoPlayController.start(),
  );
  const infoModal = new GameInfoModal(context.slotStore);
  const settingsModal = new GameSettingsModal(context.slotStore);
  const freeSpinsStatus = new FreeSpinsStatus(context.slotStore.session);
  const freeSpinsTransition = new FreeSpinsTransition();
  const winPopup = new WinPopup();

  const betPanel = new BetPanel({
    width: reelsBounds.width,
    height: reelsBounds.height,
    store: context.slotStore,
    onSpinRequested: actions.handleSpinButtonPress,
    onBetRequested: () => {
      const options = actions.getBetSelectionOptions();
      if (options) betSelectionModal.open(options.availableBets, options.selectedBet);
    },
    onBetChanged: () => context.emitter.emit('ui:betChanged'),
    onMaxBetRequested: actions.handleMaxBetButtonPress,
    onAutoPlayRequested: () => {
      if (actions.shouldOpenAutoPlay()) autoPlayModal.open();
    },
  });

  betPanel.attachUtilityButtons(
    new InfoButton(() => infoModal.open()),
    new SettingsButton(() => settingsModal.open()),
    new AudioToggle(context.audio),
  );

  const children: MainSceneComponents['children'] = [
    background,
    reelsMachine,
    betPanel,
    freeSpinsStatus,
    betSelectionModal,
    autoPlayModal,
    infoModal,
    settingsModal,
    winPopup,
    freeSpinsTransition,
  ];

  return {
    background,
    reelsMachine,
    betPanel,
    betSelectionModal,
    autoPlayModal,
    infoModal,
    settingsModal,
    freeSpinsStatus,
    freeSpinsTransition,
    winPopup,
    children,
    resizable: [
      betSelectionModal,
      autoPlayModal,
      freeSpinsStatus,
      infoModal,
      settingsModal,
      freeSpinsTransition,
      winPopup,
    ],
  };
}
