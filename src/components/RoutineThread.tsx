interface Step {
  label: string;
  detail: string;
}

export default function RoutineThread({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <div className="relative">
      <h3 className="font-display text-2xl md:text-3xl text-[var(--deep-wine)] mb-8">{title}</h3>
      <div className="relative">
        <svg
          className="absolute left-4 top-4 bottom-4 w-4 h-[calc(100%-2rem)] hidden md:block"
          viewBox="0 0 16 400"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M8 0 C 2 60, 14 120, 8 180 S 2 300, 8 400"
            stroke="var(--dusty-rose)"
            strokeWidth="1.5"
            strokeDasharray="3 6"
            strokeLinecap="round"
          />
        </svg>
        <ol className="space-y-6 md:pl-10">
          {steps.map((step, i) => (
            <li key={step.label} className="relative flex gap-4 items-start">
              <span className="hidden md:flex absolute -left-10 top-1 w-6 h-6 rounded-full bg-[var(--warm-gold)] text-white text-xs items-center justify-center font-medium">
                {i + 1}
              </span>
              <div className="bg-[var(--milk-sage)] rounded-xl px-5 py-4 flex-1">
                <div className="font-medium text-[var(--deep-wine)]">{step.label}</div>
                <div className="text-sm text-[var(--muted)] mt-0.5">{step.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
