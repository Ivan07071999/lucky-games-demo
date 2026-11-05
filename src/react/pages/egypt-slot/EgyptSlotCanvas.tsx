import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EgyptSlotFlow } from '../../../games/egypt-slot/src/fsm/EgyptSlotFlow';

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-10 flex items-center justify-center bg-[#1b1621]"
    >
      <div
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-[5px] border-[#302a34] border-t-[#17151a] motion-reduce:animate-none"
      />
    </div>
  );
}

function GameError({
  message,
  retry,
  onRetry,
}: {
  message: string;
  retry: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#1b1621] px-6 text-center text-[#f4dfaf]"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-md border border-[#a9874a] px-6 py-2 text-[#f4dfaf] transition-colors hover:bg-[#a9874a]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4dfaf]"
      >
        {retry}
      </button>
    </div>
  );
}

export function EgyptSlotCanvas() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFatalError, setHasFatalError] = useState(false);
  const [restartCount, setRestartCount] = useState(0);
  const loading = t('game.loading');
  const loadError = t('game.loadError');
  const recoveringRound = t('game.recoveringRound');
  const recoverRoundError = t('game.recoverRoundError');
  const incompatibleServer = t('game.incompatibleServer');
  const retry = t('game.retry');
  const insufficientBalance = t('game.insufficientBalance');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let active = true;
    setHasFatalError(false);
    setIsLoading(true);
    const flow = new EgyptSlotFlow(
      canvas,
      {
        loading,
        loadError,
        recoveringRound,
        recoverRoundError,
        incompatibleServer,
        retry,
        insufficientBalance,
      },
      (loading) => {
        if (active) setIsLoading(loading);
      },
    );
    void flow.start().catch((error: unknown) => {
      if (!active) return;
      console.error('Failed to initialize Egypt slot', error);
      setIsLoading(false);
      setHasFatalError(true);
    });

    return () => {
      active = false;
      flow.stop();
    };
  }, [
    loading,
    loadError,
    recoveringRound,
    recoverRoundError,
    incompatibleServer,
    retry,
    insufficientBalance,
    restartCount,
  ]);

  const retryGame = (): void => {
    setHasFatalError(false);
    setIsLoading(true);
    setRestartCount((count) => count + 1);
  };

  return (
    <>
      <canvas
        key={restartCount}
        ref={canvasRef}
        role="img"
        aria-label={t('game.canvasLabel')}
        className="fixed inset-0 block h-dvh w-dvw bg-[#1b1621]"
      />
      {isLoading && !hasFatalError && <LoadingSpinner label={loading} />}
      {hasFatalError && <GameError message={loadError} retry={retry} onRetry={retryGame} />}
    </>
  );
}
