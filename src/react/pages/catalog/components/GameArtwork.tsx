import type { Game } from '../model/games';

type GameArtworkProps = {
  palette: Game['palette'];
  label: string;
};

export function GameArtwork({ palette, label }: GameArtworkProps) {
  const violet = palette === 'violet';

  return (
    <div
      className={`relative isolate flex h-56 items-center justify-center overflow-hidden rounded-[1.35rem] sm:h-64 ${violet ? 'bg-[radial-gradient(ellipse_at_50%_42%,#8055dc_0%,#39276f_29%,#1c1b38_62%,#151722_100%)]' : 'bg-[radial-gradient(ellipse_at_50%_38%,#df9a47_0%,#805229_29%,#35251e_62%,#17171a_100%)]'}`}
    >
      {violet ? (
        <>
          <div className="absolute -left-12 top-1/2 size-48 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute -right-14 top-1/2 size-56 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rotate-[-24deg] rounded-[42%] border border-fuchsia-200/35 shadow-[0_0_60px_rgba(160,110,255,0.2)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-x-10 bottom-0 h-28 border-x border-t border-amber-100/20 bg-gradient-to-t from-amber-950/50 to-amber-100/5 [clip-path:polygon(50%_0,100%_42%,100%_100%,0_100%,0_42%)]" />
          <div className="absolute inset-x-16 bottom-0 h-20 border-x border-t border-amber-100/20 bg-amber-200/5 [clip-path:polygon(50%_0,100%_42%,100%_100%,0_100%,0_42%)]" />
          <div className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/20" />
        </>
      )}
      <div
        className={`relative z-10 flex size-32 items-center justify-center rounded-[2rem] border sm:size-36 ${violet ? 'rotate-[-8deg] border-white/40 bg-gradient-to-br from-violet-200 via-fuchsia-400 to-indigo-700 shadow-[0_20px_70px_rgba(145,92,255,0.5)]' : 'rotate-[8deg] border-amber-100/70 bg-gradient-to-br from-amber-100 via-amber-400 to-orange-700 shadow-[0_20px_70px_rgba(255,175,64,0.38)]'}`}
      >
        <span className="text-7xl font-black tracking-[-0.12em] text-white drop-shadow-[0_4px_12px_rgba(55,25,110,0.6)]">
          {violet ? '✦' : '7'}
        </span>
      </div>
      <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white/80">
        {label}
      </span>
      <span className="absolute right-[25%] top-[22%] text-lg text-white/75">✧</span>
    </div>
  );
}
