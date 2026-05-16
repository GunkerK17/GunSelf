export const ADMIN_MODULES = [
  "overview",
  "users",
  "content",
  "exercises",
  "aiInsights",
  "reports",
  "announcements",
  "activity",
  "settings"
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULES)[number];

export type AdminModuleDef = {
  key: AdminModuleKey;
  href: string;
};

export const ADMIN_MODULE_DEFS: AdminModuleDef[] = [
  { key: "overview", href: "/admin" },
  { key: "users", href: "/admin/users" },
  { key: "content", href: "/admin/content" },
  { key: "exercises", href: "/admin/exercises" },
  { key: "aiInsights", href: "/admin/ai-insights" },
  { key: "reports", href: "/admin/reports" },
  { key: "announcements", href: "/admin/announcements" },
  { key: "activity", href: "/admin/activity" },
  { key: "settings", href: "/admin/settings" }
];

export function moduleForPath(pathname: string): AdminModuleKey {
  if (pathname === "/admin") {
    return "overview";
  }

  const match = ADMIN_MODULE_DEFS.find((item) => item.href !== "/admin" && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
  return match?.key ?? "overview";
}

export function hasModuleAccess(modules: string[] | null | undefined, module: AdminModuleKey): boolean {
  if (!modules || modules.length === 0) {
    return true;
  }

  return modules.includes("*") || modules.includes(module);
}

