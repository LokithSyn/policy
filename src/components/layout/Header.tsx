'use client';

import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const titleMap: Array<[string, string]> = [
    ['/dashboard', 'Claims Workbench'],
    ['/policies', 'Policy Management'],
    ['/claims', 'Claims Queue'],
    ['/configuration', 'Platform Configuration'],
    ['/settings', 'Settings'],
  ];

  const title =
    titleMap.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'IntelliCore';

  return (
    <header className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-slate-500">Manage your insurance policies and claims</p>
        </div>

        {/* User menu placeholder */}
        <div className="flex items-center gap-4">
          <button className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
            🔔
          </button>
          <button className="h-10 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>
    </header>
  );
}
