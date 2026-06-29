'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';

/**
 * Bottom tab navigation (idea.md §1): Recipes, Cook (center/default), History.
 * Cook lives at the root route `/`, so it is both the default landing tab and
 * the visually prominent center action.
 */

interface Tab {
  href: Route;
  label: string;
  icon: string;
}

const TABS: readonly Tab[] = [
  { href: '/recipes', label: 'Recipes', icon: '📖' },
  { href: '/', label: 'Cook', icon: '🍳' },
  { href: '/history', label: 'History', icon: '🕑' },
];

function isActive(pathname: string, href: Route): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="navbar" aria-label="Primary">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        const center = tab.href === '/';
        const className = [
          'nav-tab',
          center ? 'nav-tab-center' : '',
          active ? 'nav-tab-active' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={className}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="nav-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
