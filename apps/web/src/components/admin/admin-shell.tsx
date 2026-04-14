"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { can } from "@/lib/permissions";

export type AdminNavItem = {
  href: string;
  label: string;
  show: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

function navActive(pathname: string | null, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === href || pathname === "/admin";
  }
  return pathname === href || pathname?.startsWith(href + "/");
}

export function AdminSidebar({
  groups,
  onNavigate,
}: {
  groups: AdminNavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-zinc-800 bg-zinc-950/95 lg:fixed lg:inset-y-0 lg:z-40 lg:w-60 lg:border-b-0 lg:border-r lg:pt-18">
      <div className="flex h-14 items-center  border-zinc-800 px-4 lg:h-16 lg:border-zinc-800/80">
        <Link
          href="/admin/dashboard"
          className="text-base font-semibold tracking-tight text-white"
          onClick={onNavigate}
        >
          Admin<span className="text-violet-400">Console</span>
        </Link>
      </div>
      <nav className="flex max-h-[50vh] flex-1 flex-row gap-4 overflow-x-auto overflow-y-auto px-2 py-2 lg:max-h-none lg:flex-col lg:gap-6 lg:overflow-visible lg:px-3 lg:py-4">
        {groups.map((g) => {
          const items = g.items.filter((x) => x.show);
          if (!items.length) return null;
          return (
            <div key={g.label} className="min-w-[140px] lg:min-w-0">
              <p className="mb-2 hidden px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 lg:block">
                {g.label}
              </p>
              <div className="flex flex-row gap-1 lg:flex-col">
                {items.map((item) => {
                  const active = navActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={
                        active
                          ? "whitespace-nowrap rounded-lg bg-violet-600/20 px-3 py-2 text-sm font-medium text-violet-200"
                          : "whitespace-nowrap rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/80 hover:text-white"
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function buildAdminNav(
  permissions: string[] | undefined,
  staffRoleName: string
): AdminNavGroup[] {
  const p = permissions ?? [];
  const staff =
    staffRoleName === "SUPER_ADMIN" ||
    staffRoleName === "ADMIN" ||
    staffRoleName === "OPERATOR";

  const v = (slug: string) => can(p, slug) || staff;

  return [
    {
      label: "Overview",
      items: [
        { href: "/admin/dashboard", label: "Dashboard", show: v("dashboard.view") },
        { href: "/admin/reports", label: "Reports", show: v("dashboard.view") },
        { href: "/admin/settings", label: "Settings", show: v("dashboard.view") },
      ],
    },
    {
      label: "People & access",
      items: [
        { href: "/admin/users", label: "Users", show: v("users.view") },
        { href: "/admin/roles", label: "Roles", show: v("roles.view") },
      ],
    },
    {
      label: "Billing",
      items: [
        { href: "/admin/subscription-plans", label: "Plans", show: v("subscriptions.view") },
        {
          href: "/admin/user-subscriptions",
          label: "Subscriptions",
          show: v("subscriptions.view"),
        },
      ],
    },
    {
      label: "Product",
      items: [{ href: "/admin/personas", label: "Personas", show: v("personas.view") }],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/ai-usage", label: "AI usage", show: v("ai_usage.view") },
        { href: "/admin/audit-logs", label: "Audit log", show: v("audit_logs.view") },
      ],
    },
  ];
}
