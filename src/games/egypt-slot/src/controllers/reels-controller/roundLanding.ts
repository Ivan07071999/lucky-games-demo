import type { CascadeSequence, RoundResult } from '@lucky-games/contracts';
import type { ReelsMatrix } from '../../reels/reelsConfig';
import { reelsCommands } from '../../reelsMachine/commands';
import type { RoundStore } from '../../stores/RoundStore';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';
import type { RoundPlayback } from './roundPlayback';

export async function landRoundResult(
  scene: MainSceneController,
  round: RoundStore,
  result: RoundResult,
  playback: RoundPlayback,
): Promise<void> {
  if (!result.cascade) {
    await landReels(scene, round, result.reels, result, playback);
    return;
  }

  if (playback.spinMode === 'HYBRID') {
    await landHybrid(scene, round, result, result.cascade, playback);
    return;
  }

  await playCascade(scene, round, result.cascade, result.reels, playback, false);
}

export async function restoreRoundReels(
  scene: MainSceneController,
  previousReels: ReelsMatrix,
  playback: RoundPlayback,
): Promise<void> {
  const receivedResult = playback.result;
  playback.result = null;

  if (receivedResult) {
    await scene.executeReels(reelsCommands.setReels(receivedResult.reels), playback.signal);
    return;
  }

  if (playback.spinMode === 'CASCADE') {
    await scene.executeReels(reelsCommands.setReels(previousReels), playback.signal);
    return;
  }

  try {
    await scene.executeReels(reelsCommands.landReels(previousReels), playback.signal);
  } catch {
    await scene.executeReels(reelsCommands.setReels(previousReels), playback.signal);
  }
}

async function landHybrid(
  scene: MainSceneController,
  round: RoundStore,
  result: RoundResult,
  sequence: CascadeSequence,
  playback: RoundPlayback,
): Promise<void> {
  await landReels(scene, round, sequence.initialReels, result, playback);
  if (sequence.steps.length === 0) return;

  playback.hybridCascadeActive = true;
  try {
    await playCascade(scene, round, sequence, result.reels, playback, true);
  } finally {
    playback.hybridCascadeActive = false;
  }
}

async function landReels(
  scene: MainSceneController,
  round: RoundStore,
  reels: ReelsMatrix,
  result: RoundResult,
  playback: RoundPlayback,
): Promise<void> {
  await scene.executeReels(
    reelsCommands.landReels(
      reels,
      playback.turbo || round.quickStopRequested,
      result.presentation?.anticipation ?? null,
    ),
    playback.signal,
  );
}

async function playCascade(
  scene: MainSceneController,
  round: RoundStore,
  sequence: CascadeSequence,
  finalReels: ReelsMatrix,
  playback: RoundPlayback,
  hybrid: boolean,
): Promise<void> {
  await scene.executeReels(
    reelsCommands.playCascade(sequence, finalReels, {
      turbo: playback.turbo,
      quickStop: round.quickStopRequested,
      hybrid,
    }),
    playback.signal,
  );
}
