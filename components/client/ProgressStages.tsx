const STAGES = [
  { key: "BRIEF", label: "Brief" },
  { key: "CONCEPTS", label: "Concepts" },
  { key: "REFINEMENT", label: "Refinement" },
  { key: "FINALS", label: "Finals" },
  { key: "DELIVERY", label: "Delivery" },
];

export default function ProgressStages({ stage }: { stage: string }) {
  const currentIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">Project Progress</p>
      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isUpcoming = i > currentIndex;

          return (
            <div key={s.key} className="flex items-center flex-1 min-w-0">
              <div className="flex-1 text-center">
                <div
                  className={`w-full py-1.5 px-1 rounded-lg text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-white text-neutral-900"
                      : isCompleted
                      ? "bg-neutral-700 text-neutral-300"
                      : "bg-neutral-800 text-neutral-600"
                  }`}
                >
                  {s.label}
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-4 h-px shrink-0 mx-0.5 ${i < currentIndex ? "bg-neutral-600" : "bg-neutral-800"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
