import Link from "next/link";

type AdminModuleCardProps = {
  title: string;
  description: string;
  href: string;
};

export function AdminModuleCard({ title, description, href }: AdminModuleCardProps) {
  return (
    <Link
      className="rounded-2xl border border-[#f0ddd8] bg-white p-5 shadow-[0_14px_34px_-26px_rgba(192,94,77,0.5)] transition hover:-translate-y-0.5 hover:border-[#f0b7a7] hover:shadow-[0_24px_44px_-24px_rgba(196,94,75,0.6)]"
      href={href}
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </Link>
  );
}
