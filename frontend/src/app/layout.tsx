import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'LogLens — Observability Platform',
  description: 'Production-grade log observability, analytics, and AI-powered insights for modern engineering teams.',
  keywords: ['observability', 'logging', 'monitoring', 'analytics', 'DevOps'],
};

/**
 * Root Layout — Server Component
 * This is the top-most layout. It sets up global font, metadata, and HTML.
 * ALL pages inherit from this layout.
 * The `(protected)` group layout adds Sidebar + Navbar on top of this.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-gray-950 text-gray-100">
        {children}
      </body>
    </html>
  );
}
