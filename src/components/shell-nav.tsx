'use client';

import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/app', label: 'Home' },
  { href: '/app/new', label: 'New agreement' },
];

export function ShellNav() {
  const path = usePathname();
  return (
    <nav className="shell-nav" aria-label="Workspace">
      <ul>
        {LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} aria-current={path === l.href ? 'page' : undefined}>{l.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
