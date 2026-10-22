import { useTranslation } from 'react-i18next';
import { ArrowIcon, StarIcon } from '../../../shared/ui/icons';

export function CatalogHero() {
  const { t } = useTranslation();

  return (
    <section className="theme-border theme-hero relative overflow-hidden rounded-[2rem] border shadow-[0_28px_90px_rgba(0,0,0,0.12)]">
      <div className="theme-hero-overlay absolute inset-0" />
      <div className="relative grid min-h-[330px] items-center gap-8 px-6 py-9 sm:px-10 md:min-h-[370px] md:grid-cols-[1.1fr_0.9fr] md:px-14 lg:px-16">
        <div className="max-w-xl">
          <div className="theme-accent mb-5 inline-flex items-center gap-2 rounded-full border border-[#c7f36b]/30 bg-[#c7f36b]/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em]">
            <StarIcon className="size-3" />
            {t('hero.collection')} <span className="theme-subtle">·</span> 02
          </div>
          <h1 className="text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-[3.65rem]">
            {t('hero.headlineFirst')}
            <br />
            <span className="theme-muted">{t('hero.headlineSecond')}</span>
          </h1>
          <p className="theme-muted mt-5 max-w-md text-sm leading-6 sm:text-base sm:leading-7">
            {t('hero.description')}
          </p>
          <a
            href="#games"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#c7f36b] px-5 py-3 text-sm font-bold text-[#11150a] transition hover:bg-[#d6ff80] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#849e42]"
          >
            {t('hero.browseGames')}
            <ArrowIcon />
          </a>
        </div>
        <div
          aria-hidden="true"
          className="relative mx-auto hidden h-64 w-full max-w-sm items-center justify-center md:flex"
        >
          <div className="absolute size-56 rounded-full border border-violet-400/20" />
          <div className="absolute size-44 rounded-full border border-violet-400/20" />
          <div className="absolute size-32 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="relative grid grid-cols-3 gap-2 rounded-[1.7rem] border border-white/15 bg-[#11121c]/80 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            {['7', '✦', '7', '✧', '7', '✧', '7', '✦', '7'].map((symbol, index) => (
              <span
                key={`${symbol}-${index}`}
                className={`flex size-[4.15rem] items-center justify-center rounded-2xl border border-white/[0.08] text-3xl font-black ${index === 4 ? 'bg-[#c7f36b] text-[#1b2110] shadow-[0_0_30px_rgba(199,243,107,0.24)]' : 'bg-white/[0.045] text-white/70'}`}
              >
                {symbol}
              </span>
            ))}
          </div>
          <span className="absolute right-8 top-7 text-xl text-[#c7f36b]">✦</span>
          <span className="absolute bottom-6 left-9 text-sm text-violet-200">✧</span>
        </div>
      </div>
    </section>
  );
}
