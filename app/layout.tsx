import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const display = localFont({ src: './fonts/big-shoulders-normal.woff2', weight: '700 800', variable: '--ff-display' });
const stamp = localFont({ src: './fonts/big-shoulders-stencil-normal.woff2', weight: '800', variable: '--ff-stamp', preload: false });
const ui = localFont({
  src: './fonts/archivo-normal.woff2',
  weight: '400 700',
  variable: '--ff-ui',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
});
const doc = localFont({
  src: [
    { path: './fonts/source-serif-4-normal.woff2', weight: '400 600', style: 'normal' },
    { path: './fonts/source-serif-4-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--ff-doc',
});

export const metadata: Metadata = {
  title: 'Redline',
  description:
    'Redline reads a freelance client agreement before you sign it, ranks the clauses that could cost you, ties each one to the exact sentence it came from, and drafts the change to ask for.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M9 4h19v24H9L3 22V10z' fill='%23ea4520'/%3E%3Ccircle cx='9' cy='16' r='2.6' fill='%231d2c86'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${stamp.variable} ${ui.variable} ${doc.variable}`}>
      <body>{children}</body>
    </html>
  );
}
