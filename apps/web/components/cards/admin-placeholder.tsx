type AdminPlaceholderProps = {
  title: string;
  description: string;
  checkpoints: string[];
};

export function AdminPlaceholder({ title, description, checkpoints }: AdminPlaceholderProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#f0ddd8] bg-white p-6 shadow-[0_20px_42px_-34px_rgba(192,94,77,0.55)]">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      <div className="rounded-2xl border border-[#f3d5cb] bg-[#fff4f1] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#bb5847]">Admin Sprint Checklist</h2>
        <ul className="mt-3 space-y-2 text-sm text-[#7f3428]">
          {checkpoints.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
