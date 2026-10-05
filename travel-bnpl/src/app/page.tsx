import ko from "../../messages/ko.json";

const steps = [
  ko.home.steps.browse,
  ko.home.steps.join,
  ko.home.steps.deposit,
  ko.home.steps.installments,
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-10 px-4 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{ko.app.name}</p>
        <h1 className="text-3xl font-bold leading-tight text-balance">{ko.home.title}</h1>
        <p className="text-base text-zinc-600 dark:text-zinc-300">{ko.app.tagline}</p>
      </header>

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
              {i + 1}
            </span>
            <span className="text-base">{step}</span>
          </li>
        ))}
      </ol>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">{ko.home.comingSoon}</p>
    </main>
  );
}
