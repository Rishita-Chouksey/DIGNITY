import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DIGNITY',
  description: 'Government scheme discovery',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <nav>
          <b>DIGNITY</b>
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/search">Search</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
