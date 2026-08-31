export function Progress({
  current,
  total = 8,
  label = "Canvas",
}: {
  current: number;
  total?: number;
  label?: string;
}) {
  return (
    <div aria-label={`Step ${current} of ${total}`}>
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-cool-gray">
        <span>
          Step {current} of {total}
        </span>
        <span>{label}</span>
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            className={`h-1 ${index < current ? "bg-aicc-blue" : "bg-fog"}`}
          />
        ))}
      </div>
    </div>
  );
}
