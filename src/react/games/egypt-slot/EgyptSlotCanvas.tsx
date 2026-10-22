import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EgyptSlotFlow } from '../../../games/egypt-slot/src/phases-flow/EgyptSlotFlow';

export function EgyptSlotCanvas() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loading = t('game.loading');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const flow = new EgyptSlotFlow(canvas, { loading });
    void flow.start().catch((error: unknown) => {
      console.error('Failed to initialize Egypt slot', error);
    });

    return () => flow.stop();
  }, [loading]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={t('game.canvasLabel')}
      className="fixed inset-0 block h-dvh w-dvw bg-[#1b1621]"
    />
  );
}
