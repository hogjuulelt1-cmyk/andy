export function MatchBadge({ score, label }: { score: number; label: string }) {
  const tone =
    score >= 80
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : score >= 60
        ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums " + tone}>
      {label}
    </span>
  );
}
