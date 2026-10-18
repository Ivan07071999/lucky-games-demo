export function AppBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-48 -top-48 size-[34rem] rounded-full bg-violet-700/10 blur-[120px]" />
      <div className="absolute -right-48 top-[34rem] size-[32rem] rounded-full bg-amber-500/5 blur-[120px]" />
      <div className="theme-grid absolute inset-0 bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
    </div>
  )
}
