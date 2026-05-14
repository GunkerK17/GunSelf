import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/body", label: "Body" },
  { href: "/workout", label: "Workout" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/activity", label: "Activity" },
  { href: "/sleep", label: "Sleep" },
  { href: "/mood", label: "Mood" },
  { href: "/goals", label: "Goals" },
  { href: "/skills", label: "Skills" },
  { href: "/finance", label: "Finance" },
  { href: "/ai-coach", label: "AI Coach" },
  { href: "/settings", label: "Settings" }
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-slate-200 bg-white p-5 md:block">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">GunSelf</h2>
        <p className="text-sm text-slate-500">Life OS Dashboard</p>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
