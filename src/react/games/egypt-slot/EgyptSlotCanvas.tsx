import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EgyptSlotFlow } from '../../../games/egypt-slot/src/phases-flow/EgyptSlotFlow';

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

export function EgyptSlotCanvas() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      console.error('Failed to initialize Egypt slot', error);
      if (active) setIsLoading(false);
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
  ]);

  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={t('game.canvasLabel')}
        className="fixed inset-0 block h-dvh w-dvw bg-[#1b1621]"
      />
      {isLoading && <LoadingSpinner label={loading} />}
    </>
  );
}
