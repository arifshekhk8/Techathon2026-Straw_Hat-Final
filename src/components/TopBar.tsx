export default function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
      <div className="flex items-baseline gap-3">
        <h1 className="text-sm font-bold tracking-wide text-slate-100">
          DRY RUN <span className="font-normal text-slate-400">· stylus_arm control suite</span>
        </h1>
        <span className="hidden text-xs text-slate-500 sm:inline">
          one motion pipeline · dashboard / joystick / keyboard / voice / autonomous
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        simulation live
        <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 font-mono text-slate-300">
          Team Straw Hat
        </span>
      </div>
    </header>
  );
}
