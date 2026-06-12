'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

const menuItems = [
  { href: '/dashboard', label: 'Workbench', icon: '📊' },
  { href: '/policies', label: 'Policies', icon: '📋' },
  { href: '/claims', label: 'Claims Queue', icon: '🗂' },
  { href: '/configuration', label: 'Configuration', icon: '⚙️' },
  { href: '/settings', label: 'Settings', icon: '🔧' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="border-b border-slate-700 p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold">
            IP
          </div>
          {isOpen && <span className="font-bold">IntelliPolicy</span>}
        </Link>
      </div>

      {/* Menu */}
      <nav className="space-y-2 p-4">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute bottom-4 left-4 rounded-lg bg-slate-700 p-2 hover:bg-slate-600"
      >
        {isOpen ? '«' : '»'}
      </button>
    </div>
  );
}
